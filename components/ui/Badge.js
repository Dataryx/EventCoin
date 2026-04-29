import React from 'react';
import { cn } from '../../lib/cn';

const tones = {
    neutral: 'bg-surface-2 text-fg/70 border-border',
    accent: 'bg-accent/10 text-accent border-accent/20',
    success: 'bg-accent/10 text-accent border-accent/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    outline: 'bg-transparent text-fg/70 border-border'
};

export const Badge = ({ tone = 'neutral', className, children, ...props }) => (
    <span
        className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
            'text-[11px] font-medium tracking-wide uppercase',
            tones[tone],
            className
        )}
        {...props}
    >
        {children}
    </span>
);

export default Badge;
