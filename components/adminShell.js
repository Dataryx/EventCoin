import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Calendar, ShieldCheck, Wallet, ArrowDownToLine, FileText,
    Plug, FileClock, Settings as SettingsIcon, Ticket, Menu, X
} from 'lucide-react';
import { Link } from '../routes';
import Layout from './layout';
import {
    Container, ThemeToggle, WalletPill, Button, Reveal
} from './ui';
import { cn } from '../lib/cn';

const navSections = [
    {
        title: 'Main',
        items: [
            { label: 'Dashboard', route: '/admin/dashboard', icon: LayoutDashboard },
            { label: 'Events', route: '/admin/events', icon: Calendar },
            { label: 'Ticket validation', route: '/admin/ticket-validation', icon: ShieldCheck }
        ]
    },
    {
        title: 'Finance',
        items: [
            { label: 'Revenue', route: '/admin/revenue', icon: Wallet },
            { label: 'Payouts', route: '/admin/payouts', icon: ArrowDownToLine },
            { label: 'Invoices', route: '/admin/invoices', icon: FileText }
        ]
    },
    {
        title: 'System',
        items: [
            { label: 'Integrations', route: '/admin/integrations', icon: Plug },
            { label: 'Audit logs', route: '/admin/audit-logs', icon: FileClock },
            { label: 'Settings', route: '/admin/settings', icon: SettingsIcon }
        ]
    }
];

const Sidebar = ({ activeRoute, walletAddress, onClose }) => (
    <div className="flex flex-col h-full bg-surface border border-border rounded-lg">
        <div className="p-5 flex items-center justify-between border-b border-border">
            <Link route="/admin/dashboard" legacyBehavior>
                <a className="inline-flex items-center gap-2.5 group focus-ring rounded-sm">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-fg transition-transform duration-300 ease-premium group-hover:rotate-[-8deg]">
                        <Ticket size={14} strokeWidth={2} />
                    </span>
                    <div>
                        <div className="font-serif text-lg leading-none">EventCoin</div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-muted mt-0.5">Admin</div>
                    </div>
                </a>
            </Link>
            {onClose ? (
                <button onClick={onClose} className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-2">
                    <X size={15} />
                </button>
            ) : null}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
            {navSections.map((section) => (
                <div key={section.title} className="mb-5">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted font-medium px-3 py-2">
                        {section.title}
                    </p>
                    {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeRoute === item.route;
                        return (
                            <Link key={item.route} route={item.route} legacyBehavior>
                                <a
                                    onClick={onClose}
                                    className={cn(
                                        'flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm transition-colors mb-0.5',
                                        isActive
                                            ? 'bg-accent/10 text-accent font-medium'
                                            : 'text-fg/75 hover:text-fg hover:bg-surface-2'
                                    )}
                                >
                                    <Icon size={14} strokeWidth={1.75} />
                                    <span>{item.label}</span>
                                    {isActive ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" /> : null}
                                </a>
                            </Link>
                        );
                    })}
                </div>
            ))}
        </div>
        <div className="p-4 border-t border-border">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted font-medium mb-2">Connected wallet</p>
            <p className="font-mono text-xs text-fg/80 break-all">{walletAddress || 'Not connected'}</p>
        </div>
    </div>
);

const AdminShell = ({
    activeRoute,
    title,
    subtitle,
    walletAddress,
    topActions,
    heroTitle,
    heroDescription,
    heroActions,
    children
}) => {
    const [mobileNav, setMobileNav] = useState(false);
    useEffect(() => {
        if (mobileNav) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
    }, [mobileNav]);

    return (
        <Layout title={title} hideHeader>
            <div className="min-h-screen bg-bg">
                <header className="sticky top-0 z-30 backdrop-blur-md bg-bg/85 border-b border-border">
                    <Container className="flex h-14 items-center justify-between gap-3">
                        <button
                            onClick={() => setMobileNav(true)}
                            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-fg/70 hover:bg-surface-2"
                            aria-label="Open navigation"
                        >
                            <Menu size={15} />
                        </button>
                        <div className="hidden lg:flex items-center gap-3">
                            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Admin · {activeRoute?.replace('/admin/', '') || 'overview'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <WalletPill address={walletAddress} />
                            <ThemeToggle />
                        </div>
                    </Container>
                </header>

                <Container className="py-5 lg:py-8">
                    <div className="grid lg:grid-cols-[260px_1fr] gap-6">
                        <aside className="hidden lg:block sticky top-20 self-start h-[calc(100vh-7rem)]">
                            <Sidebar activeRoute={activeRoute} walletAddress={walletAddress} />
                        </aside>

                        {mobileNav ? (
                            <div className="lg:hidden fixed inset-0 z-50 flex">
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                                    onClick={() => setMobileNav(false)}
                                />
                                <motion.div
                                    initial={{ x: -320 }} animate={{ x: 0 }}
                                    transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                                    className="relative w-72 max-w-[85vw] p-3"
                                >
                                    <Sidebar
                                        activeRoute={activeRoute}
                                        walletAddress={walletAddress}
                                        onClose={() => setMobileNav(false)}
                                    />
                                </motion.div>
                            </div>
                        ) : null}

                        <main className="min-w-0">
                            <Reveal>
                                <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                                    <div>
                                        <h1 className="font-serif text-3xl sm:text-4xl text-fg tracking-tight">{title}</h1>
                                        {subtitle ? <p className="mt-1.5 text-[15px] text-muted">{subtitle}</p> : null}
                                    </div>
                                    {topActions ? (
                                        <div className="flex items-center gap-2 flex-wrap">{topActions}</div>
                                    ) : null}
                                </div>
                            </Reveal>

                            {heroTitle ? (
                                <Reveal delay={0.05}>
                                    <section className="relative mb-6 overflow-hidden rounded-lg border border-border bg-fg text-bg p-7 sm:p-9">
                                        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-accent/30 blur-3xl pointer-events-none" />
                                        <div className="relative">
                                            <span className="text-[10px] uppercase tracking-[0.2em] text-bg/60 font-medium">Command center</span>
                                            <h2 className="font-serif text-2xl sm:text-3xl mt-2">{heroTitle}</h2>
                                            {heroDescription ? <p className="mt-2 text-[15px] text-bg/75 max-w-2xl">{heroDescription}</p> : null}
                                            {heroActions ? <div className="mt-5 flex items-center gap-2 flex-wrap">{heroActions}</div> : null}
                                        </div>
                                    </section>
                                </Reveal>
                            ) : null}

                            <div>{children}</div>
                        </main>
                    </div>
                </Container>
            </div>
        </Layout>
    );
};

export default AdminShell;
