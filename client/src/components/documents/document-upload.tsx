import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadFile } from '@/lib/file-upload';
import { useToast } from '@/hooks/use-toast';
import { Claim } from '@shared/schema';

interface DocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  claims: Claim[];
  initialClaimId?: number | null;
  onSuccess?: (data: any) => void;
}

export default function DocumentUpload({ 
  isOpen, 
  onClose, 
  claims, 
  initialClaimId = null,
  onSuccess 
}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<number | null>(initialClaimId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      
      setSelectedFile(null);
      setSelectedClaimId(initialClaimId);
      
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
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data);
      }
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return 'picture_as_pdf';
    if (fileType.includes('word') || fileType.includes('doc')) return 'description';
    if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('xls')) return 'table_chart';
    if (fileType.includes('image')) return 'image';
    return 'insert_drive_file';
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Check if the file is a Boon claim form based on name
  const isBoonClaimForm = (file: File | null) => {
    if (!file) return false;
    const fileName = file.name.toLowerCase();
    return fileName.includes('claim') && fileName.includes('form') || 
           fileName.includes('boon') || 
           (file.type === 'application/pdf' && file.name.match(/claim|form/i));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
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
                    <div className="flex flex-col">
                      <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                      {isBoonClaimForm(selectedFile) && (
                        <span className="text-xs text-green-600">Detected as Boon claim form</span>
                      )}
                    </div>
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
                  className="w-full h-20 border-dashed flex flex-col gap-1"
                  onClick={handleFileSelect}
                >
                  <span className="material-icons text-neutral-500">upload_file</span>
                  <span className="text-sm">Select a file</span>
                </Button>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Associated Claim (Optional)</p>
              <Select 
                value={selectedClaimId?.toString() || ""} 
                onValueChange={(value) => setSelectedClaimId(value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a claim" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No claim (create new if applicable)</SelectItem>
                  {claims.map((claim) => claim.id && (
                    <SelectItem key={claim.id} value={claim.id.toString()}>
                      {claim.claimNumber} - {claim.shipperName || "Unknown Customer"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Improved guidance for users */}
              {!selectedClaimId && isBoonClaimForm(selectedFile) ? (
                <div className="text-xs bg-blue-50 text-blue-800 p-2 rounded border border-blue-200 mt-2">
                  <div className="font-medium mb-1 flex items-center">
                    <span className="material-icons text-blue-500 mr-1" style={{ fontSize: '14px' }}>info</span>
                    Processing Boon Claim Form
                  </div>
                  <p>
                    This appears to be a Boon claim form. When uploaded, our AI will analyze the form, extract 
                    available information, and highlight any missing data that needs to be filled in.
                  </p>
                </div>
              ) : !selectedClaimId && (
                <p className="text-xs text-neutral-500 mt-1">
                  If you upload a claim form without selecting a claim, a new claim will be created automatically.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
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
    </>
  );
}