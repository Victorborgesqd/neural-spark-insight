import { FileText, Code, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentCardProps {
  name: string;
  type: 'document' | 'code';
  size: string;
  status: 'processing' | 'learned' | 'pending';
  onRemove: () => void;
}

export function DocumentCard({ name, type, size, status, onRemove }: DocumentCardProps) {
  const Icon = type === 'code' ? Code : FileText;
  
  const statusConfig = {
    processing: {
      label: 'Processando',
      icon: Loader2,
      color: 'text-accent',
      glow: 'box-glow-purple'
    },
    learned: {
      label: 'Aprendido',
      icon: CheckCircle,
      color: 'text-primary',
      glow: 'box-glow-cyan'
    },
    pending: {
      label: 'Pendente',
      icon: FileText,
      color: 'text-muted-foreground',
      glow: ''
    }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className={cn(
      "group relative bg-card/50 border border-border/50 rounded-lg p-4 transition-all duration-300 hover:border-primary/50",
      status === 'processing' && 'animate-pulse',
      config.glow
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
          type === 'code' ? 'bg-accent/20 border border-accent/30' : 'bg-secondary/20 border border-secondary/30'
        )}>
          <Icon className={cn(
            "w-5 h-5",
            type === 'code' ? 'text-accent' : 'text-secondary'
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-mono text-sm text-foreground truncate">{name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{size}</p>
          
          <div className={cn("flex items-center gap-1.5 mt-2", config.color)}>
            <StatusIcon className={cn(
              "w-3.5 h-3.5",
              status === 'processing' && 'animate-spin'
            )} />
            <span className="text-xs font-mono">{config.label}</span>
          </div>
        </div>

        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
