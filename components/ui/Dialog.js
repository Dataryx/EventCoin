import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

export const Dialog = ({ open, onClose, title, description, children, footer, className }) => {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                >
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        className={cn(
                            'relative w-full max-w-lg rounded-lg bg-surface border border-border shadow-lift',
                            'overflow-hidden',
                            className
                        )}
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-fg focus-ring"
                        >
                            <X size={15} strokeWidth={1.75} />
                        </button>
                        {(title || description) ? (
                            <div className="px-6 pt-6 pb-3">
                                {title ? <h2 className="font-serif text-2xl text-fg">{title}</h2> : null}
                                {description ? <p className="text-sm text-muted mt-1">{description}</p> : null}
                            </div>
                        ) : null}
                        <div className={cn('px-6', (title || description) ? 'pb-2' : 'py-6')}>{children}</div>
                        {footer ? (
                            <div className="px-6 py-4 border-t border-border bg-surface-2/40 flex items-center justify-end gap-2">
                                {footer}
                            </div>
                        ) : null}
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
};

export default Dialog;
