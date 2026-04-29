import React, { Component } from 'react';
import { Message, Button, Icon } from 'semantic-ui-react';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '../../components/layout';
import Event from '../../ethereum/event';
import { getClientSession, isTicketOwnedByClient } from '../../ethereum/clientSession';
import { reconcileClientTicketsForEvent } from '../../ethereum/clientTickets';
import { Link } from '../../routes';

class ClientTicketsPage extends Component {
    state = {
        clientAccount: '',
        clientWallet: '',
        tickets: [],
        loading: true,
        errorMessage: '',
        copiedTicketKey: ''
    };

    async componentDidMount() {
        try {
            const session = getClientSession();
            const ticketKeys = Object.keys(window.localStorage).filter((key) => key.startsWith('clientTickets:'));
            const reconciledTickets = await Promise.all(
                ticketKeys.map((key) => reconcileClientTicketsForEvent(key.split(':')[1], session))
            );
            const baseTickets = reconciledTickets
                .flat()
                .filter((ticket) => isTicketOwnedByClient(ticket, session))
                .map((ticket) => ({
                    ...ticket,
                    eventAddress: ticket.eventAddress,
                    eventName: 'Unknown Event',
                    ticketPrice: '',
                    eventDescription: '',
                    eventDate: '',
                    detailsUnavailable: false
                }));

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
                    return {
                        ...ticket,
                        detailsUnavailable: true
                    };
                }
            }));

            this.setState({
                clientAccount: session.clientAccount,
                clientWallet: session.clientWallet,
                tickets: enrichedTickets,
                loading: false
            });
        } catch (error) {
            this.setState({ errorMessage: 'Unable to load tickets.', loading: false });
        }
    }

    downloadQr = (ticketKey) => {
        try {
            const svg = document.getElementById(`qr-${ticketKey}`);
            if (!svg) {
                throw new Error('QR code not found.');
            }

            const serializer = new XMLSerializer();
            const source = serializer.serializeToString(svg);
            const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${ticketKey}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            this.setState({ errorMessage: 'Unable to download QR right now.' });
        }
    };

    formatTicketDate(value) {
        if (!value) {
            return 'Date to be announced';
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }

        const weekday = parsed.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        const month = parsed.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const day = parsed.toLocaleDateString('en-US', { day: 'numeric' });
        const time = parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        return `${weekday} - ${month} ${day} - ${time}`;
    }

    getTicketStats() {
        const uniqueEvents = new Set(this.state.tickets.map((ticket) => ticket.eventAddress)).size;
        const pricedTickets = this.state.tickets.filter((ticket) => ticket.ticketPrice);
        const totalValue = pricedTickets.reduce((sum, ticket) => sum + (parseInt(ticket.ticketPrice, 10) || 0), 0);

        return {
            totalTickets: this.state.tickets.length,
            uniqueEvents,
            totalValue
        };
    }

    renderTicket(ticket) {
        let parsedPayload = null;
        try {
            parsedPayload = JSON.parse(ticket.qrPayload);
        } catch (error) {
            parsedPayload = null;
        }

        const ticketKey = `${ticket.eventAddress}-${ticket.ticketId}`;
        const formattedDate = this.formatTicketDate(ticket.eventDate);
        const isUsed = Boolean(ticket.isUsedOnChain);
        const fieldLabelStyle = {
            display: 'block',
            marginBottom: '6px',
            color: '#64748b',
            fontSize: '0.66rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
        };
        const fieldValueStyle = {
            display: 'block',
            color: '#0f172a',
            fontSize: '0.76rem',
            lineHeight: 1.4,
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            whiteSpace: 'normal'
        };
        const monoValueStyle = {
            ...fieldValueStyle,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace'
        };

        return (
            <article
                key={ticketKey}
                className="ticket-card"
                style={{
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid #dbeafe',
                    background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
                    boxShadow: '0 12px 24px rgba(15, 23, 42, 0.07)'
                }}
            >
                <div
                    className="ticket-hero"
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '10px 12px',
                        background: 'radial-gradient(circle at top right, rgba(217, 70, 239, 0.18), transparent 28%), linear-gradient(135deg, #00112c 0%, #002d72 58%, #026cdf 100%)',
                        color: '#fff'
                    }}
                >
                    <div className="ticket-hero-copy">
                        <span className="ticket-kicker">Event Pass</span>
                        <h3>{ticket.eventName || 'Unnamed Event'}</h3>
                        <p>{formattedDate}</p>
                    </div>
                    <div className="ticket-badge-wrap">
                        <span className={`ticket-status ${isUsed ? 'used' : ''}`}>
                            {isUsed ? 'Used' : 'QR Ready'}
                        </span>
                        <span className="ticket-number">#{ticket.ticketId}</span>
                    </div>
                </div>

                <div
                    className="ticket-body"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1.35fr 0.65fr',
                        gap: '8px',
                        padding: '10px 12px 12px'
                    }}
                >
                    <div
                        className="ticket-content"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            minWidth: 0
                        }}
                    >
                        {ticket.detailsUnavailable ? (
                            <Message warning content="Event details unavailable for this ticket on current network deployment." />
                        ) : null}
                        {isUsed ? (
                            <Message
                                warning
                                content="This ticket has already been used and is no longer valid for entry."
                            />
                        ) : null}

                        <div
                            className="section-label"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                alignSelf: 'flex-start',
                                borderRadius: '999px',
                                padding: '4px 9px',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase'
                            }}
                        >
                            Ticket Details
                        </div>
                        <p className="ticket-description">{ticket.eventDescription || 'Your secure on-chain ticket is ready for entry and validation.'}</p>

                        <div
                            className="details-grid"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                gap: '5px'
                            }}
                        >
                            <div
                                className="detail-card"
                                style={{
                                    borderRadius: '14px',
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    padding: '7px',
                                    minWidth: 0,
                                    overflow: 'hidden'
                                }}
                            >
                                <span style={fieldLabelStyle}>Event Date</span>
                                <strong style={fieldValueStyle}>{formattedDate}</strong>
                            </div>
                            <div
                                className="detail-card"
                                style={{
                                    borderRadius: '14px',
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    padding: '7px',
                                    minWidth: 0,
                                    overflow: 'hidden'
                                }}
                            >
                                <span style={fieldLabelStyle}>Contract</span>
                                <strong className="mono" style={monoValueStyle}>{ticket.eventAddress}</strong>
                            </div>
                            <div
                                className="detail-card full"
                                style={{
                                    gridColumn: '1 / -1',
                                    borderRadius: '14px',
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    padding: '7px',
                                    minWidth: 0,
                                    overflow: 'hidden'
                                }}
                            >
                                <span style={fieldLabelStyle}>Description</span>
                                <strong style={fieldValueStyle}>{ticket.eventDescription || 'No description available'}</strong>
                            </div>
                        </div>

                        <div
                            className="payload-panel"
                            style={{
                                borderRadius: '16px',
                                border: '1px solid #dbeafe',
                                background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
                                padding: '8px'
                            }}
                        >
                            <div className="payload-head">
                                <h5>Validation Data</h5>
                                <span className="payload-pill">Secure Pass</span>
                            </div>
                            <div
                                className="validation-grid"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                    gap: '5px'
                                }}
                            >
                                <div
                                    className="validation-item"
                                    style={{
                                        borderRadius: '14px',
                                        background: '#fff',
                                        border: '1px solid #e2e8f0',
                                        padding: '7px',
                                        minWidth: 0,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <span style={fieldLabelStyle}>Ticket Id</span>
                                    <strong style={fieldValueStyle}>{parsedPayload?.ticketId || 'Unavailable'}</strong>
                                </div>
                                <div
                                    className="validation-item"
                                    style={{
                                        borderRadius: '14px',
                                        background: '#fff',
                                        border: '1px solid #e2e8f0',
                                        padding: '7px',
                                        minWidth: 0,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <span style={fieldLabelStyle}>Buyer</span>
                                    <strong className="mono" style={monoValueStyle}>{parsedPayload?.buyerAddress || 'Unavailable'}</strong>
                                </div>
                                <div
                                    className="validation-item"
                                    style={{
                                        borderRadius: '14px',
                                        background: '#fff',
                                        border: '1px solid #e2e8f0',
                                        padding: '7px',
                                        minWidth: 0,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <span style={fieldLabelStyle}>Issued Date</span>
                                    <strong style={fieldValueStyle}>{parsedPayload?.issuedAt || 'Unavailable'}</strong>
                                </div>
                                <div
                                    className="validation-item"
                                    style={{
                                        borderRadius: '14px',
                                        background: '#fff',
                                        border: '1px solid #e2e8f0',
                                        padding: '7px',
                                        minWidth: 0,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <span style={fieldLabelStyle}>Nonce</span>
                                    <strong className="mono" style={monoValueStyle}>{parsedPayload?.nonce || 'Unavailable'}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        className="qr-panel"
                        style={{
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            background: '#fff',
                            padding: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                            minWidth: 0
                        }}
                    >
                        <div
                            className="section-label qr-label"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                alignSelf: 'center',
                                borderRadius: '999px',
                                padding: '4px 9px',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase'
                            }}
                        >
                            QR Access
                        </div>
                        <div
                            className="qr-shell"
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8px',
                                borderRadius: '16px',
                                background: 'radial-gradient(circle at top right, rgba(0, 185, 242, 0.14), transparent 30%), #f8fbff',
                                border: '1px solid #dbeafe'
                            }}
                        >
                            <QRCodeSVG id={`qr-${ticketKey}`} value={ticket.qrPayload} size={108} />
                        </div>
                        <div
                            className="ticket-actions"
                            style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                alignItems: 'center'
                            }}
                        >
                            <Link route={`/client/ticket/${ticket.eventAddress}/${ticket.ticketId}`} legacyBehavior>
                                <a className="ghost-link">View Ticket</a>
                            </Link>
                            <Button
                                className="copy-btn"
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
                            <Button className="download-btn" onClick={() => this.downloadQr(ticketKey)}>
                                Download QR
                            </Button>
                            {this.state.copiedTicketKey === ticketKey ? <span className="copied-pill">Copied</span> : null}
                        </div>
                    </div>
                </div>
            </article>
        );
    }

    render() {
        const { totalTickets, uniqueEvents, totalValue } = this.getTicketStats();

        return (
            <Layout>
                <div className="tm-tickets-page">
                    <section className="hero-panel">
                        <div className="hero-copy">
                            <span className="kicker">Client Ticket Wallet</span>
                            <h1>My Tickets</h1>
                            <p>Manage every purchased pass, QR credential, and event entry detail from one Ticketmaster-style wallet.</p>
                            <div className="hero-tags">
                                <span className="hero-tag">{totalTickets} passes</span>
                                <span className="hero-tag">{uniqueEvents} events</span>
                                <span className="hero-tag">{this.state.clientAccount || 'Guest session'}</span>
                            </div>
                        </div>
                        <div className="hero-side">
                            <span className="side-label">Current Client</span>
                            <h3>{this.state.clientAccount || 'Not signed in'}</h3>
                            <p>{this.state.clientWallet || 'Wallet not connected yet'}</p>
                            <div className="hero-actions">
                                <Link route="/client/dashboard" legacyBehavior>
                                    <a><Button className="hero-btn">Back to Events</Button></a>
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section className="summary-grid">
                        <article className="summary-card">
                            <span>Total Tickets</span>
                            <strong>{totalTickets}</strong>
                            <p>Purchases currently linked to this client session.</p>
                        </article>
                        <article className="summary-card">
                            <span>Active Events</span>
                            <strong>{uniqueEvents}</strong>
                            <p>Unique event contracts represented in your wallet.</p>
                        </article>
                        <article className="summary-card">
                            <span>Ticket Value</span>
                            <strong>${totalValue}</strong>
                            <p>Displayed as a simple dollar-style estimate from stored ticket prices.</p>
                        </article>
                    </section>

                    {this.state.errorMessage ? <Message error content={this.state.errorMessage} /> : null}
                    {!this.state.loading && this.state.tickets.length === 0 ? (
                        <section className="empty-state">
                            <span className="empty-kicker">No Passes Yet</span>
                            <h3>Your ticket wallet is empty</h3>
                            <p>Purchase tickets from the client event dashboard and they will appear here for this specific user only.</p>
                            <Link route="/client/dashboard" legacyBehavior>
                                <a><Button primary className="empty-btn">Browse Live Events</Button></a>
                            </Link>
                        </section>
                    ) : null}

                    <section className="ticket-grid">
                        {this.state.tickets.map((ticket) => this.renderTicket(ticket))}
                    </section>
                </div>
                <style jsx>{`
                    .tm-tickets-page {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        font-family: 'Nunito Sans', sans-serif;
                    }
                    .hero-panel {
                        display: grid;
                        grid-template-columns: 1.15fr 0.85fr;
                        gap: 16px;
                        border-radius: 26px;
                        padding: 26px;
                        color: white;
                        background:
                            radial-gradient(circle at top right, rgba(0, 185, 242, 0.28), transparent 28%),
                            linear-gradient(120deg, #00112c 0%, #002d72 46%, #026cdf 100%);
                        box-shadow: 0 26px 48px rgba(0, 32, 96, 0.22);
                    }
                    .kicker {
                        display: inline-block;
                        margin-bottom: 10px;
                        color: #7dd3fc;
                        font-size: 0.74rem;
                        letter-spacing: 0.12em;
                        text-transform: uppercase;
                        font-weight: 800;
                    }
                    .hero-copy h1 {
                        margin: 0 0 10px;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2.4rem;
                        text-transform: uppercase;
                        letter-spacing: 0.03em;
                    }
                    .hero-copy p {
                        margin: 0 0 14px;
                        color: #dbeafe;
                        line-height: 1.6;
                        font-size: 0.92rem;
                        max-width: 640px;
                    }
                    .hero-tags {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                    }
                    .hero-tag {
                        border-radius: 999px;
                        padding: 6px 12px;
                        font-size: 0.72rem;
                        font-weight: 800;
                        letter-spacing: 0.05em;
                        background: rgba(255, 255, 255, 0.12);
                        border: 1px solid rgba(255, 255, 255, 0.18);
                    }
                    .hero-side {
                        border-radius: 22px;
                        padding: 18px;
                        background: rgba(2, 23, 60, 0.42);
                        border: 1px solid rgba(191, 219, 254, 0.22);
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }
                    .side-label {
                        color: #bae6fd;
                        font-size: 0.72rem;
                        font-weight: 800;
                        letter-spacing: 0.11em;
                        text-transform: uppercase;
                    }
                    .hero-side h3 {
                        margin: 0;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2.2rem;
                        text-transform: uppercase;
                    }
                    .hero-side p {
                        margin: 0;
                        color: #dbeafe;
                        font-size: 0.85rem;
                        word-break: break-word;
                    }
                    .hero-actions {
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                        margin-top: auto;
                        padding-top: 10px;
                    }
                    :global(.hero-btn.ui.button) {
                        border-radius: 999px !important;
                        font-weight: 800 !important;
                        letter-spacing: 0.04em;
                    }
                    :global(.hero-btn.ghost.ui.button) {
                        border-color: rgba(255, 255, 255, 0.35) !important;
                        color: white !important;
                    }
                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 14px;
                    }
                    .summary-card {
                        position: relative;
                        overflow: hidden;
                        border-radius: 18px;
                        padding: 14px;
                        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                        border: 1px solid #dbeafe;
                        box-shadow: 0 12px 24px rgba(15, 23, 42, 0.07);
                    }
                    .summary-card::before {
                        content: '';
                        position: absolute;
                        inset: 0 auto 0 0;
                        width: 5px;
                        background: linear-gradient(180deg, #00b9f2 0%, #026cdf 100%);
                    }
                    .summary-card span {
                        display: block;
                        margin-bottom: 6px;
                        color: #64748b;
                        font-size: 0.72rem;
                        font-weight: 800;
                        letter-spacing: 0.1em;
                        text-transform: uppercase;
                    }
                    .summary-card strong {
                        display: block;
                        color: #0f172a;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 1.85rem;
                        line-height: 1;
                        margin-bottom: 8px;
                    }
                    .summary-card p {
                        margin: 0;
                        color: #475569;
                        font-size: 0.84rem;
                        line-height: 1.6;
                    }
                    .ticket-grid {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                    .ticket-card {
                        border-radius: 10px;
                        overflow: hidden;
                        border: 1px solid #dbeafe;
                        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                        box-shadow: 0 12px 24px rgba(15, 23, 42, 0.07);
                    }
                    .ticket-hero {
                        display: flex;
                        align-items: flex-start;
                        justify-content: space-between;
                        gap: 10px;
                        padding: 12px 14px;
                        background:
                            radial-gradient(circle at top right, rgba(217, 70, 239, 0.18), transparent 28%),
                            linear-gradient(135deg, #00112c 0%, #002d72 58%, #026cdf 100%);
                        color: white;
                    }
                    .ticket-kicker {
                        display: inline-block;
                        margin-bottom: 8px;
                        font-size: 0.72rem;
                        font-weight: 800;
                        letter-spacing: 0.11em;
                        text-transform: uppercase;
                        color: #93c5fd;
                    }
                    .ticket-hero-copy h3 {
                        margin: 0 0 6px;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 1.35rem;
                        line-height: 1.02;
                        text-transform: uppercase;
                        overflow-wrap: anywhere;
                    }
                    .ticket-hero-copy p {
                        margin: 0;
                        color: #dbeafe;
                        font-size: 0.72rem;
                        letter-spacing: 0.06em;
                        text-transform: uppercase;
                    }
                    .ticket-badge-wrap {
                        display: flex;
                        flex-direction: column;
                        align-items: flex-end;
                        gap: 6px;
                    }
                    .ticket-status,
                    .ticket-number,
                    .payload-pill {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 999px;
                        padding: 5px 9px;
                        font-size: 0.68rem;
                        font-weight: 800;
                        letter-spacing: 0.05em;
                        text-transform: uppercase;
                    }
                    .ticket-status {
                        background: #dcfce7;
                        color: #166534;
                    }
                    .ticket-status.used {
                        background: #fee2e2;
                        color: #b91c1c;
                    }
                    .ticket-number {
                        background: rgba(255, 255, 255, 0.14);
                        color: white;
                        border: 1px solid rgba(255, 255, 255, 0.16);
                    }
                    .ticket-body {
                        display: grid;
                        grid-template-columns: 1.45fr 0.55fr;
                        gap: 10px;
                        padding: 12px 14px 14px;
                    }
                    .ticket-content {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                        min-width: 0;
                    }
                    .ticket-description {
                        margin: 0;
                        color: #334155;
                        line-height: 1.55;
                        font-size: 0.8rem;
                        overflow-wrap: anywhere;
                    }
                    .section-label {
                        display: inline-flex;
                        align-items: center;
                        align-self: flex-start;
                        border-radius: 999px;
                        padding: 5px 10px;
                        background: #eff6ff;
                        color: #1d4ed8;
                        font-size: 0.72rem;
                        font-weight: 800;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                    }
                    .qr-label {
                        align-self: center;
                    }
                    .details-grid {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 6px;
                    }
                    .detail-card,
                    .validation-item {
                        border-radius: 12px;
                        background: white;
                        border: 1px solid #e2e8f0;
                        padding: 8px;
                    }
                    .detail-card.full,
                    .validation-item.full {
                        grid-column: 1 / -1;
                    }
                    .detail-card span,
                    .validation-item span {
                        display: block;
                        margin-bottom: 4px;
                        color: #64748b;
                        font-size: 0.66rem;
                        font-weight: 800;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                    }
                    .detail-card strong,
                    .validation-item strong {
                        color: #0f172a;
                        font-size: 0.76rem;
                        line-height: 1.35;
                        display: block;
                        overflow-wrap: anywhere;
                        word-break: break-word;
                    }
                    .mono {
                        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                        word-break: break-all;
                    }
                    .payload-panel {
                        border-radius: 10px;
                        border: 1px solid #dbeafe;
                        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                        padding: 10px;
                    }
                    .payload-head {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 10px;
                        margin-bottom: 10px;
                    }
                    .payload-head h5 {
                        margin: 0;
                        color: #002060;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 0.95rem;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                    }
                    .payload-pill {
                        background: #dbeafe;
                        color: #1d4ed8;
                    }
                    .payload-panel p {
                        margin: 0 0 6px;
                        color: #334155;
                        font-size: 0.82rem;
                        word-break: break-word;
                    }
                    .validation-grid {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 6px;
                    }
                    .qr-panel {
                        border-radius: 10px;
                        border: 1px solid #e2e8f0;
                        background: white;
                        padding: 10px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: space-between;
                        gap: 8px;
                        min-width: 0;
                    }
                    .qr-shell {
                        width: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 10px;
                        border-radius: 10px;
                        background:
                            radial-gradient(circle at top right, rgba(0, 185, 242, 0.14), transparent 30%),
                            #f8fbff;
                        border: 1px solid #dbeafe;
                    }
                    .ticket-actions {
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                        align-items: center;
                    }
                    .ghost-link {
                        color: #003ba8;
                        font-size: 0.68rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        text-align: center;
                    }
                    :global(.copy-btn.ui.button) {
                        width: 100%;
                        border-radius: 999px !important;
                        background: #026cdf !important;
                        color: white !important;
                        font-weight: 800 !important;
                        letter-spacing: 0.04em;
                    }
                    :global(.download-btn.ui.button) {
                        width: 100%;
                        border-radius: 999px !important;
                        background: #eff6ff !important;
                        color: #1d4ed8 !important;
                        border: 1px solid #bfdbfe !important;
                        font-weight: 800 !important;
                        letter-spacing: 0.04em;
                    }
                    .copied-pill {
                        color: #059669;
                        font-weight: 800;
                        font-size: 0.78rem;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                    }
                    .empty-state {
                        text-align: center;
                        border-radius: 10px;
                        padding: 28px;
                        border: 1px dashed #bfd7ff;
                        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                    }
                    .empty-kicker {
                        display: inline-block;
                        margin-bottom: 8px;
                        color: #2563eb;
                        font-size: 0.72rem;
                        font-weight: 800;
                        letter-spacing: 0.12em;
                        text-transform: uppercase;
                    }
                    .empty-state h3 {
                        margin: 0 0 8px;
                        color: #0f172a;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2rem;
                        text-transform: uppercase;
                    }
                    .empty-state p {
                        margin: 0 0 16px;
                        color: #475569;
                    }
                    :global(.empty-btn.ui.button) {
                        border-radius: 999px !important;
                        font-weight: 800 !important;
                        letter-spacing: 0.04em;
                    }
                    @media (max-width: 980px) {
                        .hero-panel,
                        .ticket-body,
                        .summary-grid {
                            grid-template-columns: 1fr;
                        }
                        .ticket-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                    @media (max-width: 760px) {
                        .hero-panel {
                            padding: 18px;
                        }
                        .hero-copy h1 {
                            font-size: 2.35rem;
                        }
                        .ticket-hero,
                        .ticket-body {
                            padding-left: 16px;
                            padding-right: 16px;
                        }
                        .ticket-hero {
                            flex-direction: column;
                        }
                        .ticket-badge-wrap {
                            align-items: flex-start;
                        }
                        .meta-grid {
                            grid-template-columns: 1fr;
                        }
                        .details-grid,
                        .validation-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                `}</style>
            </Layout>
        );
    }
}

export default ClientTicketsPage;
