import React, { Component } from 'react';
import { Header, Message, Button } from 'semantic-ui-react';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '../../components/layout';
import Event from '../../ethereum/event';

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
                    // Keep local ticket visible even if on-chain lookup fails
                    // (e.g. old contract address from previous migration).
                    return {
                        ...ticket,
                        detailsUnavailable: true
                    };
                }
            }));

            this.setState({ tickets: enrichedTickets, loading: false });
        } catch (error) {
            this.setState({ errorMessage: 'Unable to load tickets.', loading: false });
        }
    }

    renderTicket(ticket) {
        let parsedPayload = null;
        try {
            parsedPayload = JSON.parse(ticket.qrPayload);
        } catch (error) {
            parsedPayload = null;
        }

        const ticketKey = `${ticket.eventAddress}-${ticket.ticketId}`;

        return (
            <article key={ticketKey} className="ticket-card">
                <div className="ticket-head">
                    <Header as="h3">{ticket.eventName || 'Unnamed Event'}</Header>
                    <span className="ticket-pill">TICKET #{ticket.ticketId}</span>
                </div>
                {ticket.detailsUnavailable ? (
                    <Message warning content="Event details unavailable for this ticket on current network deployment." />
                ) : null}
                <p className="desc">{ticket.eventDescription || 'No description'}</p>
                <div className="meta-grid">
                    <div><span>Date</span><strong>{ticket.eventDate || 'Not set'}</strong></div>
                    <div><span>Price</span><strong>{ticket.ticketPrice ? `$${ticket.ticketPrice}` : 'Unavailable'}</strong></div>
                    <div><span>Contract</span><strong className="mono">{ticket.eventAddress}</strong></div>
                    <div><span>Buyer</span><strong className="mono">{parsedPayload?.buyerAddress || 'Unavailable'}</strong></div>
                </div>
                <div className="qr-row">
                    <QRCodeSVG value={ticket.qrPayload} size={160} />
                    <div className="payload-box">
                        <h5>Validation Payload</h5>
                        <p><strong>Event:</strong> {parsedPayload?.eventAddress || 'Unavailable'}</p>
                        <p><strong>Ticket ID:</strong> {parsedPayload?.ticketId || 'Unavailable'}</p>
                        <p><strong>Issued:</strong> {parsedPayload?.issuedAt || 'Unavailable'}</p>
                        <p><strong>Nonce:</strong> {parsedPayload?.nonce || 'Unavailable'}</p>
                        <Button
                            size="tiny"
                            color="blue"
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(ticket.qrPayload || '');
                                    this.setState({ copiedTicketKey: ticketKey });
                                } catch (error) {
                                    this.setState({ errorMessage: 'Unable to copy QR payload.' });
                                }
                            }}
                        >
                            Copy QR Payload
                        </Button>
                        {this.state.copiedTicketKey === ticketKey ? <span className="copied-pill">Copied</span> : null}
                    </div>
                </div>
            </article>
        );
    }

    render() {
        return (
            <Layout>
                <div className="tm-tickets-page">
                    <section className="hero-panel">
                        <span className="kicker">Client Wallet</span>
                        <h1>My Tickets</h1>
                        <p>All purchased tickets with QR payload data ready for event validation.</p>
                    </section>
                    {this.state.errorMessage ? <Message error content={this.state.errorMessage} /> : null}
                    {!this.state.loading && this.state.tickets.length === 0 ? (
                        <Message info content="No tickets found in this browser wallet storage." />
                    ) : null}
                    <section className="ticket-grid">
                        {this.state.tickets.map((ticket) => this.renderTicket(ticket))}
                    </section>
                </div>
                <style jsx>{`
                    .tm-tickets-page { display: flex; flex-direction: column; gap: 12px; font-family: 'Nunito Sans', sans-serif; }
                    .hero-panel { border-radius: 22px; padding: 20px; background: radial-gradient(circle at top right, rgba(0, 185, 242, 0.24), transparent 30%), linear-gradient(125deg, #00112c 0%, #002d72 55%, #026cdf 100%); color: white; }
                    .kicker { display: inline-block; margin-bottom: 6px; color: #7dd3fc; font-size: 0.72rem; letter-spacing: 0.11em; text-transform: uppercase; font-weight: 800; }
                    .hero-panel h1 { margin: 0 0 6px; font-family: 'Barlow Condensed', sans-serif; font-size: 2.4rem; text-transform: uppercase; }
                    .hero-panel p { margin: 0; color: #dbeafe; }
                    .ticket-grid { display: grid; gap: 12px; }
                    .ticket-card { border: 1px solid #dbeafe; border-radius: 18px; background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%); padding: 14px; box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08); }
                    .ticket-head { display: flex; justify-content: space-between; gap: 10px; align-items: center; }
                    .ticket-pill { border-radius: 999px; background: #dbeafe; color: #1d4ed8; padding: 5px 10px; font-size: 0.72rem; font-weight: 800; }
                    .desc { margin: 0 0 10px; color: #334155; }
                    .meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-bottom: 10px; }
                    .meta-grid div { border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px; background: white; }
                    .meta-grid span { display: block; font-size: 0.72rem; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
                    .meta-grid strong { color: #0f172a; font-size: 0.86rem; }
                    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; word-break: break-all; }
                    .qr-row { display: grid; grid-template-columns: 180px 1fr; gap: 12px; align-items: start; }
                    .payload-box { border: 1px solid #e2e8f0; border-radius: 12px; background: white; padding: 10px; }
                    .payload-box h5 { margin: 0 0 8px; font-size: 0.9rem; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.04em; }
                    .payload-box p { margin: 0 0 5px; color: #334155; font-size: 0.82rem; word-break: break-word; }
                    .copied-pill { margin-left: 8px; color: #059669; font-weight: 700; font-size: 0.8rem; }
                    @media (max-width: 760px) { .qr-row, .meta-grid { grid-template-columns: 1fr; } }
                `}</style>
            </Layout>
        );
    }
}

export default ClientTicketsPage;
