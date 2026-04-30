import React, { Component } from 'react';
import { Message, Icon } from 'semantic-ui-react';
import Layout from '../../components/layout';
import Event from '../../ethereum/event';
import { Link } from '../../routes';

class EventShow extends Component {
    static async getInitialProps(props) {
        const event = Event(props.query.address);
        const summary = await event.methods.getEventDetails().call();
        const owner = await event.methods.manager().call();
        const ticketSupply = parseInt(summary[2], 10) || 0;
        const zeroAddress = '0x0000000000000000000000000000000000000000';
        const soldTicketsRaw = await Promise.all(
            Array.from({ length: ticketSupply }, (_, ticketId) => (
                event.methods.tickets(ticketId).call()
                    .then((ticket) => {
                        const ticketOwner = ticket.owner || ticket[0] || '';
                        const isUsed = Boolean(ticket.isUsed || ticket[1]);
                        if (!ticketOwner || ticketOwner.toLowerCase() === zeroAddress) {
                            return null;
                        }
                        return {
                            ticketId,
                            owner: ticketOwner,
                            isUsed
                        };
                    })
                    .catch(() => null)
            ))
        );
        const soldTickets = soldTicketsRaw.filter(Boolean);

        return {
            name: summary[0],
            ticketPrice: summary[1].toString(),
            ticketSupply: summary[2].toString(),
            ticketsSold: summary[3].toString(),
            description: summary[4] || '',
            eventDate: summary[5] || '',
            owner,
            contractAddress: props.query.address,
            soldTickets,
            successMessage: props.query.successMessage || ''
        };
    }

    constructor(props) {
        super(props);
        this.state = {
            errorMessage: '',
            successMessage: this.props.successMessage
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.successMessage !== this.props.successMessage) {
            this.setState({ successMessage: this.props.successMessage });
        }
    }

    renderTicketList(tickets, emptyCopy) {
        if (!tickets.length) {
            return <p className="empty-ticket-copy">{emptyCopy}</p>;
        }

        return (
            <ul className="ticket-list">
                {tickets.map((ticket) => (
                    <li key={ticket.ticketId} className="ticket-row">
                        <span className="ticket-id">#{ticket.ticketId}</span>
                        <span className="ticket-owner mono">{ticket.owner}</span>
                    </li>
                ))}
            </ul>
        );
    }

    renderActionDeck() {
        const { contractAddress } = this.props;
        const actions = [
            {
                label: 'Validate Ticket Barcode',
                route: `/events/${contractAddress}/validate`,
                icon: 'barcode',
                primary: true
            },
            {
                label: 'View Owners',
                route: `/events/${contractAddress}/owners`,
                icon: 'users',
                primary: true
            },
            {
                label: 'Use a Ticket',
                route: `/events/${contractAddress}/useTicket`,
                icon: 'check circle',
                primary: false
            },
            {
                label: 'Request a Refund',
                route: `/events/${contractAddress}/refundTicket`,
                icon: 'undo',
                primary: false
            },
            {
                label: 'Transfer Ticket',
                route: `/events/${contractAddress}/transferTicket`,
                icon: 'exchange',
                primary: false
            },
            {
                label: 'Open Client Purchase View',
                route: `/events/${contractAddress}/client`,
                icon: 'external',
                primary: false
            }
        ];

        return (
            <div className="action-button-grid">
                {actions.map((action) => (
                    <Link legacyBehavior key={action.route} route={action.route}>
                        <a className={`action-button ${action.primary ? 'primary' : 'secondary'}`}>
                            <span className="button-icon">
                                <Icon name={action.icon} />
                            </span>
                            <span className="button-label">{action.label}</span>
                        </a>
                    </Link>
                ))}
            </div>
        );
    }

    render() {
        const { errorMessage, successMessage } = this.state;
        const {
            name,
            ticketPrice,
            ticketSupply,
            ticketsSold,
            description,
            eventDate,
            owner,
            contractAddress,
            soldTickets
        } = this.props;

        const availableTickets = Math.max(parseInt(ticketSupply, 10) - parseInt(ticketsSold, 10), 0);
        const sellThrough = parseInt(ticketSupply, 10)
            ? Math.min(Math.round((parseInt(ticketsSold, 10) / parseInt(ticketSupply, 10)) * 100), 100)
            : 0;
        const usedTickets = soldTickets.filter((ticket) => ticket.isUsed);
        const unusedTickets = soldTickets.filter((ticket) => !ticket.isUsed);

        return (
            <Layout>
                <div className="tm-admin-page">
                    <section className="hero-panel">
                        <div className="hero-copy">
                            <span className="eyebrow">Event Admin Dashboard</span>
                            <h1>{name || 'Unnamed Event'}</h1>
                            <p className="hero-description">
                                Ticketmaster-style command center for event operations, inventory control, ticket validation, and fan purchase flows.
                            </p>
                            <div className="hero-meta">
                                <span className="meta-pill admin">ADMIN</span>
                                <span className="meta-pill">{eventDate || 'Date not set'}</span>
                                <span className="meta-pill">Sell-through {sellThrough}%</span>
                            </div>
                        </div>
                        <div className="hero-side">
                            <div className="hero-side-card">
                                <p className="side-label">Live Snapshot</p>
                                <h2>{availableTickets}</h2>
                                <p className="side-copy">Tickets still available for purchase</p>
                                <div className="side-row">
                                    <span>Sold</span>
                                    <strong>{ticketsSold}</strong>
                                </div>
                                <div className="side-row">
                                    <span>Price</span>
                                    <strong>${ticketPrice}</strong>
                                </div>
                            </div>
                        </div>
                    </section>

                    {errorMessage ? (
                        <Message error header="Oops!" content={errorMessage} style={{ marginTop: '12px' }} />
                    ) : null}
                    {successMessage ? (
                        <Message success header="Success!" content={successMessage} style={{ marginTop: '12px' }} />
                    ) : null}

                    <section className="detail-grid">
                        <article className="detail-panel spotlight">
                            <span className="section-kicker">Event Story</span>
                            <h3>Event Overview</h3>
                            <p className="detail-copy">
                                {description || 'No event description has been added yet.'}
                            </p>
                        </article>

                        <article className="detail-panel">
                            <span className="section-kicker">Contract</span>
                            <h3>Owner Wallet</h3>
                            <p className="mono">{owner}</p>
                            <h3 style={{ marginTop: '18px' }}>Event Contract</h3>
                            <p className="mono">{contractAddress}</p>
                        </article>
                    </section>

                    <section className="ticket-ledger">
                        <div className="ticket-ledger-head">
                            <span className="section-kicker">Ticket Story</span>
                            <h3>Sold Ticket Ledger</h3>
                            <p>Review sold tickets and split gate status between unused and used entries.</p>
                        </div>
                        <div className="ticket-ledger-grid">
                            <article className="ticket-ledger-panel">
                                <div className="ticket-ledger-panel-head">
                                    <h4>Unused Tickets</h4>
                                    <span className="count-pill">{unusedTickets.length}</span>
                                </div>
                                {this.renderTicketList(unusedTickets, 'No unused sold tickets right now.')}
                            </article>
                            <article className="ticket-ledger-panel used">
                                <div className="ticket-ledger-panel-head">
                                    <h4>Used Tickets</h4>
                                    <span className="count-pill used">{usedTickets.length}</span>
                                </div>
                                {this.renderTicketList(usedTickets, 'No tickets have been used yet.')}
                            </article>
                        </div>
                    </section>

                    <section className="action-rail">
                        <div className="action-rail-head">
                            <span className="section-kicker">Operations</span>
                            <h3>Action Center</h3>
                            <p>Launch the most important admin workflows from one clean control surface.</p>
                        </div>
                        {this.renderActionDeck()}
                    </section>
                </div>

                <style jsx>{`
                    .tm-admin-page {
                        display: flex;
                        flex-direction: column;
                        gap: 18px;
                        font-family: 'Nunito Sans', sans-serif;
                    }
                    .hero-panel {
                        display: grid;
                        grid-template-columns: 1.2fr 0.8fr;
                        gap: 18px;
                        padding: 28px;
                        border-radius: 28px;
                        background:
                            radial-gradient(circle at top right, rgba(0, 185, 242, 0.26), transparent 28%),
                            linear-gradient(125deg, #00112c 0%, #002d72 55%, #026cdf 100%);
                        color: white;
                        box-shadow: 0 24px 48px rgba(0, 32, 96, 0.22);
                    }
                    .eyebrow,
                    .section-kicker {
                        display: inline-block;
                        margin-bottom: 10px;
                        color: #7dd3fc;
                        font-size: 0.78rem;
                        font-weight: 800;
                        letter-spacing: 0.12em;
                        text-transform: uppercase;
                    }
                    .hero-copy h1 {
                        margin: 0 0 12px;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 3.2rem;
                        line-height: 0.96;
                        text-transform: uppercase;
                        letter-spacing: 0.03em;
                    }
                    .hero-description {
                        max-width: 650px;
                        color: #dbeafe;
                        font-size: 1rem;
                        line-height: 1.7;
                        margin-bottom: 18px;
                    }
                    .hero-meta {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                    }
                    .meta-pill {
                        border-radius: 999px;
                        padding: 8px 14px;
                        background: rgba(255, 255, 255, 0.12);
                        border: 1px solid rgba(255, 255, 255, 0.16);
                        font-size: 0.8rem;
                        font-weight: 800;
                        letter-spacing: 0.05em;
                    }
                    .meta-pill.admin {
                        background: white;
                        color: #026cdf;
                    }
                    .hero-side {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .hero-side-card {
                        width: 100%;
                        max-width: 360px;
                        padding: 22px;
                        border-radius: 24px;
                        background: rgba(255, 255, 255, 0.12);
                        border: 1px solid rgba(255, 255, 255, 0.16);
                        backdrop-filter: blur(10px);
                    }
                    .side-label {
                        margin: 0 0 8px;
                        color: #bfdbfe;
                        font-size: 0.76rem;
                        font-weight: 800;
                        letter-spacing: 0.12em;
                        text-transform: uppercase;
                    }
                    .hero-side-card h2 {
                        margin: 0 0 8px;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 3rem;
                        line-height: 1;
                    }
                    .side-copy {
                        margin: 0 0 14px;
                        color: #dbeafe;
                    }
                    .side-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 10px 0;
                        border-top: 1px solid rgba(255, 255, 255, 0.16);
                    }
                    .side-row span {
                        color: #dbeafe;
                        font-size: 0.88rem;
                    }
                    .side-row strong {
                        font-size: 0.92rem;
                    }
                    .detail-grid {
                        display: grid;
                        grid-template-columns: 1.15fr 0.85fr;
                        gap: 18px;
                    }
                    .detail-panel {
                        padding: 22px;
                        border-radius: 22px;
                        background: white;
                        border: 1px solid #e2e8f0;
                        box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
                    }
                    .detail-panel.spotlight {
                        background:
                            radial-gradient(circle at top right, rgba(0, 185, 242, 0.08), transparent 30%),
                            linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                    }
                    .detail-panel h3 {
                        margin: 0 0 10px;
                        color: #0f172a;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 1.7rem;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                    }
                    .detail-copy {
                        margin: 0;
                        color: #334155;
                        font-size: 1rem;
                        line-height: 1.8;
                    }
                    .mono {
                        margin: 0;
                        color: #334155;
                        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                        font-size: 0.88rem;
                        line-height: 1.7;
                        word-break: break-all;
                    }
                    .action-rail {
                        padding: 22px;
                        border-radius: 24px;
                        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                        border: 1px solid #dbeafe;
                        box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
                    }
                    .ticket-ledger {
                        padding: 22px;
                        border-radius: 24px;
                        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                        border: 1px solid #dbeafe;
                        box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
                    }
                    .ticket-ledger-head h3 {
                        margin: 0 0 8px;
                        color: #0f172a;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2rem;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                    }
                    .ticket-ledger-head p {
                        margin: 0 0 16px;
                        color: #64748b;
                        max-width: 660px;
                        line-height: 1.6;
                    }
                    .ticket-ledger-grid {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 12px;
                    }
                    .ticket-ledger-panel {
                        padding: 16px;
                        border-radius: 16px;
                        border: 1px solid #dbe4f0;
                        background: white;
                    }
                    .ticket-ledger-panel.used {
                        border-color: #fecaca;
                        background: #fff7f7;
                    }
                    .ticket-ledger-panel-head {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 10px;
                    }
                    .ticket-ledger-panel-head h4 {
                        margin: 0;
                        color: #0f172a;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 1.35rem;
                        letter-spacing: 0.03em;
                        text-transform: uppercase;
                    }
                    .count-pill {
                        border-radius: 999px;
                        padding: 5px 10px;
                        background: #dcfce7;
                        color: #166534;
                        font-size: 0.72rem;
                        font-weight: 800;
                        letter-spacing: 0.04em;
                    }
                    .count-pill.used {
                        background: #fee2e2;
                        color: #b91c1c;
                    }
                    .ticket-list {
                        list-style: none;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }
                    .ticket-row {
                        display: grid;
                        grid-template-columns: 74px 1fr;
                        gap: 10px;
                        padding: 9px 10px;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                        background: #f8fafc;
                    }
                    .ticket-id {
                        color: #026cdf;
                        font-weight: 800;
                        font-size: 0.88rem;
                    }
                    .ticket-owner {
                        font-size: 0.8rem;
                        color: #334155;
                    }
                    .empty-ticket-copy {
                        margin: 0;
                        color: #64748b;
                        font-size: 0.9rem;
                    }
                    .action-rail-head h3 {
                        margin: 0 0 8px;
                        color: #0f172a;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2rem;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                    }
                    .action-rail-head p {
                        margin: 0 0 16px;
                        color: #64748b;
                        max-width: 640px;
                        line-height: 1.6;
                    }
                    .action-button-grid {
                        display: grid;
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 12px;
                    }
                    .action-button {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        min-height: 58px;
                        padding: 14px 18px;
                        border-radius: 18px;
                        font-weight: 800;
                        letter-spacing: 0.01em;
                        text-align: center;
                        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
                    }
                    .action-button.primary {
                        background: linear-gradient(135deg, #002060 0%, #026cdf 100%);
                        border: 1px solid transparent;
                        color: white;
                        box-shadow: 0 16px 32px rgba(2, 108, 223, 0.2);
                    }
                    .action-button.secondary {
                        background: white;
                        border: 1px solid #dbe4f0;
                        color: #0f172a;
                    }
                    .action-button:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
                    }
                    .button-icon {
                        width: 32px;
                        height: 32px;
                        border-radius: 10px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }
                    .action-button.primary .button-icon {
                        background: rgba(255, 255, 255, 0.16);
                    }
                    .action-button.secondary .button-icon {
                        background: #eff6ff;
                        color: #026cdf;
                    }
                    .button-label {
                        display: inline-block;
                        font-size: 0.92rem;
                        line-height: 1.3;
                    }
                    @media (max-width: 980px) {
                        .hero-panel,
                        .detail-grid {
                            grid-template-columns: 1fr;
                        }
                        .ticket-ledger-grid {
                            grid-template-columns: 1fr;
                        }
                        .action-button-grid {
                            grid-template-columns: repeat(2, minmax(0, 1fr));
                        }
                    }
                    @media (max-width: 680px) {
                        .hero-panel {
                            padding: 20px;
                        }
                        .hero-copy h1 {
                            font-size: 2.4rem;
                        }
                        .action-button-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                `}</style>
            </Layout>
        );
    }
}

export default EventShow;
