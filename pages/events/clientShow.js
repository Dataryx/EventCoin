import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
    Calendar, MapPin, Ticket as TicketIcon, ShieldCheck, QrCode, Sparkles,
    Plus, Minus, Copy, Check, AlertCircle, ChevronLeft
} from 'lucide-react';
import Layout from '../../components/layout';
import Event from '../../ethereum/event';
import web3 from '../../ethereum/web3';
import { Link } from '../../routes';
import {
    Container, Section, Reveal, Card, Button, Badge, Divider, Input
} from '../../components/ui';
import { cn } from '../../lib/cn';

const fireConfetti = async () => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
        const mod = await import('canvas-confetti');
        const confetti = mod.default || mod;
        const palette = ['#0E5C3F', '#11704C', '#0A4A33', '#FAFAF7', '#0A0A0A'];
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.3 }, colors: palette, scalar: 0.9 });
        setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.5 }, colors: palette }), 180);
        setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.5 }, colors: palette }), 320);
    } catch (e) {
        // Confetti is decorative; ignore failures.
    }
};

class ClientEventShow extends Component {
    static async getInitialProps(props) {
        const event = Event(props.query.address);
        const summary = await event.methods.getEventDetails().call();

        return {
            name: summary[0],
            ticketPrice: summary[1].toString(),
            ticketSupply: summary[2].toString(),
            ticketsSold: summary[3].toString(),
            description: summary[4] || '',
            eventDate: summary[5] || '',
            contractAddress: props.query.address,
        };
    }

    state = {
        loading: false,
        errorMessage: '',
        successMessage: '',
        clientAccount: '',
        purchasedTickets: [],
        copiedTicketId: '',
        quantity: 1,
        cartQuantity: 0
    };

    componentDidMount() {
        this.restoreClientState();
    }

    storageKey() {
        return `clientTickets:${this.props.contractAddress}`;
    }

    restoreClientState = async () => {
        const clientAccount = window.localStorage.getItem('clientAccount') || '';
        const storedTickets = window.localStorage.getItem(this.storageKey());
        const purchasedTickets = storedTickets ? JSON.parse(storedTickets) : [];

        this.setState({ clientAccount, purchasedTickets });
    };

    persistTickets = (tickets) => {
        window.localStorage.setItem(this.storageKey(), JSON.stringify(tickets));
        this.setState({ purchasedTickets: tickets });
    };

    createQrPayload = (ticketId, buyerAddress) => {
        const uniqueNonce = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        return JSON.stringify({
            eventAddress: this.props.contractAddress,
            ticketId: ticketId.toString(),
            buyerAddress,
            issuedAt: new Date().toISOString(),
            nonce: uniqueNonce
        });
    };

    handleCheckout = async () => {
        this.setState({ loading: true, errorMessage: '', successMessage: '' });
        const event = Event(this.props.contractAddress);

        try {
            const accounts = await web3.eth.getAccounts();
            if (!accounts.length) {
                throw new Error('No wallet account found. Login as client first.');
            }

            const buyerAddress = accounts[0];
            if (!this.state.cartQuantity) {
                throw new Error('Add at least one ticket to cart before checkout.');
            }
            const available = parseInt(this.props.ticketSupply, 10) - parseInt(this.props.ticketsSold, 10);
            if (this.state.cartQuantity > available) {
                throw new Error('Requested quantity exceeds available tickets.');
            }

            const newTickets = [];
            for (let i = 0; i < this.state.cartQuantity; i += 1) {
                const result = await event.methods.buyTicket().send({
                    from: buyerAddress,
                    value: this.props.ticketPrice
                });

                const ticketId = result.events.TicketPurchased.returnValues.ticketId;
                const qrPayload = this.createQrPayload(ticketId, buyerAddress);
                newTickets.push({
                    ticketId: ticketId.toString(),
                    qrPayload,
                    buyerAddress,
                    eventAddress: this.props.contractAddress
                });
            }

            const nextTickets = [...newTickets, ...this.state.purchasedTickets];
            this.persistTickets(nextTickets);
            window.localStorage.setItem('clientAccount', buyerAddress);

            this.setState({
                successMessage: `Checkout successful! Purchased ${this.state.cartQuantity} ticket(s).`,
                clientAccount: buyerAddress,
                cartQuantity: 0
            });

            fireConfetti();
        } catch (err) {
            this.setState({ errorMessage: err.message });
        }

        this.setState({ loading: false });
    };

    handleAddToCart = () => {
        const quantity = parseInt(this.state.quantity, 10);
        const available = parseInt(this.props.ticketSupply, 10) - parseInt(this.props.ticketsSold, 10);

        if (!quantity || quantity < 1) {
            this.setState({ errorMessage: 'Enter a valid quantity.', successMessage: '' });
            return;
        }
        if (quantity > available) {
            this.setState({ errorMessage: 'Requested quantity exceeds available tickets.', successMessage: '' });
            return;
        }

        this.setState({
            cartQuantity: quantity,
            errorMessage: '',
            successMessage: `${quantity} ticket(s) added to cart.`
        });
    };

    setQuantity = (next) => {
        const available = parseInt(this.props.ticketSupply, 10) - parseInt(this.props.ticketsSold, 10);
        const clamped = Math.max(1, Math.min(next, Math.max(available, 1)));
        this.setState({ quantity: clamped });
    };

    handleCopy = async (qrPayload, ticketId) => {
        try {
            await navigator.clipboard.writeText(qrPayload);
            this.setState({ copiedTicketId: ticketId.toString() });
            setTimeout(() => this.setState({ copiedTicketId: '' }), 1800);
        } catch (error) {
            this.setState({ errorMessage: 'Unable to copy QR payload from this browser.' });
        }
    };

    render() {
        const { name, ticketPrice, ticketSupply, ticketsSold, description, eventDate } = this.props;
        const available = parseInt(ticketSupply, 10) - parseInt(ticketsSold, 10);
        const sold = parseInt(ticketsSold, 10);
        const supply = parseInt(ticketSupply, 10);
        const soldPct = supply > 0 ? Math.min((sold / supply) * 100, 100) : 0;

        return (
            <Layout title={`${name || 'Event'} · Checkout`} wallet={this.state.clientAccount}>
                <Section className="pt-10 pb-6">
                    <Container>
                        <Reveal>
                            <Link route="/client/dashboard" legacyBehavior>
                                <a className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors group">
                                    <ChevronLeft size={14} strokeWidth={1.75} className="transition-transform group-hover:-translate-x-0.5" />
                                    Back to events
                                </a>
                            </Link>
                        </Reveal>

                        <Reveal delay={0.05}>
                            <div className="mt-5 flex items-center gap-2">
                                <Badge tone="accent"><Sparkles size={10} /> Storefront</Badge>
                                {available > 0 && available <= 10 ? <Badge tone="warning">Almost gone</Badge> : null}
                            </div>
                        </Reveal>

                        <Reveal delay={0.08}>
                            <h1 className="font-serif text-display-lg text-fg mt-4 text-balance max-w-3xl tracking-tight">
                                {name}
                            </h1>
                        </Reveal>

                        {description ? (
                            <Reveal delay={0.12}>
                                <p className="mt-4 text-[16px] text-muted max-w-2xl leading-relaxed">{description}</p>
                            </Reveal>
                        ) : null}

                        <Reveal delay={0.15}>
                            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-fg/80">
                                <span className="inline-flex items-center gap-1.5"><Calendar size={14} className="text-muted" />{eventDate || 'Not set'}</span>
                                <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-muted">
                                    <MapPin size={13} className="text-muted shrink-0" />
                                    {this.props.contractAddress}
                                </span>
                            </div>
                        </Reveal>
                    </Container>
                </Section>

                <Section className="pt-2 pb-12">
                    <Container>
                        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
                            <Reveal>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <Card className="p-5">
                                        <span className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">Tickets available</span>
                                        <div className="font-serif text-3xl text-fg mt-2">{available}</div>
                                        <div className="mt-3 h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${soldPct}%` }}
                                                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                                                className="h-full bg-accent"
                                            />
                                        </div>
                                        <div className="text-xs text-muted mt-2">{sold} of {supply} sold</div>
                                    </Card>
                                    <Card className="p-5">
                                        <span className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">Ticket price</span>
                                        <div className="font-serif text-3xl text-fg mt-2 inline-flex items-baseline gap-2">
                                            <span className="font-mono text-2xl">{ticketPrice}</span>
                                            <span className="text-xs uppercase tracking-[0.18em] text-muted font-sans">wei</span>
                                        </div>
                                        <div className="text-xs text-muted mt-3">Payment settles on-chain at confirmation.</div>
                                    </Card>
                                    <Card className="p-5 sm:col-span-2">
                                        <span className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">What you get</span>
                                        <ul className="mt-3 space-y-2 text-sm text-fg/80">
                                            <li className="inline-flex items-center gap-2"><ShieldCheck size={14} className="text-accent" />Secure on-chain purchase</li>
                                            <li className="inline-flex items-center gap-2"><QrCode size={14} className="text-accent" />Instant QR delivery after payment</li>
                                            <li className="inline-flex items-center gap-2"><TicketIcon size={14} className="text-accent" />Admin-side QR validation supported</li>
                                        </ul>
                                    </Card>
                                </div>
                            </Reveal>

                            <Reveal delay={0.08}>
                                <Card className="p-6 sticky top-20">
                                    <span className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">Checkout</span>
                                    <h3 className="font-serif text-2xl text-fg mt-1.5">Reserve your tickets</h3>
                                    <Divider className="my-5" />

                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-fg/80">Quantity</span>
                                        <div className="inline-flex items-center rounded-md border border-border bg-bg overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => this.setQuantity((parseInt(this.state.quantity, 10) || 1) - 1)}
                                                className="h-9 w-9 inline-flex items-center justify-center text-fg/70 hover:bg-surface-2 transition-colors"
                                                aria-label="Decrease"
                                            >
                                                <Minus size={14} strokeWidth={1.75} />
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                value={this.state.quantity}
                                                onChange={(e) => this.setState({ quantity: e.target.value })}
                                                className="h-9 w-14 bg-transparent text-center text-sm font-mono focus:outline-none border-x border-border"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => this.setQuantity((parseInt(this.state.quantity, 10) || 1) + 1)}
                                                className="h-9 w-9 inline-flex items-center justify-center text-fg/70 hover:bg-surface-2 transition-colors"
                                                aria-label="Increase"
                                            >
                                                <Plus size={14} strokeWidth={1.75} />
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="w-full mt-3"
                                        onClick={this.handleAddToCart}
                                    >
                                        Add to cart
                                    </Button>

                                    <div className="mt-5 rounded-md bg-surface-2/50 border border-border p-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted">In cart</span>
                                            <span className="font-mono text-fg">{this.state.cartQuantity} × {ticketPrice} wei</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm mt-2">
                                            <span className="text-muted">Estimated total</span>
                                            <span className="font-mono text-fg">{(BigInt(ticketPrice || '0') * BigInt(this.state.cartQuantity || 0)).toString()} wei</span>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full mt-4"
                                        size="lg"
                                        loading={this.state.loading}
                                        disabled={this.state.cartQuantity === 0 || this.state.loading}
                                        onClick={this.handleCheckout}
                                    >
                                        {this.state.loading ? 'Processing…' : 'Checkout'}
                                    </Button>

                                    {this.state.errorMessage ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-3 flex items-start gap-2 text-sm text-danger"
                                        >
                                            <AlertCircle size={14} className="mt-0.5" strokeWidth={1.75} />
                                            <span>{this.state.errorMessage}</span>
                                        </motion.div>
                                    ) : null}

                                    {this.state.successMessage ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-3 flex items-start gap-2 text-sm text-accent"
                                        >
                                            <Check size={14} className="mt-0.5" strokeWidth={1.75} />
                                            <span>{this.state.successMessage}</span>
                                        </motion.div>
                                    ) : null}
                                </Card>
                            </Reveal>
                        </div>
                    </Container>
                </Section>

                {this.state.purchasedTickets.length ? (
                    <Section className="pb-20">
                        <Container>
                            <Reveal>
                                <div className="flex items-end justify-between gap-4 mb-6">
                                    <div>
                                        <span className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">Your tickets for this event</span>
                                        <h2 className="font-serif text-display-md text-fg mt-2">QR codes</h2>
                                    </div>
                                    <span className="text-sm text-muted">{this.state.purchasedTickets.length} total</span>
                                </div>
                            </Reveal>

                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {this.state.purchasedTickets.map((ticket, i) => (
                                    <Reveal key={ticket.ticketId} delay={Math.min(i * 0.04, 0.2)}>
                                        <Card className="p-5">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">Ticket</span>
                                                    <div className="font-mono text-fg text-sm mt-0.5">#{ticket.ticketId}</div>
                                                </div>
                                                <Badge tone="accent">Active</Badge>
                                            </div>
                                            <div className="mt-4 rounded-md bg-white p-3 border border-border w-fit mx-auto">
                                                <QRCodeSVG value={ticket.qrPayload} size={150} />
                                            </div>
                                            <div className="mt-3 text-[11px] font-mono text-muted break-all line-clamp-2">
                                                {ticket.qrPayload}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className={cn('mt-3 w-full', this.state.copiedTicketId === ticket.ticketId && 'text-accent')}
                                                leftIcon={
                                                    this.state.copiedTicketId === ticket.ticketId
                                                        ? <Check size={13} strokeWidth={2} />
                                                        : <Copy size={13} strokeWidth={1.75} />
                                                }
                                                onClick={() => this.handleCopy(ticket.qrPayload, ticket.ticketId)}
                                            >
                                                {this.state.copiedTicketId === ticket.ticketId ? 'Copied' : 'Copy QR payload'}
                                            </Button>
                                        </Card>
                                    </Reveal>
                                ))}
                            </div>
                        </Container>
                    </Section>
                ) : null}
            </Layout>
        );
    }
}

export default ClientEventShow;
