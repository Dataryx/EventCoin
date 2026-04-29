import React, { forwardRef } from 'react';
import { cn } from '../../lib/cn';

export const Input = forwardRef(function Input(
    { className, error, ...props },
    ref
) {
    return (
        <input
            ref={ref}
            className={cn(
                'flex h-11 w-full rounded-sm bg-surface border border-border px-3.5 py-2',
                'text-[15px] text-fg placeholder:text-muted',
                'transition-colors duration-150 ease-premium',
                'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
                'disabled:opacity-50 disabled:pointer-events-none',
                error && 'border-danger focus:border-danger focus:ring-danger/20 animate-shake',
                className
            )}
            {...props}
        />
    );
});

export const Textarea = forwardRef(function Textarea(
    { className, error, ...props },
    ref
) {
    return (
        <textarea
            ref={ref}
            className={cn(
                'flex w-full min-h-[100px] rounded-sm bg-surface border border-border px-3.5 py-2.5',
                'text-[15px] text-fg placeholder:text-muted',
                'transition-colors duration-150 ease-premium',
                'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
                'disabled:opacity-50 disabled:pointer-events-none resize-y',
                error && 'border-danger focus:border-danger focus:ring-danger/20',
                className
            )}
            {...props}
        />
    );
});

export const Label = forwardRef(function Label({ className, children, ...p }, ref) {
    return (
        <label ref={ref} className={cn('text-sm font-medium text-fg/85 tracking-tight', className)} {...p}>
            {children}
        </label>
    );
});

export const Field = ({ label, hint, error, children, className }) => (
    <div className={cn('flex flex-col gap-1.5', className)}>
        {label ? <Label>{label}</Label> : null}
        {children}
        {error ? (
            <p className="text-xs text-danger">{error}</p>
        ) : hint ? (
            <p className="text-xs text-muted">{hint}</p>
        ) : null}
    </div>
);

export default Input;
