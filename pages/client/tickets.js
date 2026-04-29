import React, { Component } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, Hash, Copy, Check, AlertCircle, Ticket as TicketIcon } from 'lucide-react';
import Layout from '../../components/layout';
import Event from '../../ethereum/event';
import {
    Container, Section, Reveal, Card, Button, Badge, Divider, EmptyState
} from '../../components/ui';

class ClientTicketsPage extends Component {
    state = {
        tickets: [],
        loading: true,
        errorMessage: '',
        copiedTicketKey: ''
    };

    async componentDidMount() {
        try {
            const baseTickets = [];

            Object.keys(window.localStorage).forEach((key) => {
                if (key.startsWith('clientTickets:')) {
                    const eventAddress = key.split(':')[1];
                    try {
                        const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
                        parsed.forEach((ticket) => {
                            baseTickets.push({
                                ...ticket,
                                eventAddress,
                                eventName: 'Unknown Event',
                                ticketPrice: '',
                                eventDescription: '',
                                eventDate: '',
                                detailsUnavailable: false
                            });
                        });
                    } catch (error) {
                        // Ignore invalid local ticket data.
                    }
                }
            });

            const enrichedTickets = await Promise.all(baseTickets.map(async (ticket) => {
                try {
                    const summary = await Event(ticket.eventAddress).methods.getEventDetails().call();
                    return {
                        ...ticket,
                        eventName: summary[0],
                        ticketPrice: summary[1].toString(),
                        eventDescription: summary[4] || '',
                        eventDate: summary[5] || '',
                        detailsUnavailable: false
                    };
                } catch (error) {
                    return { ...ticket, detailsUnavailable: true };
                }
            }));

            this.setState({ tickets: enrichedTickets, loading: false });
        } catch (error) {
            this.setState({ errorMessage: 'Unable to load tickets.', loading: false });
        }
    }

    handleCopy = async (qrPayload, ticketKey) => {
        try {
            await navigator.clipboard.writeText(qrPayload || '');
            this.setState({ copiedTicketKey: ticketKey });
            setTimeout(() => this.setState({ copiedTicketKey: '' }), 1800);
        } catch (error) {
            this.setState({ errorMessage: 'Unable to copy QR payload.' });
        }
    };

    renderTicket(ticket) {
        let parsedPayload = null;
        try { parsedPayload = JSON.parse(ticket.qrPayload); } catch (error) { parsedPayload = null; }
        const ticketKey = `${ticket.eventAddress}-${ticket.ticketId}`;

        return (
            <Card key={ticketKey} className="p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <span className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">Event</span>
                        <h3 className="font-serif text-2xl text-fg mt-1">{ticket.eventName || 'Unnamed Event'}</h3>
                        {ticket.detailsUnavailable ? (
                            <Badge tone="warning" className="mt-2">Network mismatch</Badge>
                        ) : null}
                    </div>
                    <Badge tone="accent">#{ticket.ticketId}</Badge>
                </div>

                <Divider className="my-5" />

                <div className="grid sm:grid-cols-[1fr_auto] gap-6">
                    <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
                        <div>
                            <dt className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">Date</dt>
                            <dd className="text-fg/80 mt-1 inline-flex items-center gap-1.5">
                                <Calendar size={12} className="text-muted" /> {ticket.eventDate || 'Not set'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">Price</dt>
                            <dd className="text-fg/80 mt-1 font-mono">{ticket.ticketPrice ? `${ticket.ticketPrice} wei` : '—'}</dd>
                        </div>
                        <div className="col-span-2">
                            <dt className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">Contract</dt>
                            <dd className="text-fg/80 mt-1 font-mono text-xs break-all">{ticket.eventAddress}</dd>
                        </div>
                        {ticket.eventDescription ? (
                            <div className="col-span-2">
                                <dt className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">Description</dt>
                                <dd className="text-fg/80 mt-1">{ticket.eventDescription}</dd>
                            </div>
                        ) : null}
                        {parsedPayload ? (
                            <div className="col-span-2">
                                <dt className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">Validation data</dt>
                                <dd className="text-fg/70 mt-1 text-xs space-y-1">
                                    <div><span className="text-muted">Buyer:</span> <span className="font-mono">{parsedPayload.buyerAddress}</span></div>
                                    <div><span className="text-muted">Issued:</span> <span className="font-mono">{parsedPayload.issuedAt}</span></div>
                                    <div><span className="text-muted">Nonce:</span> <span className="font-mono">{parsedPayload.nonce}</span></div>
                                </dd>
                            </div>
                        ) : null}
                    </dl>

                    <div className="flex flex-col items-center gap-3">
                        <div className="rounded-md bg-white p-3 border border-border">
                            <QRCodeSVG value={ticket.qrPayload} size={170} />
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={
                                this.state.copiedTicketKey === ticketKey
                                    ? <Check size={13} strokeWidth={2} />
                                    : <Copy size={13} strokeWidth={1.75} />
                            }
                            onClick={() => this.handleCopy(ticket.qrPayload, ticketKey)}
                        >
                            {this.state.copiedTicketKey === ticketKey ? 'Copied' : 'Copy payload'}
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    render() {
        return (
            <Layout title="My tickets">
                <Section className="pt-12 pb-6">
                    <Container>
                        <Reveal>
                            <Badge tone="outline"><TicketIcon size={11} /> Your collection</Badge>
                        </Reveal>
                        <Reveal delay={0.05}>
                            <h1 className="font-serif text-display-md text-fg mt-4 tracking-tight">
                                My tickets
                            </h1>
                        </Reveal>
                        <Reveal delay={0.1}>
                            <p className="mt-3 text-[15px] text-muted max-w-xl">
                                Stored locally in this browser. Each ticket carries its on-chain validation payload.
                            </p>
                        </Reveal>
                    </Container>
                </Section>

                <Section className="pt-2 pb-20">
                    <Container>
                        {this.state.errorMessage ? (
                            <Card className="p-4 border-danger/30 bg-danger/5 mb-6">
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={15} className="text-danger mt-0.5" strokeWidth={1.75} />
                                    <p className="text-sm text-fg">{this.state.errorMessage}</p>
                                </div>
                            </Card>
                        ) : null}
                        {!this.state.loading && this.state.tickets.length === 0 ? (
                            <EmptyState
                                icon={TicketIcon}
                                title="No tickets yet"
                                description="Tickets purchased on this device appear here. Browse events to buy your first."
                            />
                        ) : null}
                        <div className="flex flex-col gap-4">
                            {this.state.tickets.map((ticket, i) => (
                                <Reveal key={`${ticket.eventAddress}-${ticket.ticketId}`} delay={Math.min(i * 0.04, 0.18)}>
                                    {this.renderTicket(ticket)}
                                </Reveal>
                            ))}
                        </div>
                    </Container>
                </Section>
            </Layout>
        );
    }
}

export default ClientTicketsPage;
