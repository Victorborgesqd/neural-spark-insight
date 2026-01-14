import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

export function ChatMessage({ role, content, isTyping }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={cn(
      "flex gap-3 p-4 rounded-lg transition-all duration-300",
      isUser 
        ? "bg-muted/30 ml-8" 
        : "bg-card/50 border border-primary/20 box-glow-cyan mr-8"
    )}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser 
          ? "bg-secondary/30 border border-secondary/50" 
          : "bg-primary/20 border border-primary/50"
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-secondary" />
        ) : (
          <Bot className="w-4 h-4 text-primary" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className={cn(
          "text-xs font-mono mb-1",
          isUser ? "text-secondary" : "text-primary"
        )}>
          {isUser ? 'VOCÊ' : 'NEURAL.AI'}
        </div>
        
        <div className="text-foreground/90 whitespace-pre-wrap">
          {content}
          {isTyping && (
            <span className="inline-flex gap-1 ml-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
