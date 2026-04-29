import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, Hash, MapPin, Repeat, ChevronLeft, AlertCircle } from 'lucide-react';
import Layout from '../../components/layout';
import Event from '../../ethereum/event';
import { Link } from '../../routes';
import {
    Container,
    Section,
    Reveal,
    Card,
    Button,
    Badge,
    Divider
} from '../../components/ui';

class ClientTicketPage extends Component {
    static async getInitialProps(props) {
        const { eventAddress, ticketId } = props.query;
        const event = Event(eventAddress);
        const summary = await event.methods.getEventDetails().call();

        return {
            eventAddress,
            ticketId,
            eventName: summary[0],
            eventDescription: summary[4] || '',
            eventDate: summary[5] || ''
        };
    }

    state = {
        ticket: null,
        errorMessage: '',
        flipped: false
    };

    componentDidMount() {
        try {
            const storageKey = `clientTickets:${this.props.eventAddress}`;
            const stored = window.localStorage.getItem(storageKey);
            const tickets = stored ? JSON.parse(stored) : [];
            const ticket = tickets.find((item) => item.ticketId.toString() === this.props.ticketId.toString());

            if (!ticket) {
                this.setState({ errorMessage: 'Ticket not found in this browser wallet storage.' });
                return;
            }

            this.setState({ ticket });
        } catch (error) {
            this.setState({ errorMessage: 'Unable to load ticket details.' });
        }
    }

    toggleFlip = () => this.setState((s) => ({ flipped: !s.flipped }));

    render() {
        const { ticket, errorMessage, flipped } = this.state;

        return (
            <Layout title={`Ticket · ${this.props.eventName || 'Event'}`}>
                <Section className="pt-10 pb-20">
                    <Container className="max-w-3xl">
                        <Reveal>
                            <Link route="/client/tickets" legacyBehavior>
                                <a className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors group">
                                    <ChevronLeft size={14} strokeWidth={1.75} className="transition-transform group-hover:-translate-x-0.5" />
                                    Back to my tickets
                                </a>
                            </Link>
                        </Reveal>

                        <Reveal delay={0.05}>
                            <div className="mt-6">
                                <Badge tone="accent">Your ticket</Badge>
                                <h1 className="font-serif text-display-md text-fg mt-3 text-balance">
                                    {this.props.eventName || 'Event'}
                                </h1>
                                {this.props.eventDescription ? (
                                    <p className="mt-3 text-[15px] text-muted max-w-xl">
                                        {this.props.eventDescription}
                                    </p>
                                ) : null}
                            </div>
                        </Reveal>

                        {errorMessage ? (
                            <Reveal delay={0.1}>
                                <Card className="mt-8 p-5 border-danger/30 bg-danger/5">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle size={16} className="text-danger mt-0.5" strokeWidth={1.75} />
                                        <div>
                                            <p className="text-sm font-medium text-fg">Ticket unavailable</p>
                                            <p className="text-sm text-muted mt-0.5">{errorMessage}</p>
                                        </div>
                                    </div>
                                </Card>
                            </Reveal>
                        ) : null}

                        {ticket ? (
                            <Reveal delay={0.12}>
                                <div className="mt-10" style={{ perspective: '1600px' }}>
                                    <motion.div
                                        animate={{ rotateY: flipped ? 180 : 0 }}
                                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                        style={{ transformStyle: 'preserve-3d', position: 'relative' }}
                                        className="w-full"
                                    >
                                        <div
                                            style={{ backfaceVisibility: 'hidden' }}
                                            className="relative rounded-xl border border-border bg-surface overflow-hidden"
                                        >
                                            <div className="grid sm:grid-cols-[1fr_auto]">
                                                <div className="p-7 sm:p-9">
                                                    <span className="text-[10px] tracking-[0.2em] uppercase text-muted font-medium">
                                                        EventCoin · Admit one
                                                    </span>
                                                    <h2 className="font-serif text-3xl sm:text-4xl text-fg mt-2 leading-tight tracking-tight">
                                                        {this.props.eventName}
                                                    </h2>
                                                    <Divider className="my-6" />
                                                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                                                        <div>
                                                            <dt className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">Date</dt>
                                                            <dd className="text-sm text-fg mt-1 inline-flex items-center gap-1.5">
                                                                <Calendar size={13} strokeWidth={1.75} className="text-muted" />
                                                                {this.props.eventDate || 'Not set'}
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">Ticket ID</dt>
                                                            <dd className="text-sm text-fg mt-1 font-mono inline-flex items-center gap-1.5">
                                                                <Hash size={12} strokeWidth={1.75} className="text-muted" />
                                                                {this.props.ticketId}
                                                            </dd>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <dt className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">Contract</dt>
                                                            <dd className="text-xs text-fg/80 mt-1 font-mono inline-flex items-center gap-1.5 break-all">
                                                                <MapPin size={12} strokeWidth={1.75} className="text-muted shrink-0" />
                                                                {this.props.eventAddress}
                                                            </dd>
                                                        </div>
                                                    </dl>
                                                </div>
                                                <div className="hidden sm:flex relative w-[1px] bg-border">
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-bg border border-border" />
                                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-bg border border-border" />
                                                </div>
                                                <div className="p-7 sm:p-9 flex flex-col items-center justify-center bg-surface-2/40 sm:border-l-0">
                                                    <div className="rounded-md bg-white p-4 border border-border">
                                                        <QRCodeSVG value={ticket.qrPayload} size={180} />
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="mt-5"
                                                        leftIcon={<Repeat size={13} strokeWidth={2} />}
                                                        onClick={this.toggleFlip}
                                                    >
                                                        Flip for details
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                backfaceVisibility: 'hidden',
                                                transform: 'rotateY(180deg)',
                                                position: 'absolute',
                                                inset: 0
                                            }}
                                            className="rounded-xl border border-border bg-fg text-bg overflow-hidden p-7 sm:p-9 flex flex-col"
                                        >
                                            <span className="text-[10px] tracking-[0.2em] uppercase text-bg/60 font-medium">
                                                On-chain proof
                                            </span>
                                            <h3 className="font-serif text-2xl mt-2">Ticket payload</h3>
                                            <p className="font-mono text-[11px] text-bg/80 break-all mt-4 leading-relaxed">
                                                {ticket.qrPayload}
                                            </p>
                                            <div className="mt-auto pt-4 flex items-center justify-between">
                                                <span className="text-[10px] tracking-[0.18em] uppercase text-bg/50">
                                                    Owner · <span className="font-mono normal-case tracking-normal">{ticket.buyerAddress?.slice(0, 6)}…{ticket.buyerAddress?.slice(-4)}</span>
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-bg hover:bg-white/10"
                                                    leftIcon={<Repeat size={13} strokeWidth={2} />}
                                                    onClick={this.toggleFlip}
                                                >
                                                    Flip back
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </Reveal>
                        ) : null}
                    </Container>
                </Section>
            </Layout>
        );
    }
}

export default ClientTicketPage;
