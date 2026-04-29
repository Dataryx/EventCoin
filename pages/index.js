import React from 'react';
import Layout from '../components/layout';
import { Link } from '../routes';
import { motion } from 'framer-motion';
import { ArrowUpRight, ShieldCheck, QrCode, Ticket as TicketIcon } from 'lucide-react';
import {
    Button,
    Card,
    CardContent,
    Container,
    Section,
    Reveal,
    Badge,
    Divider
} from '../components/ui';

const portals = [
    {
        href: '/admin/login',
        eyebrow: 'For organizers',
        title: 'Admin Portal',
        description: 'Curate events, manage supply, and validate tickets at the door.',
        cta: 'Enter as admin'
    },
    {
        href: '/client/login',
        eyebrow: 'For attendees',
        title: 'Client Portal',
        description: 'Discover upcoming events, secure your seat, and carry your QR ticket on-chain.',
        cta: 'Enter as client'
    }
];

const pillars = [
    {
        icon: ShieldCheck,
        title: 'On-chain by default',
        body: 'Every ticket is minted, transferred, and validated through the contract — no spreadsheets, no scalpers.'
    },
    {
        icon: QrCode,
        title: 'QR delivered instantly',
        body: 'Receive a verifiable QR ticket the moment your transaction confirms. Carry it offline.'
    },
    {
        icon: TicketIcon,
        title: 'Built for events',
        body: 'Refunds, transfers, validation, and a clean admin command center — purpose-built, not bolted on.'
    }
];

const LoginPortal = () => {
    return (
        <Layout title="Premium event ticketing on-chain">
            <Section className="pt-16 sm:pt-24 pb-8">
                <Container>
                    <Reveal>
                        <Badge tone="outline" className="mb-6">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                            EventCoin · Web3 ticketing
                        </Badge>
                    </Reveal>
                    <Reveal delay={0.05}>
                        <h1 className="font-serif text-display-xl text-fg text-balance max-w-4xl tracking-tight">
                            Tickets you actually own.
                            <br />
                            <span className="italic text-fg/70">Events worth attending.</span>
                        </h1>
                    </Reveal>
                    <Reveal delay={0.1}>
                        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted">
                            A discreet, on-chain ticketing platform for premium events.
                            Choose your portal — every transaction settles transparently,
                            every ticket arrives instantly.
                        </p>
                    </Reveal>
                    <Reveal delay={0.15}>
                        <div className="mt-9 flex flex-wrap items-center gap-3">
                            <Link route="/client/login" legacyBehavior>
                                <a>
                                    <Button size="lg" rightIcon={<ArrowUpRight size={16} strokeWidth={2} />}>
                                        Browse events
                                    </Button>
                                </a>
                            </Link>
                            <Link route="/admin/login" legacyBehavior>
                                <a>
                                    <Button size="lg" variant="outline">
                                        Open admin
                                    </Button>
                                </a>
                            </Link>
                        </div>
                    </Reveal>
                </Container>
            </Section>

            <Section className="py-10">
                <Container>
                    <div className="grid gap-4 md:grid-cols-2">
                        {portals.map((portal, i) => (
                            <Reveal key={portal.href} delay={0.05 * i}>
                                <Link route={portal.href} legacyBehavior>
                                    <a className="block group focus-ring rounded-lg">
                                        <motion.article
                                            whileHover={{ y: -4 }}
                                            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                                            className="relative overflow-hidden rounded-lg border border-border bg-surface p-8 sm:p-10 transition-shadow hover:shadow-lift hover:border-fg/15"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <span className="text-[11px] uppercase tracking-[0.18em] text-muted font-medium">
                                                    {portal.eyebrow}
                                                </span>
                                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-fg/70 transition-all duration-300 ease-premium group-hover:bg-accent group-hover:text-accent-fg group-hover:rotate-[-6deg]">
                                                    <ArrowUpRight size={16} strokeWidth={1.75} />
                                                </span>
                                            </div>
                                            <h2 className="mt-12 sm:mt-16 font-serif text-3xl sm:text-4xl text-fg">
                                                {portal.title}
                                            </h2>
                                            <p className="mt-2 text-[15px] text-muted max-w-md">
                                                {portal.description}
                                            </p>
                                            <div className="mt-8 flex items-center gap-2 text-sm text-fg/70 group-hover:text-accent transition-colors">
                                                <span>{portal.cta}</span>
                                                <span aria-hidden className="transition-transform duration-300 ease-premium group-hover:translate-x-1">→</span>
                                            </div>
                                            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/[0.04] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        </motion.article>
                                    </a>
                                </Link>
                            </Reveal>
                        ))}
                    </div>
                </Container>
            </Section>

            <Section className="pt-20 pb-24">
                <Container>
                    <Reveal>
                        <div className="flex items-end justify-between gap-6 mb-10">
                            <div>
                                <span className="text-[11px] uppercase tracking-[0.18em] text-muted font-medium">
                                    Why EventCoin
                                </span>
                                <h2 className="mt-3 font-serif text-display-md text-fg max-w-2xl text-balance">
                                    Quiet infrastructure for memorable events.
                                </h2>
                            </div>
                        </div>
                    </Reveal>
                    <Divider />
                    <div className="grid gap-px bg-border mt-px md:grid-cols-3 rounded-lg overflow-hidden border border-border">
                        {pillars.map((pillar, i) => {
                            const Icon = pillar.icon;
                            return (
                                <Reveal key={pillar.title} delay={0.05 * i}>
                                    <div className="bg-bg p-8 h-full">
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent mb-5">
                                            <Icon size={18} strokeWidth={1.75} />
                                        </span>
                                        <h3 className="font-serif text-2xl text-fg">{pillar.title}</h3>
                                        <p className="mt-2 text-[15px] text-muted leading-relaxed">{pillar.body}</p>
                                    </div>
                                </Reveal>
                            );
                        })}
                    </div>
                </Container>
            </Section>
        </Layout>
    );
};

export default LoginPortal;
