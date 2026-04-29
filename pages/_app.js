import React from 'react';
import { ThemeProvider } from 'next-themes';
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { ToastProvider } from '../components/ui';
import '../styles/globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap'
});

const serif = Instrument_Serif({
    subsets: ['latin'],
    weight: '400',
    variable: '--font-instrument-serif',
    display: 'swap'
});

const mono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains',
    display: 'swap'
});

const fontVars = `${inter.variable} ${serif.variable} ${mono.variable}`;

export default function App({ Component, pageProps, router }) {
    const r = useRouter();
    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <ToastProvider>
                <div className={`${fontVars} font-sans bg-bg text-fg min-h-screen`}>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={r.asPath}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <Component {...pageProps} />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </ToastProvider>
        </ThemeProvider>
    );
}
