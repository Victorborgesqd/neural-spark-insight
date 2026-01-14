import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  color?: 'cyan' | 'purple' | 'pink';
}

export function StatCard({ icon: Icon, label, value, trend, color = 'cyan' }: StatCardProps) {
  const colorConfig = {
    cyan: {
      iconBg: 'bg-primary/20 border-primary/30',
      iconColor: 'text-primary',
      glow: 'box-glow-cyan'
    },
    purple: {
      iconBg: 'bg-secondary/20 border-secondary/30',
      iconColor: 'text-secondary',
      glow: 'box-glow-purple'
    },
    pink: {
      iconBg: 'bg-accent/20 border-accent/30',
      iconColor: 'text-accent',
      glow: ''
    }
  };

  const config = colorConfig[color];

  return (
    <div className={cn(
      "bg-card/50 border border-border/50 rounded-xl p-5 transition-all duration-300 hover:border-primary/30",
      config.glow
    )}>
      <div className="flex items-start justify-between">
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center border",
          config.iconBg
        )}>
          <Icon className={cn("w-6 h-6", config.iconColor)} />
        </div>
        
        {trend && (
          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      
      <div className="mt-4">
        <p className="text-2xl font-display font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}
