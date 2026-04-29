import React, { Component } from 'react';
import { Header, Message } from 'semantic-ui-react';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '../../components/layout';
import Event from '../../ethereum/event';

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
        errorMessage: ''
    };

    isTicketOwnedByClient(ticket, clientAccount, clientWallet) {
        if (clientAccount && ticket.purchaserId) {
            return ticket.purchaserId === clientAccount;
        }

        if (clientWallet && ticket.buyerAddress) {
            return ticket.buyerAddress.toLowerCase() === clientWallet.toLowerCase();
        }

        return false;
    }

    componentDidMount() {
        try {
            const clientAccount = window.localStorage.getItem('clientAccount') || '';
            const clientWallet = window.localStorage.getItem('clientWallet') || '';
            const storageKey = `clientTickets:${this.props.eventAddress}`;
            const stored = window.localStorage.getItem(storageKey);
            const tickets = stored ? JSON.parse(stored) : [];
            const ticket = tickets.find((item) =>
                item.ticketId.toString() === this.props.ticketId.toString() &&
                this.isTicketOwnedByClient(item, clientAccount, clientWallet)
            );

            if (!ticket) {
                this.setState({ errorMessage: 'Ticket not found in this browser wallet storage.' });
                return;
            }

            this.setState({ ticket });
        } catch (error) {
            this.setState({ errorMessage: 'Unable to load ticket details.' });
        }
    }

    render() {
        const { ticket, errorMessage } = this.state;

        return (
            <Layout>
                <div className="tm-ticket-page">
                    <section className="hero-panel">
                        <span className="kicker">Client Ticket Wallet</span>
                        <h1>My Ticket</h1>
                        <p>{this.props.eventName}</p>
                    </section>
                    <section className="ticket-panel">
                        <div className="details">
                            <Header as="h3">Ticket Details</Header>
                            <p><strong>Event:</strong> {this.props.eventName}</p>
                            <p><strong>Description:</strong> {this.props.eventDescription || 'No description'}</p>
                            <p><strong>Date:</strong> {this.props.eventDate || 'Not set'}</p>
                            <p><strong>Contract:</strong> <span className="mono">{this.props.eventAddress}</span></p>
                            <p><strong>Ticket ID:</strong> {this.props.ticketId}</p>
                            {errorMessage ? <Message error content={errorMessage} /> : null}
                        </div>
                        {ticket ? (
                            <div className="qr-shell">
                                <QRCodeSVG value={ticket.qrPayload} size={220} />
                                <p className="payload">{ticket.qrPayload}</p>
                            </div>
                        ) : null}
                    </section>
                </div>
                <style jsx>{`
                    .tm-ticket-page { display: flex; flex-direction: column; gap: 12px; font-family: 'Nunito Sans', sans-serif; }
                    .hero-panel {
                        border-radius: 22px;
                        padding: 20px;
                        background: radial-gradient(circle at top right, rgba(0, 185, 242, 0.24), transparent 30%), linear-gradient(125deg, #00112c 0%, #002d72 55%, #026cdf 100%);
                        color: white;
                    }
                    .kicker { display: inline-block; margin-bottom: 6px; color: #7dd3fc; font-size: 0.72rem; letter-spacing: 0.11em; text-transform: uppercase; font-weight: 800; }
                    .hero-panel h1 { margin: 0 0 6px; font-family: 'Barlow Condensed', sans-serif; font-size: 2.3rem; text-transform: uppercase; }
                    .hero-panel p { margin: 0; color: #dbeafe; }
                    .ticket-panel {
                        border: 1px solid #dbeafe;
                        border-radius: 20px;
                        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
                        padding: 16px;
                        display: grid;
                        grid-template-columns: 1.1fr 0.9fr;
                        gap: 16px;
                    }
                    .details p { margin: 0 0 8px; color: #334155; }
                    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; word-break: break-all; }
                    .qr-shell { border: 1px solid #e2e8f0; border-radius: 14px; background: white; padding: 12px; }
                    .payload { margin: 10px 0 0; color: #64748b; font-size: 0.78rem; line-height: 1.45; word-break: break-all; }
                    @media (max-width: 820px) { .ticket-panel { grid-template-columns: 1fr; } }
                `}</style>
            </Layout>
        );
    }
}

export default ClientTicketPage;
