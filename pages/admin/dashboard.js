import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, ArrowRight, ShieldCheck, Wallet, AlertCircle, Calendar, Activity } from 'lucide-react';
import { contractAddress, getDeployedEventsInstance } from '../../ethereum/factory';
import AdminShell from '../../components/adminShell';
import { Link } from '../../routes';
import Event from '../../ethereum/event';
import {
    Card, Button, Badge, Reveal, Input, EmptyState
} from '../../components/ui';
import { cn } from '../../lib/cn';

class AdminDashboard extends Component {
    static async getInitialProps() {
        if (!contractAddress || !getDeployedEventsInstance) {
            return {
                events: [],
                stats: { totalEvents: 0, ticketsSold: 0, revenueWei: 0, validations: 0 },
                loadError: 'Set NEXT_PUBLIC_DIAMOND_ADDRESS in .env to load deployed events.'
            };
        }

        try {
            const addresses = await getDeployedEventsInstance.methods.getDeployedEvents().call();
            const events = await Promise.all(addresses.map(async (address) => {
                const event = Event(address);
                const summary = await event.methods.getEventDetails().call();
                const ticketPriceWei = parseInt(summary[1], 10) || 0;
                const ticketSupply = parseInt(summary[2], 10) || 0;
                const ticketsSold = parseInt(summary[3], 10) || 0;

                let validations = 0;
                for (let ticketId = 1; ticketId <= ticketsSold; ticketId += 1) {
                    try {
                        const ticket = await event.methods.tickets(ticketId).call();
                        const isUsed = ticket.isUsed || ticket[1];
                        if (isUsed) validations += 1;
                    } catch (e) {
                        // skip
                    }
                }

                return {
                    address,
                    name: summary[0],
                    ticketPriceWei,
                    ticketSupply,
                    ticketsSold,
                    description: summary[4] || '',
                    eventDate: summary[5] || '',
                    validations
                };
            }));

            const stats = events.reduce((acc, item) => {
                acc.totalEvents += 1;
                acc.ticketsSold += item.ticketsSold;
                acc.revenueWei += item.ticketPriceWei * item.ticketsSold;
                acc.validations += item.validations;
                return acc;
            }, { totalEvents: 0, ticketsSold: 0, revenueWei: 0, validations: 0 });

            return { events, stats, loadError: '' };
        } catch (error) {
            return {
                events: [],
                stats: { totalEvents: 0, ticketsSold: 0, revenueWei: 0, validations: 0 },
                loadError: 'Unable to load events from the blockchain right now.'
            };
        }
    }

    state = { adminAccount: '', searchTerm: '', sortOrder: 'latest' };

    componentDidMount() {
        this.setState({ adminAccount: window.localStorage.getItem('adminAccount') || '' });
    }

    getFilteredEvents() {
        const { events } = this.props;
        const { searchTerm, sortOrder } = this.state;
        let filtered = [...events];

        if (searchTerm.trim()) {
            const keyword = searchTerm.trim().toLowerCase();
            filtered = filtered.filter((event) =>
                event.address.toLowerCase().includes(keyword) ||
                event.name.toLowerCase().includes(keyword)
            );
        }

        filtered.sort((a, b) => (sortOrder === 'latest' ? b.address.localeCompare(a.address) : a.address.localeCompare(b.address)));
        return filtered;
    }

    render() {
        const filtered = this.getFilteredEvents();
        const statCards = [
            { title: 'Total events', value: this.props.stats.totalEvents, icon: Calendar },
            { title: 'Tickets sold', value: this.props.stats.ticketsSold, icon: ShieldCheck },
            { title: 'Revenue', value: this.props.stats.revenueWei, suffix: 'wei', mono: true, icon: Wallet },
            { title: 'Validations', value: this.props.stats.validations, icon: Activity }
        ];

        return (
            <AdminShell
                activeRoute="/admin/dashboard"
                title="Dashboard"
                subtitle="Overview of every event contract under your management."
                walletAddress={this.state.adminAccount}
                topActions={
                    <Link route="/events/new" legacyBehavior>
                        <a>
                            <Button leftIcon={<Plus size={14} strokeWidth={2} />}>Create event</Button>
                        </a>
                    </Link>
                }
                heroTitle="Wallet command center"
                heroDescription={this.state.adminAccount || 'Connect wallet to unlock admin actions.'}
                heroActions={
                    <>
                        <Link route="/admin/ticket-validation" legacyBehavior>
                            <a>
                                <Button size="sm" className="bg-accent text-accent-fg hover:bg-accent-hover">
                                    Open validation queue
                                </Button>
                            </a>
                        </Link>
                    </>
                }
            >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                    {statCards.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <Reveal key={s.title} delay={i * 0.04}>
                                <Card className="p-5">
                                    <div className="flex items-start justify-between">
                                        <span className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">{s.title}</span>
                                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent">
                                            <Icon size={13} strokeWidth={1.75} />
                                        </span>
                                    </div>
                                    <div className="font-serif text-3xl text-fg mt-3 inline-flex items-baseline gap-2">
                                        <span className={s.mono ? 'font-mono text-2xl' : ''}>{s.value}</span>
                                        {s.suffix ? <span className="text-xs uppercase tracking-[0.18em] text-muted font-sans">{s.suffix}</span> : null}
                                    </div>
                                </Card>
                            </Reveal>
                        );
                    })}
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    <Reveal>
                        <Card className="p-5 sm:p-6">
                            <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
                                <div>
                                    <h2 className="font-serif text-xl text-fg">Event management</h2>
                                    <p className="text-sm text-muted mt-0.5">Open an event for ops or validation.</p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                                        <Input
                                            placeholder="Search address or name"
                                            value={this.state.searchTerm}
                                            onChange={(e) => this.setState({ searchTerm: e.target.value })}
                                            className="pl-9 h-9 text-sm w-56"
                                        />
                                    </div>
                                    <select
                                        value={this.state.sortOrder}
                                        onChange={(e) => this.setState({ sortOrder: e.target.value })}
                                        className="h-9 rounded-sm border border-border bg-surface px-3 text-sm text-fg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                                    >
                                        <option value="latest">Latest first</option>
                                        <option value="oldest">Oldest first</option>
                                    </select>
                                </div>
                            </div>

                            {filtered.length === 0 ? (
                                <EmptyState
                                    icon={Calendar}
                                    title="No events yet"
                                    description="Create your first event to get started."
                                    action={
                                        <Link route="/events/new" legacyBehavior>
                                            <a><Button leftIcon={<Plus size={14} strokeWidth={2} />}>Create event</Button></a>
                                        </Link>
                                    }
                                />
                            ) : (
                                <div className="divide-y divide-border -mx-1">
                                    {filtered.map((event) => {
                                        const soldOut = event.ticketSupply > 0 && event.ticketsSold >= event.ticketSupply;
                                        const ratio = event.ticketSupply > 0 ? Math.min((event.ticketsSold / event.ticketSupply) * 100, 100) : 0;
                                        return (
                                            <div key={event.address} className="grid grid-cols-[1fr_auto] gap-4 py-4 px-1 items-center">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-medium text-fg truncate">{event.name || 'Unnamed event'}</h3>
                                                        <Badge tone={soldOut ? 'danger' : 'accent'}>{soldOut ? 'Sold out' : 'Live'}</Badge>
                                                    </div>
                                                    <p className="text-xs text-muted mt-0.5">{event.eventDate || 'No date set'}</p>
                                                    <p className="font-mono text-[11px] text-muted mt-1 truncate">{event.address}</p>
                                                    <div className="mt-2.5 flex items-center gap-2">
                                                        <div className="h-1 w-32 rounded-full bg-surface-2 overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${ratio}%` }}
                                                                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                                                className="h-full bg-accent"
                                                            />
                                                        </div>
                                                        <span className="text-[11px] font-mono text-muted">{event.ticketsSold}/{event.ticketSupply}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Link route={`/events/${event.address}`} legacyBehavior>
                                                        <a>
                                                            <Button size="sm" variant="outline" rightIcon={<ArrowRight size={13} strokeWidth={2} />}>Open</Button>
                                                        </a>
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </Reveal>

                    <div className="space-y-3">
                        <Reveal delay={0.05}>
                            <Card className="p-5">
                                <h3 className="font-serif text-lg text-fg mb-4">Quick actions</h3>
                                <div className="flex flex-col gap-2">
                                    <Link route="/events/new" legacyBehavior>
                                        <a><Button className="w-full" leftIcon={<Plus size={14} strokeWidth={2} />}>Create event</Button></a>
                                    </Link>
                                    <Link route="/admin/ticket-validation" legacyBehavior>
                                        <a><Button variant="outline" className="w-full">Validation center</Button></a>
                                    </Link>
                                    <Link route="/admin/revenue" legacyBehavior>
                                        <a><Button variant="ghost" className="w-full">Finance overview</Button></a>
                                    </Link>
                                </div>
                            </Card>
                        </Reveal>

                        <Reveal delay={0.1}>
                            <Card className="p-5">
                                <h3 className="font-serif text-lg text-fg mb-4">On-chain snapshot</h3>
                                <ul className="space-y-2.5 text-sm">
                                    <li className="flex items-center gap-2.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                        <span className="text-muted">Contracts loaded:</span>
                                        <span className="text-fg font-medium ml-auto">{this.props.stats.totalEvents}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                        <span className="text-muted">Tickets sold:</span>
                                        <span className="text-fg font-medium ml-auto">{this.props.stats.ticketsSold}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                                        <span className="text-muted">Tickets used:</span>
                                        <span className="text-fg font-medium ml-auto">{this.props.stats.validations}</span>
                                    </li>
                                </ul>
                            </Card>
                        </Reveal>
                    </div>
                </div>

                {this.props.loadError ? (
                    <Card className="mt-6 p-4 border-danger/30 bg-danger/5">
                        <div className="flex items-start gap-2">
                            <AlertCircle size={15} className="text-danger mt-0.5" strokeWidth={1.75} />
                            <p className="text-sm text-fg">{this.props.loadError}</p>
                        </div>
                    </Card>
                ) : null}
            </AdminShell>
        );
    }
}

export default AdminDashboard;
