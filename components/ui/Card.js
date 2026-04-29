import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

export const Card = forwardRef(function Card(
    { as: Comp = 'div', className, interactive = false, children, ...props },
    ref
) {
    const cls = cn(
        'rounded-lg bg-surface border border-border',
        interactive && 'transition-shadow hover:shadow-lift hover:border-fg/15 cursor-pointer',
        className
    );
    if (interactive) {
        return (
            <motion.div
                ref={ref}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                className={cls}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
    return (
        <Comp ref={ref} className={cls} {...props}>
            {children}
        </Comp>
    );
});

export const CardHeader = ({ className, children, ...p }) => (
    <div className={cn('p-6 pb-3', className)} {...p}>{children}</div>
);
export const CardTitle = ({ className, children, ...p }) => (
    <h3 className={cn('text-lg font-medium tracking-tight', className)} {...p}>{children}</h3>
);
export const CardDescription = ({ className, children, ...p }) => (
    <p className={cn('text-sm text-muted mt-1', className)} {...p}>{children}</p>
);
export const CardContent = ({ className, children, ...p }) => (
    <div className={cn('p-6 pt-3', className)} {...p}>{children}</div>
);
export const CardFooter = ({ className, children, ...p }) => (
    <div className={cn('p-6 pt-0 flex items-center', className)} {...p}>{children}</div>
);

export default Card;
