import { useCallback, useState } from 'react';
import { Upload, FileText, Code, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
}

export function UploadZone({ onFilesSelected, accept, maxFiles = 10 }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).slice(0, maxFiles);
    setSelectedFiles(prev => [...prev, ...files].slice(0, maxFiles));
    onFilesSelected([...selectedFiles, ...files].slice(0, maxFiles));
  }, [maxFiles, onFilesSelected, selectedFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, maxFiles);
      setSelectedFiles(prev => [...prev, ...files].slice(0, maxFiles));
      onFilesSelected([...selectedFiles, ...files].slice(0, maxFiles));
    }
  }, [maxFiles, onFilesSelected, selectedFiles]);

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const getFileIcon = (fileName: string) => {
    const codeExtensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.rb'];
    const isCode = codeExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    return isCode ? Code : FileText;
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer group",
          isDragging
            ? "border-primary bg-primary/10 box-glow-cyan"
            : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
        )}
      >
        <input
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className={cn(
          "w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-300",
          isDragging
            ? "bg-primary/30 scale-110"
            : "bg-muted/50 group-hover:bg-primary/20"
        )}>
          <Upload className={cn(
            "w-8 h-8 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground group-hover:text-primary"
          )} />
        </div>
        
        <h3 className="font-display text-lg text-foreground mb-2">
          {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos para ensinar a IA'}
        </h3>
        
        <p className="text-sm text-muted-foreground">
          Documentos, códigos, PDFs, textos...
        </p>
        
        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="w-4 h-4" />
            Documentos
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Code className="w-4 h-4" />
            Código-fonte
          </span>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-mono text-primary">
            Arquivos selecionados ({selectedFiles.length})
          </h4>
          <div className="grid gap-2">
            {selectedFiles.map((file, index) => {
              const Icon = getFileIcon(file.name);
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-card/50 border border-border/50 rounded-lg p-3 group"
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="flex-1 text-sm font-mono truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
