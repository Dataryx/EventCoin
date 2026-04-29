import React from 'react';
import { cn } from '../../lib/cn';

export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
    <div className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        'rounded-lg border border-dashed border-border bg-surface-2/40',
        className
    )}>
        {Icon ? (
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface border border-border text-muted mb-4">
                <Icon size={20} strokeWidth={1.5} />
            </div>
        ) : null}
        {title ? <h3 className="font-serif text-2xl text-fg mb-1.5">{title}</h3> : null}
        {description ? <p className="text-sm text-muted max-w-md">{description}</p> : null}
        {action ? <div className="mt-5">{action}</div> : null}
    </div>
);

export default EmptyState;
