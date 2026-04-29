import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/cn';

export const ThemeToggle = ({ className }) => {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const toggle = () => {
        if (typeof document !== 'undefined') {
            document.documentElement.classList.add('theme-transition');
            window.setTimeout(
                () => document.documentElement.classList.remove('theme-transition'),
                320
            );
        }
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    const isDark = mounted && resolvedTheme === 'dark';

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            className={cn(
                'relative inline-flex h-9 w-9 items-center justify-center rounded-full',
                'border border-border bg-surface text-fg',
                'transition-colors hover:bg-surface-2 focus-ring',
                className
            )}
        >
            <AnimatePresence initial={false} mode="wait">
                <motion.span
                    key={isDark ? 'moon' : 'sun'}
                    initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-flex"
                >
                    {isDark ? <Moon size={16} strokeWidth={1.75} /> : <Sun size={16} strokeWidth={1.75} />}
                </motion.span>
            </AnimatePresence>
        </button>
    );
};

export default ThemeToggle;
