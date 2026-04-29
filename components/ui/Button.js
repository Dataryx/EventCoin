import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

const variants = {
    primary:
        'bg-accent text-accent-fg hover:bg-accent-hover shadow-sm hover:shadow-lift',
    secondary:
        'bg-surface text-fg border border-border hover:bg-surface-2',
    ghost: 'bg-transparent text-fg hover:bg-surface-2',
    outline:
        'bg-transparent text-fg border border-border hover:border-fg/40 hover:bg-surface-2',
    danger:
        'bg-danger text-white hover:opacity-90 shadow-sm hover:shadow-lift'
};

const sizes = {
    sm: 'h-9 px-3 text-sm rounded-sm gap-1.5',
    md: 'h-11 px-5 text-[15px] rounded-md gap-2',
    lg: 'h-13 px-7 text-base rounded-md gap-2.5'
};

const Button = forwardRef(function Button(
    {
        as: Comp = 'button',
        variant = 'primary',
        size = 'md',
        className,
        leftIcon,
        rightIcon,
        loading = false,
        children,
        disabled,
        ...props
    },
    ref
) {
    const isMotion = Comp === 'button';
    const Tag = isMotion ? motion.button : Comp;

    return (
        <Tag
            ref={ref}
            disabled={disabled || loading}
            whileHover={isMotion ? { y: -1 } : undefined}
            whileTap={isMotion ? { y: 0, scale: 0.98 } : undefined}
            transition={isMotion ? { type: 'spring', stiffness: 380, damping: 26 } : undefined}
            className={cn(
                'inline-flex items-center justify-center font-medium tracking-tight',
                'transition-colors duration-200 ease-premium',
                'focus-ring disabled:opacity-50 disabled:pointer-events-none',
                'whitespace-nowrap select-none',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {loading ? (
                <span className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : leftIcon ? (
                <span className="inline-flex shrink-0">{leftIcon}</span>
            ) : null}
            {children}
            {!loading && rightIcon ? (
                <span className="inline-flex shrink-0">{rightIcon}</span>
            ) : null}
        </Tag>
    );
});

export default Button;
