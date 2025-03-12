import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Document } from '@shared/schema';
import { formatDate } from '@/lib/format-date';

interface DocumentPreviewProps {
  document: Document;
}

export default function DocumentPreview({ document }: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document && document.filePath) {
      // Extract the filename from the path
      const fullPath = document.filePath;
      const filenameMatch = fullPath.match(/[^/\\]+$/); // Extract the last part of the path
      
      if (filenameMatch) {
        // Use the extracted filename to build the URL
        setPreviewUrl(`/uploads/${filenameMatch[0]}`);
        setIsLoading(false);
      } else {
        setError('Invalid file path');
        setIsLoading(false);
      }
    } else {
      setError('No document available');
      setIsLoading(false);
    }
  }, [document]);

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf' || fileType.includes('pdf')) return 'picture_as_pdf';
    if (fileType.includes('word') || fileType.includes('doc')) return 'description';
    if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('xls')) return 'table_chart';
    if (fileType.includes('image')) return 'image';
    return 'insert_drive_file';
  };

  const openDocument = () => {
    if (previewUrl) {
      // Check if the file exists first
      const link = window.document.createElement('a');
      link.href = previewUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const downloadDocument = () => {
    if (previewUrl) {
      const link = window.document.createElement('a');
      link.href = previewUrl;
      link.download = document.fileName; // This is the Document parameter type, not the global document
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
              <span className="material-icons text-neutral-400 text-3xl">error_outline</span>
            </div>
            <h4 className="text-neutral-500 font-medium">Document unavailable</h4>
            <p className="text-sm text-neutral-400 mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex flex-col items-center mb-4">
          <div className="h-16 w-16 rounded-md bg-primary bg-opacity-10 flex items-center justify-center mb-2">
            <span className="material-icons text-primary text-3xl">
              {getFileIcon(document.fileType)}
            </span>
          </div>
          <h3 className="text-center font-medium text-base">{document.fileName}</h3>
          <p className="text-center text-sm text-neutral-500">
            {document.fileType.toUpperCase()} • {formatDate(document.uploadedAt)}
          </p>
        </div>

        {document.fileType.includes('pdf') || document.fileType.includes('image') ? (
          <div className="overflow-hidden rounded-md border border-neutral-200 mb-4">
            <div className="aspect-[4/3] relative bg-neutral-50">
              {document.fileType.includes('pdf') ? (
                <object
                  data={previewUrl || ''}
                  type="application/pdf"
                  className="absolute inset-0 w-full h-full"
                  title={document.fileName}
                >
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <p className="text-sm text-neutral-500 mb-2">PDF preview not loading?</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={openDocument}
                      className="text-xs"
                    >
                      Open PDF in new tab
                    </Button>
                  </div>
                </object>
              ) : (
                <img 
                  src={previewUrl || ''}
                  alt={document.fileName} 
                  className="absolute inset-0 w-full h-full object-contain p-4"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="bg-neutral-50 rounded-md border border-neutral-200 p-4 text-center mb-4">
            <p className="text-sm text-neutral-500">Preview not available for this file type</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            className="flex-1 flex items-center justify-center gap-1"
            onClick={openDocument}
          >
            <span className="material-icons text-sm">visibility</span>
            View Full
          </Button>
          <Button 
            variant="outline"
            className="flex-1 flex items-center justify-center gap-1"
            onClick={downloadDocument}
          >
            <span className="material-icons text-sm">download</span>
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}