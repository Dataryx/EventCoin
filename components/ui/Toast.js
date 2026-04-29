import React, { createContext, useCallback, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/cn';

const ToastContext = createContext(null);

const icons = {
    success: <CheckCircle2 size={16} strokeWidth={1.75} className="text-accent" />,
    error: <AlertCircle size={16} strokeWidth={1.75} className="text-danger" />,
    info: <Info size={16} strokeWidth={1.75} className="text-fg/70" />
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const push = useCallback((toast) => {
        const id = Math.random().toString(36).slice(2);
        const t = { id, type: 'info', duration: 4000, ...toast };
        setToasts((cur) => [...cur, t]);
        if (t.duration > 0) {
            setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), t.duration);
        }
        return id;
    }, []);

    const dismiss = useCallback((id) => {
        setToasts((cur) => cur.filter((x) => x.id !== id));
    }, []);

    const api = {
        toast: push,
        success: (message, opts = {}) => push({ type: 'success', message, ...opts }),
        error: (message, opts = {}) => push({ type: 'error', message, ...opts }),
        info: (message, opts = {}) => push({ type: 'info', message, ...opts }),
        dismiss
    };

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className="fixed top-4 right-4 z-[60] flex flex-col items-end gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 30, scale: 0.96 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className={cn(
                                'pointer-events-auto flex items-start gap-3 min-w-[260px] max-w-md',
                                'rounded-md border border-border bg-surface shadow-lift px-4 py-3'
                            )}
                        >
                            <span className="mt-0.5">{icons[t.type] || icons.info}</span>
                            <div className="flex-1 text-sm text-fg/90">
                                {t.title ? <div className="font-medium">{t.title}</div> : null}
                                {t.message ? <div className="text-fg/70">{t.message}</div> : null}
                            </div>
                            <button
                                onClick={() => dismiss(t.id)}
                                className="text-muted hover:text-fg transition-colors"
                                aria-label="Dismiss"
                            >
                                <X size={14} strokeWidth={1.75} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        return {
            toast: () => {}, success: () => {}, error: () => {}, info: () => {}, dismiss: () => {}
        };
    }
    return ctx;
};

export default ToastProvider;
