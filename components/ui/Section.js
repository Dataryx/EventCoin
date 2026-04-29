import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

export const Container = ({ className, children, ...p }) => (
    <div className={cn('w-full max-w-[1200px] mx-auto px-5 sm:px-8', className)} {...p}>
        {children}
    </div>
);

export const Section = ({ className, children, ...p }) => (
    <section className={cn('py-12 sm:py-16 lg:py-20', className)} {...p}>
        {children}
    </section>
);

export const Reveal = ({ delay = 0, y = 16, className, children, ...p }) => (
    <motion.div
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
        className={className}
        {...p}
    >
        {children}
    </motion.div>
);

export const Divider = ({ className }) => (
    <div className={cn('h-px w-full bg-border', className)} />
);

export default Section;
