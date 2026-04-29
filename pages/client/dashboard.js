import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, MapPin, ArrowRight, Ticket as TicketIcon, Sparkles } from 'lucide-react';
import { contractAddress, getDeployedEventsInstance } from '../../ethereum/factory';
import Layout from '../../components/layout';
import { Link } from '../../routes';
import Event from '../../ethereum/event';
import {
    Container,
    Section,
    Reveal,
    Card,
    Badge,
    Button,
    Input,
    Divider,
    EmptyState,
    WalletPill
} from '../../components/ui';
import { cn } from '../../lib/cn';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

class ClientDashboard extends Component {
    static async getInitialProps() {
        if (!contractAddress || !getDeployedEventsInstance) {
            return { events: [], loadError: 'Set NEXT_PUBLIC_DIAMOND_ADDRESS in .env to load deployed events.' };
        }

        try {
            const addresses = await getDeployedEventsInstance.methods.getDeployedEvents().call();
            const events = await Promise.all(addresses.map(async (address) => {
                const event = Event(address);
                const summary = await event.methods.getEventDetails().call();
                return {
                    address,
                    name: summary[0],
                    ticketPriceWei: parseInt(summary[1], 10) || 0,
                    ticketSupply: parseInt(summary[2], 10) || 0,
                    ticketsSold: parseInt(summary[3], 10) || 0,
                    description: summary[4] || '',
                    eventDate: summary[5] || ''
                };
            }));
            return { events, loadError: '' };
        } catch (error) {
            return { events: [], loadError: 'Unable to load events from the blockchain right now.' };
        }
    }

    state = {
        clientAccount: '',
        searchTerm: '',
        selectedCategory: 'All Events',
        myTickets: []
    };

    componentDidMount() {
        const clientAccount = window.localStorage.getItem('clientAccount') || '';
        const myTickets = [];

        Object.keys(window.localStorage).forEach((key) => {
            if (key.startsWith('clientTickets:')) {
                try {
                    const tickets = JSON.parse(window.localStorage.getItem(key) || '[]');
                    tickets.forEach((ticket) => myTickets.push(ticket));
                } catch (err) {
                    // Ignore malformed local entries.
                }
            }
        });

        this.setState({ clientAccount, myTickets });
    }

    deriveCategory(eventName) {
        const normalized = (eventName || '').toLowerCase();
        if (normalized.includes('concert')) return 'Concerts';
        if (normalized.includes('sport')) return 'Sports';
        if (normalized.includes('experience')) return 'Experiences';
        return 'All Events';
    }

    getFilteredEvents() {
        const { searchTerm, selectedCategory, myTickets } = this.state;
        let filtered = [...this.props.events];

        if (searchTerm.trim()) {
            const keyword = searchTerm.trim().toLowerCase();
            filtered = filtered.filter((event) =>
                event.address.toLowerCase().includes(keyword) ||
                event.name.toLowerCase().includes(keyword)
            );
        }

        const featuredEvent = [...this.props.events].sort((a, b) => b.ticketsSold - a.ticketsSold)[0];
        const myTicketEventAddresses = new Set(myTickets.map((ticket) => ticket.eventAddress));

        if (selectedCategory === 'Featured' && featuredEvent) {
            filtered = filtered.filter((event) => event.address === featuredEvent.address);
        } else if (selectedCategory === 'Experiences') {
            filtered = filtered.filter((event) => this.deriveCategory(event.name) === 'Experiences');
        } else if (selectedCategory === 'Concerts' || selectedCategory === 'Sports') {
            filtered = filtered.filter((event) => this.deriveCategory(event.name) === selectedCategory);
        } else if (selectedCategory === 'My Tickets') {
            filtered = filtered.filter((event) => myTicketEventAddresses.has(event.address));
        }
        return filtered;
    }

    renderEventCards() {
        const filteredEvents = this.getFilteredEvents();
        if (filteredEvents.length === 0) {
            return (
                <EmptyState
                    icon={Calendar}
                    title="No events found"
                    description="Try a different category or clear your search."
                />
            );
        }

        return (
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-muted">Live events</span>
                    <span className="h-px flex-1 bg-border" />
                </div>
                {filteredEvents.map((event, index) => {
                    const isSoldOut = event.ticketSupply > 0 && event.ticketsSold >= event.ticketSupply;
                    const isFeatured = index === 0;
                    const left = Math.max(event.ticketSupply - event.ticketsSold, 0);
                    const month = MONTHS[index % 12];
                    const day = String((index % 27) + 1).padStart(2, '0');
                    const week = WEEKDAYS[index % 7];

                    return (
                        <Reveal key={event.address} delay={Math.min(index * 0.04, 0.24)}>
                            <motion.article
                                whileHover={isSoldOut ? undefined : { y: -2 }}
                                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                                className={cn(
                                    'group relative rounded-lg border bg-surface overflow-hidden',
                                    'grid grid-cols-[88px_1fr] sm:grid-cols-[96px_1fr_180px] gap-0',
                                    'transition-shadow',
                                    isFeatured && !isSoldOut ? 'border-accent/40 shadow-[0_0_0_1px_rgb(var(--accent)/0.15)]' : 'border-border',
                                    isSoldOut ? 'opacity-70' : 'hover:shadow-lift hover:border-fg/15'
                                )}
                            >
                                <div className="relative bg-fg text-bg flex flex-col items-center justify-center font-serif py-4 px-2">
                                    {isFeatured && !isSoldOut ? (
                                        <span className="absolute top-2 left-2 text-[9px] tracking-[0.18em] uppercase font-sans font-semibold text-accent">
                                            Featured
                                        </span>
                                    ) : null}
                                    <span className="text-[11px] tracking-[0.2em] font-sans font-medium text-bg/70">{month}</span>
                                    <span className="text-4xl leading-none mt-0.5">{day}</span>
                                    <span className="text-[10px] tracking-[0.2em] font-sans font-medium text-bg/60 mt-1">{week}</span>
                                </div>

                                <div className="p-5 sm:p-6 min-w-0">
                                    <h3 className="font-serif text-xl sm:text-2xl text-fg leading-tight tracking-tight truncate">
                                        {event.name || 'Unnamed Event'}
                                    </h3>
                                    {event.eventDate ? (
                                        <p className="text-xs text-muted mt-1 inline-flex items-center gap-1.5">
                                            <Calendar size={12} strokeWidth={1.75} />
                                            {event.eventDate}
                                        </p>
                                    ) : null}
                                    {event.description ? (
                                        <p className="text-sm text-fg/70 mt-2 line-clamp-2">{event.description}</p>
                                    ) : null}
                                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
                                        <MapPin size={11} strokeWidth={1.75} />
                                        <span className="font-mono truncate">{event.address}</span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                                        <Badge tone={isSoldOut ? 'danger' : 'accent'}>
                                            {isSoldOut ? 'Sold out' : 'Live'}
                                        </Badge>
                                        <Badge tone="outline">QR delivery</Badge>
                                        <Badge tone="outline">On-chain</Badge>
                                    </div>
                                </div>

                                <div className="hidden sm:flex flex-col items-end justify-center p-5 border-l border-border bg-surface-2/30">
                                    {!isSoldOut ? (
                                        <>
                                            <span className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">From</span>
                                            <span className="font-serif text-3xl text-fg mt-0.5">${event.ticketPriceWei}</span>
                                            <Link route={`/events/${event.address}/client`} legacyBehavior>
                                                <a className="mt-3 w-full">
                                                    <Button size="sm" className="w-full" rightIcon={<ArrowRight size={14} strokeWidth={2} />}>
                                                        {left > 0 ? 'Buy now' : 'Checkout'}
                                                    </Button>
                                                </a>
                                            </Link>
                                            <span className="text-[11px] text-muted mt-2">{left} left</span>
                                        </>
                                    ) : (
                                        <span className="font-serif text-2xl text-danger">Sold out</span>
                                    )}
                                </div>

                                <div className="sm:hidden col-span-2 flex items-center justify-between p-4 border-t border-border bg-surface-2/30">
                                    {!isSoldOut ? (
                                        <>
                                            <div>
                                                <span className="text-[10px] tracking-[0.18em] uppercase text-muted">From</span>
                                                <div className="font-serif text-2xl text-fg leading-none mt-0.5">${event.ticketPriceWei}</div>
                                                <span className="text-[11px] text-muted">{left} left</span>
                                            </div>
                                            <Link route={`/events/${event.address}/client`} legacyBehavior>
                                                <a>
                                                    <Button size="sm" rightIcon={<ArrowRight size={14} strokeWidth={2} />}>
                                                        Buy
                                                    </Button>
                                                </a>
                                            </Link>
                                        </>
                                    ) : (
                                        <span className="font-serif text-xl text-danger">Sold out</span>
                                    )}
                                </div>
                            </motion.article>
                        </Reveal>
                    );
                })}
            </div>
        );
    }

    render() {
        const categories = ['All Events', 'Concerts', 'Sports', 'Experiences', 'Featured'];
        const ticketsAvailableTotal = this.props.events.reduce(
            (sum, event) => sum + Math.max(event.ticketSupply - event.ticketsSold, 0),
            0
        );

        return (
            <Layout title="Discover events" wallet={this.state.clientAccount}>
                <Section className="pt-12 pb-6">
                    <Container>
                        <Reveal>
                            <Badge tone="outline" className="mb-5">
                                <Sparkles size={11} className="text-accent" /> Curated this week
                            </Badge>
                        </Reveal>
                        <Reveal delay={0.05}>
                            <h1 className="font-serif text-display-lg text-fg text-balance max-w-3xl tracking-tight">
                                Find your next event.
                            </h1>
                        </Reveal>
                        <Reveal delay={0.1}>
                            <p className="mt-4 text-[15px] text-muted max-w-xl">
                                {this.state.clientAccount
                                    ? <>Connected as <span className="font-mono text-fg/80">{this.state.clientAccount.slice(0, 6)}…{this.state.clientAccount.slice(-4)}</span></>
                                    : 'Connect your wallet to begin.'}
                            </p>
                        </Reveal>

                        <Reveal delay={0.15}>
                            <div className="mt-10 grid gap-3 sm:grid-cols-3">
                                <Card className="p-5">
                                    <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-muted">Events</span>
                                    <div className="font-serif text-3xl text-fg mt-2">{this.props.events.length}</div>
                                </Card>
                                <Card className="p-5">
                                    <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-muted">My tickets</span>
                                    <div className="flex items-end justify-between gap-2 mt-2">
                                        <div className="font-serif text-3xl text-fg">{this.state.myTickets.length}</div>
                                        <Link route="/client/tickets" legacyBehavior>
                                            <a>
                                                <Button size="sm" variant="outline" rightIcon={<ArrowRight size={13} strokeWidth={2} />}>
                                                    View
                                                </Button>
                                            </a>
                                        </Link>
                                    </div>
                                </Card>
                                <Card className="p-5">
                                    <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-muted">Tickets available</span>
                                    <div className="font-serif text-3xl text-fg mt-2">{ticketsAvailableTotal}</div>
                                </Card>
                            </div>
                        </Reveal>
                    </Container>
                </Section>

                <Section className="py-6">
                    <Container>
                        <Reveal>
                            <div className="relative">
                                <Search size={16} strokeWidth={1.75} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                                <Input
                                    placeholder="Search events by name or contract address"
                                    value={this.state.searchTerm}
                                    onChange={(event) => this.setState({ searchTerm: event.target.value })}
                                    className="pl-11 h-12"
                                />
                            </div>
                        </Reveal>

                        <Reveal delay={0.05}>
                            <div className="mt-4 flex gap-2 flex-wrap">
                                {categories.map((category) => {
                                    const active = this.state.selectedCategory === category;
                                    return (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => this.setState({ selectedCategory: category })}
                                            className={cn(
                                                'h-9 px-4 rounded-full text-sm font-medium transition-all duration-200 ease-premium focus-ring',
                                                active
                                                    ? 'bg-fg text-bg border border-fg'
                                                    : 'bg-surface text-fg/70 border border-border hover:text-fg hover:border-fg/30'
                                            )}
                                        >
                                            {category}
                                        </button>
                                    );
                                })}
                            </div>
                        </Reveal>
                    </Container>
                </Section>

                <Section className="pt-2 pb-20">
                    <Container>
                        {this.renderEventCards()}
                        {this.props.loadError ? (
                            <Card className="mt-6 p-5 border-danger/30 bg-danger/5">
                                <div className="flex items-start gap-3">
                                    <TicketIcon size={16} className="text-danger mt-0.5" strokeWidth={1.75} />
                                    <div>
                                        <p className="text-sm font-medium text-fg">Unable to load events</p>
                                        <p className="text-sm text-muted mt-0.5">{this.props.loadError}</p>
                                    </div>
                                </div>
                            </Card>
                        ) : null}
                    </Container>
                </Section>
            </Layout>
        );
    }
}

export default ClientDashboard;
