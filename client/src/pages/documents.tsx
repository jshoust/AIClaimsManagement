import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Document } from "@shared/schema";
import { formatDate } from "@/lib/format-date";
import { uploadFile } from "@/lib/file-upload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
         AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useDocuments } from "@/hooks/use-documents";

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use documents hook
  const { documents: documentsQuery, deleteDocument } = useDocuments();
  const { data: documents, isLoading } = documentsQuery;
  
  // Fetch claims data to associate with documents
  const { data: claims = [] } = useQuery<any[]>({
    queryKey: ['/api/claims'],
  });
  
  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error("No file selected");
      }
      return uploadFile(selectedFile, selectedClaimId);
    },
    onSuccess: (data) => {
      // Invalidate both documents and claims queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/claims'] });
      
      // Also invalidate tasks if a new claim was created
      if (data.claim) {
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      }
      
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setSelectedClaimId(null);
      
      // Custom message if a new claim was created
      if (data.claim) {
        toast({
          title: "Claim Created",
          description: `New claim #${data.claim.claimNumber} was created from the uploaded document.`,
        });
      } else {
        toast({
          title: "File Uploaded",
          description: "The document was uploaded successfully.",
        });
      }
      
      // Select newly created document
      if (data.document) {
        setSelectedDocument(data.document);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Map claim ID to claim details
  const claimsMap = new Map();
  claims.forEach((claim: any) => {
    claimsMap.set(claim.id, claim);
  });
  
  // Filter documents based on search term
  const filteredDocuments = documents?.filter(doc => 
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (claimsMap.get(doc.claimId)?.claimNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  // Group documents by file type
  const getDocumentsByType = (type: string) => {
    return filteredDocuments.filter(doc => doc.fileType === type);
  };
  
  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf') return 'picture_as_pdf';
    if (fileType === 'docx' || fileType === 'doc') return 'description';
    if (fileType === 'xlsx' || fileType === 'xls') return 'table_chart';
    if (fileType.includes('image')) return 'image';
    return 'insert_drive_file';
  };
  
  return (
    <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-medium text-neutral-800">Documents</h2>
          <div className="flex gap-3">
            <Button onClick={() => setUploadDialogOpen(true)}>
              <span className="material-icons mr-1 text-sm">upload_file</span>
              Upload Documents
            </Button>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Document Library</CardTitle>
                  <div className="relative w-64">
                    <Input
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    <span className="material-icons absolute left-3 top-2 text-neutral-400">search</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All Documents</TabsTrigger>
                    <TabsTrigger value="forms">Claim Forms</TabsTrigger>
                    <TabsTrigger value="photos">Photos</TabsTrigger>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="mt-4">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : filteredDocuments.length === 0 ? (
                      <div className="text-center py-8 text-neutral-500">
                        No documents found
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredDocuments.map((doc) => (
                          <div 
                            key={doc.id} 
                            className={`border rounded-md p-3 cursor-pointer hover:border-primary hover:bg-blue-50 ${
                              selectedDocument?.id === doc.id ? 'border-primary bg-blue-50' : ''
                            }`}
                            onClick={() => setSelectedDocument(doc)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-md bg-primary bg-opacity-10 flex items-center justify-center flex-shrink-0">
                                <span className="material-icons text-primary">{getFileIcon(doc.fileType)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-neutral-800 truncate">{doc.fileName}</h4>
                                <div className="flex justify-between items-center mt-1">
                                  <p className="text-xs text-neutral-500">
                                    {claimsMap.get(doc.claimId) 
                                      ? `Claim #${claimsMap.get(doc.claimId).claimNumber}` 
                                      : 'No claim associated'}
                                  </p>
                                  <span className="text-xs text-neutral-500">{formatDate(doc.uploadedAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="forms" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getDocumentsByType('pdf').map((doc) => (
                        <div 
                          key={doc.id} 
                          className="border rounded-md p-3 cursor-pointer hover:border-primary hover:bg-blue-50"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-md bg-red-100 flex items-center justify-center flex-shrink-0">
                              <span className="material-icons text-red-600">picture_as_pdf</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-neutral-800 truncate">{doc.fileName}</h4>
                              <div className="flex justify-between items-center mt-1">
                                <p className="text-xs text-neutral-500">
                                  {claimsMap.get(doc.claimId) 
                                    ? `Claim #${claimsMap.get(doc.claimId).claimNumber}` 
                                    : 'No claim associated'}
                                </p>
                                <span className="text-xs text-neutral-500">{formatDate(doc.uploadedAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="photos" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getDocumentsByType('image').map((doc) => (
                        <div 
                          key={doc.id} 
                          className="border rounded-md p-3 cursor-pointer hover:border-primary hover:bg-blue-50"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="material-icons text-blue-600">image</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-neutral-800 truncate">{doc.fileName}</h4>
                              <div className="flex justify-between items-center mt-1">
                                <p className="text-xs text-neutral-500">
                                  {claimsMap.get(doc.claimId) 
                                    ? `Claim #${claimsMap.get(doc.claimId).claimNumber}` 
                                    : 'No claim associated'}
                                </p>
                                <span className="text-xs text-neutral-500">{formatDate(doc.uploadedAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="invoices" className="mt-4">
                    <div className="text-center py-8 text-neutral-500">
                      No invoice documents found
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="reports" className="mt-4">
                    <div className="text-center py-8 text-neutral-500">
                      No report documents found
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Document Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDocument ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="h-16 w-16 rounded-md bg-primary bg-opacity-10 flex items-center justify-center">
                        <span className="material-icons text-primary text-3xl">
                          {getFileIcon(selectedDocument.fileType)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-center font-medium">{selectedDocument.fileName}</h3>
                      <p className="text-center text-sm text-neutral-500">
                        {selectedDocument.fileType.toUpperCase()} • 
                        {' Uploaded on '}{formatDate(selectedDocument.uploadedAt)}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Associated Claim</p>
                      {claimsMap.get(selectedDocument.claimId) ? (
                        <div className="border rounded-md p-2">
                          <p className="text-sm font-medium">
                            #{claimsMap.get(selectedDocument.claimId).claimNumber}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {claimsMap.get(selectedDocument.claimId).customerName}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-500">
                          No claim associated
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Uploaded By</p>
                      <p className="text-sm">{selectedDocument.uploadedBy}</p>
                    </div>
                    
                    <div className="pt-2 space-y-2">
                      <Button 
                        className="w-full flex items-center gap-1"
                        onClick={() => {
                          if (selectedDocument && selectedDocument.filePath) {
                            const filenameMatch = selectedDocument.filePath.match(/[^/\\]+$/);
                            if (filenameMatch) {
                              window.open(`/uploads/${filenameMatch[0]}`, '_blank');
                            }
                          }
                        }}
                      >
                        <span className="material-icons text-sm">visibility</span>
                        View Document
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full flex items-center gap-1"
                        onClick={() => {
                          if (selectedDocument && selectedDocument.filePath) {
                            const filenameMatch = selectedDocument.filePath.match(/[^/\\]+$/);
                            if (filenameMatch) {
                              const link = document.createElement('a');
                              link.href = `/uploads/${filenameMatch[0]}`;
                              link.download = selectedDocument.fileName;
                              link.click();
                            }
                          }
                        }}
                      >
                        <span className="material-icons text-sm">download</span>
                        Download
                      </Button>
                      <Button variant="outline" className="w-full flex items-center gap-1">
                        <span className="material-icons text-sm">share</span>
                        Share
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="w-full flex items-center gap-1"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <span className="material-icons text-sm">delete</span>
                        Delete Document
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                      <span className="material-icons text-neutral-400 text-3xl">description</span>
                    </div>
                    <h4 className="text-neutral-500 font-medium">No document selected</h4>
                    <p className="text-sm text-neutral-400 mt-1">Select a document to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-500 bg-neutral-50">
                    <th className="px-4 py-2 font-medium">File Name</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Claim</th>
                    <th className="px-4 py-2 font-medium">Uploaded By</th>
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-neutral-500">
                        No documents found
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments
                      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                      .slice(0, 5)
                      .map((doc) => (
                        <tr key={doc.id} className="hover:bg-neutral-50 border-b border-neutral-200">
                          <td className="px-4 py-3 font-medium">
                            <div className="flex items-center">
                              <span className="material-icons mr-2 text-neutral-500">
                                {getFileIcon(doc.fileType)}
                              </span>
                              {doc.fileName}
                            </div>
                          </td>
                          <td className="px-4 py-3 uppercase text-xs">{doc.fileType}</td>
                          <td className="px-4 py-3">
                            {claimsMap.get(doc.claimId) 
                              ? `#${claimsMap.get(doc.claimId).claimNumber}` 
                              : 'N/A'}
                          </td>
                          <td className="px-4 py-3">{doc.uploadedBy}</td>
                          <td className="px-4 py-3 text-neutral-500">{formatDate(doc.uploadedAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  if (doc.filePath) {
                                    const filenameMatch = doc.filePath.match(/[^/\\]+$/);
                                    if (filenameMatch) {
                                      window.open(`/uploads/${filenameMatch[0]}`, '_blank');
                                    }
                                  }
                                }}
                              >
                                <span className="material-icons text-primary">visibility</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  if (doc.filePath) {
                                    const filenameMatch = doc.filePath.match(/[^/\\]+$/);
                                    if (filenameMatch) {
                                      const link = document.createElement('a');
                                      link.href = `/uploads/${filenameMatch[0]}`;
                                      link.download = doc.fileName;
                                      link.click();
                                    }
                                  }
                                }}
                              >
                                <span className="material-icons text-primary">download</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDocument(doc);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <span className="material-icons text-red-500">delete</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Document Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedDocument) {
                  deleteDocument.mutate(selectedDocument.id, {
                    onSuccess: () => {
                      setSelectedDocument(null);
                      setDeleteDialogOpen(false);
                    }
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDocument.isPending ? (
                <>
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                  Deleting...
                </>
              ) : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document to the system. You can optionally associate it with a claim.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">File</p>
              {selectedFile ? (
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center">
                    <span className="material-icons mr-2 text-neutral-500">
                      {getFileIcon(selectedFile.type)}
                    </span>
                    <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-full" 
                    onClick={() => setSelectedFile(null)}
                  >
                    <span className="material-icons text-neutral-500">close</span>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-24 border-dashed flex flex-col gap-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="material-icons text-2xl">upload_file</span>
                  <span>Click to select file</span>
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Associated Claim (Optional)</p>
              <Select 
                value={selectedClaimId?.toString() || "none"} 
                onValueChange={(value) => {
                  // If "none" was selected, set to null, otherwise convert to number
                  setSelectedClaimId(value === "none" ? null : parseInt(value));
                }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a claim" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {claims.map((claim) => (
                    <SelectItem key={claim.id} value={claim.id.toString()}>
                      {claim.claimNumber} - {claim.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button 
              disabled={!selectedFile || uploadMutation.isPending} 
              onClick={() => uploadMutation.mutate()}
            >
              {uploadMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                  Uploading...
                </>
              ) : "Upload Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
