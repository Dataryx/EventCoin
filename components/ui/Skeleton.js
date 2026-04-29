import React from 'react';
import { cn } from '../../lib/cn';

export const Skeleton = ({ className, ...props }) => (
    <div
        className={cn(
            'rounded-sm bg-surface-2 relative overflow-hidden',
            'before:absolute before:inset-0 before:-translate-x-full',
            'before:bg-gradient-to-r before:from-transparent before:via-fg/5 before:to-transparent',
            'before:animate-shimmer',
            className
        )}
        {...props}
    />
);

export default Skeleton;
