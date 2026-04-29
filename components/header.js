import React, { useEffect, useState } from 'react';
import { Link } from '../routes';
import { Ticket } from 'lucide-react';
import { ThemeToggle, Container, WalletPill } from './ui';
import { motion } from 'framer-motion';

const Header = ({ wallet, nav }) => {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`sticky top-0 z-40 w-full transition-colors duration-300 ${
                scrolled
                    ? 'bg-bg/85 backdrop-blur-md border-b border-border'
                    : 'bg-bg/0 border-b border-transparent'
            }`}
        >
            <Container className="flex h-16 items-center justify-between">
                <Link route="/" legacyBehavior>
                    <a className="group inline-flex items-center gap-2.5 focus-ring rounded-sm">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-fg transition-transform duration-300 ease-premium group-hover:rotate-[-8deg]">
                            <Ticket size={15} strokeWidth={2} />
                        </span>
                        <span className="font-serif text-xl tracking-tight leading-none">
                            EventCoin
                        </span>
                    </a>
                </Link>

                <nav className="flex items-center gap-1.5">
                    {nav}
                    {wallet ? <WalletPill address={wallet} /> : null}
                    <ThemeToggle />
                </nav>
            </Container>
        </motion.header>
    );
};

export default Header;
