import { useState } from 'react';
import { AlertTriangle, CheckCircle, Lightbulb, Copy, Check, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Issue {
  type: 'warning' | 'improvement' | 'duplicate';
  title: string;
  description: string;
  line?: number;
  suggestion?: string;
}

interface CodeAnalysisProps {
  fileName: string;
  issues: Issue[];
  onApplySuggestion?: (issue: Issue) => void;
}

export function CodeAnalysis({ fileName, issues, onApplySuggestion }: CodeAnalysisProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const typeConfig = {
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30'
    },
    improvement: {
      icon: Lightbulb,
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/30'
    },
    duplicate: {
      icon: Code2,
      color: 'text-accent',
      bg: 'bg-accent/10',
      border: 'border-accent/30'
    }
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 box-glow-cyan">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display text-lg text-foreground mb-2">Código Otimizado</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Nenhum problema encontrado. O código está bem estruturado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-sm text-primary">{fileName}</h3>
        <span className="text-xs text-muted-foreground font-mono">
          {issues.length} {issues.length === 1 ? 'problema' : 'problemas'}
        </span>
      </div>

      <div className="space-y-3">
        {issues.map((issue, index) => {
          const config = typeConfig[issue.type];
          const Icon = config.icon;

          return (
            <div
              key={index}
              className={cn(
                "rounded-lg border p-4 transition-all duration-300",
                config.bg,
                config.border
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.color)} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-foreground">{issue.title}</h4>
                    {issue.line && (
                      <span className="text-xs font-mono text-muted-foreground">
                        Linha {issue.line}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    {issue.description}
                  </p>

                  {issue.suggestion && (
                    <div className="mt-3 bg-background/50 rounded-md p-3 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-primary">Sugestão:</span>
                        <button
                          onClick={() => handleCopy(issue.suggestion!, index)}
                          className="p-1 rounded hover:bg-primary/20 transition-colors"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                      <code className="text-xs font-mono text-foreground/80 block whitespace-pre-wrap">
                        {issue.suggestion}
                      </code>
                    </div>
                  )}

                  {onApplySuggestion && issue.suggestion && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onApplySuggestion(issue)}
                      className="mt-3 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      Aplicar Sugestão
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
