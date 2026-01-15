import { Download, FileCode, FileText, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GeneratedFile, downloadFile } from '@/lib/parseGeneratedFiles';
import { toast } from 'sonner';

interface GeneratedFileCardProps {
  file: GeneratedFile;
}

export function GeneratedFileCard({ file }: GeneratedFileCardProps) {
  const getIcon = () => {
    switch (file.type) {
      case 'code':
        return <FileCode className="w-5 h-5 text-primary" />;
      case 'markdown':
        return <FileText className="w-5 h-5 text-secondary" />;
      default:
        return <File className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getExtensionColor = () => {
    const ext = file.filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return 'text-yellow-400';
      case 'py':
        return 'text-blue-400';
      case 'md':
        return 'text-purple-400';
      case 'json':
        return 'text-green-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const handleDownload = () => {
    downloadFile(file);
    toast.success(`Arquivo "${file.filename}" baixado!`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(file.content);
    toast.success('Conteúdo copiado!');
  };

  return (
    <div className="mt-4 border border-primary/30 rounded-lg bg-card/80 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-primary/10 border-b border-primary/20">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <span className={`font-mono text-sm ${getExtensionColor()}`}>
              {file.filename}
            </span>
            {file.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{file.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={copyToClipboard}
            className="text-xs"
          >
            Copiar
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Baixar
          </Button>
        </div>
      </div>
      
      <div className="p-4 max-h-64 overflow-auto">
        <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">
          {file.content.length > 500 
            ? file.content.slice(0, 500) + '\n\n... (baixe para ver o conteúdo completo)'
            : file.content
          }
        </pre>
      </div>
    </div>
  );
}
