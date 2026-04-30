import React, { Component } from 'react';
import { Message, Button, Input, Dropdown } from 'semantic-ui-react';
import { contractAddress, getDeployedEventsInstance } from '../../ethereum/factory';
import AdminShell from '../../components/adminShell';
import { Link } from '../../routes';
import Event from '../../ethereum/event';

class AdminEvents extends Component {
    static async getInitialProps(props) {
        const successMessage = props?.query?.successMessage || '';

        if (!contractAddress || !getDeployedEventsInstance) {
            return { events: [], loadError: 'Set NEXT_PUBLIC_DIAMOND_ADDRESS in .env to load deployed events.', successMessage };
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
                        // Ignore invalid ticket lookups and continue.
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

            return { events, loadError: '', successMessage };
        } catch (error) {
            return { events: [], loadError: 'Unable to load events from blockchain right now.', successMessage };
        }
    }

    state = {
        adminAccount: '',
        searchTerm: '',
        sortOrder: 'latest'
    };

    componentDidMount() {
        this.setState({ adminAccount: window.localStorage.getItem('adminAccount') || '' });
    }

    getFilteredEvents() {
        const { searchTerm, sortOrder } = this.state;
        let events = [...this.props.events];

        if (searchTerm.trim()) {
            const key = searchTerm.trim().toLowerCase();
            events = events.filter((event) =>
                event.address.toLowerCase().includes(key) ||
                (event.name || '').toLowerCase().includes(key)
            );
        }

        events.sort((a, b) => (sortOrder === 'latest' ? b.address.localeCompare(a.address) : a.address.localeCompare(b.address)));
        return events;
    }

    getSellThroughPercent(event) {
        if (!event.ticketSupply) {
            return 0;
        }

        return Math.min(Math.round((event.ticketsSold / event.ticketSupply) * 100), 100);
    }

    formatCurrency(amount) {
        const numericAmount = Number(amount) || 0;
        return `$${numericAmount.toLocaleString('en-US')}`;
    }

    formatEventSchedule(event) {
        if (!event.eventDate) {
            return 'DATE TO BE ANNOUNCED';
        }

        const parsed = new Date(event.eventDate);
        if (Number.isNaN(parsed.getTime())) {
            return event.eventDate.toUpperCase();
        }

        const weekday = parsed.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        const month = parsed.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const day = parsed.toLocaleDateString('en-US', { day: 'numeric' });
        const time = parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        return `${weekday} - ${month} ${day} - ${time}`;
    }

    getEventLocation(event) {
        if (event.description && event.description.trim()) {
            return event.description.trim();
        }

        return 'EventCoin Live - On-chain ticket release';
    }

    renderEventsBoard() {
        const filteredEvents = this.getFilteredEvents();

        if (filteredEvents.length === 0) {
            return (
                <div className="empty-event-state">
                    <p>No events found yet. Create your first event to start tracking live performance.</p>
                    <Link route="/events/new" legacyBehavior>
                        <a><Button primary>Create Event</Button></a>
                    </Link>
                </div>
            );
        }

        const activeEvents = filteredEvents.filter((event) => event.ticketSupply === 0 || event.ticketsSold < event.ticketSupply);
        const soldOutEvents = filteredEvents.filter((event) => event.ticketSupply > 0 && event.ticketsSold >= event.ticketSupply);

        return (
            <div className="event-board">
                {activeEvents.length ? (
                    <div className="board-group">
                        <div className="board-group-head">
                            <h4>Active Events</h4>
                            <span className="group-count">{activeEvents.length} live listings</span>
                        </div>
                        <div
                            className="active-event-grid"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                gap: '14px',
                                alignItems: 'stretch'
                            }}
                        >
                            {activeEvents.map((event, index) => {
                                const sellThrough = this.getSellThroughPercent(event);
                                const revenueAmount = event.ticketPriceWei * event.ticketsSold;
                                const schedule = this.formatEventSchedule(event);
                                const badgeLabel = sellThrough < 25 ? 'PRESALE' : 'LIVE';

                                return (
                                    <article
                                        key={event.address}
                                        className="poster-event-card"
                                        style={{
                                            background: '#fff',
                                            borderRadius: '16px',
                                            border: '1px solid #dbe4f0',
                                            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            minWidth: 0,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div className="poster-header" style={{ padding: '16px 18px 0' }}>
                                            <span
                                                className="poster-badge"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: 'linear-gradient(135deg, #8b2cf5 0%, #d946ef 100%)',
                                                    color: '#fff',
                                                    minWidth: '88px',
                                                    borderRadius: '12px',
                                                    padding: '8px 12px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 800,
                                                    letterSpacing: '0.04em'
                                                }}
                                            >
                                                {badgeLabel}
                                            </span>
                                        </div>
                                        <div
                                            className="poster-body"
                                            style={{
                                                padding: '14px 18px 10px',
                                                minHeight: '156px',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}
                                        >
                                            <p
                                                className="poster-schedule"
                                                style={{
                                                    margin: '0 0 10px',
                                                    color: '#54657b',
                                                    fontSize: '0.82rem',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.08em',
                                                    textTransform: 'uppercase'
                                                }}
                                            >
                                                {schedule}
                                            </p>
                                            <Link route={`/events/${event.address}`} legacyBehavior>
                                                <a
                                                    className="poster-title"
                                                    style={{
                                                        display: 'inline-block',
                                                        marginBottom: '10px',
                                                        color: '#003ba8',
                                                        fontSize: '1rem',
                                                        lineHeight: 1.4,
                                                        fontWeight: 800,
                                                        textDecoration: 'underline',
                                                        textDecorationThickness: '2px',
                                                        textUnderlineOffset: '3px',
                                                        minHeight: '84px'
                                                    }}
                                                >
                                                    {event.name || 'Unnamed Event'}
                                                </a>
                                            </Link>
                                            <p
                                                className="poster-location"
                                                style={{
                                                    margin: 0,
                                                    color: '#1e293b',
                                                    fontSize: '0.88rem',
                                                    lineHeight: 1.45,
                                                    minHeight: '48px'
                                                }}
                                            >
                                                {this.getEventLocation(event)}
                                            </p>
                                        </div>
                                        <div
                                            className="poster-footer"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '14px 18px 16px',
                                                borderTop: '1px solid #dbe4f0',
                                                marginTop: 'auto'
                                            }}
                                        >
                                            <div
                                                className="sponsor-mark"
                                                style={{
                                                    width: '42px',
                                                    height: '42px',
                                                    borderRadius: '999px',
                                                    background: 'linear-gradient(135deg, #2058e8 0%, #426dff 100%)',
                                                    color: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 800,
                                                    flexShrink: 0
                                                }}
                                            >
                                                EC
                                            </div>
                                            <div
                                                className="poster-footer-copy"
                                                style={{
                                                    minWidth: 0,
                                                    flex: 1,
                                                    display: 'flex',
                                                    flexDirection: 'column'
                                                }}
                                            >
                                                <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>EventCoin</strong>
                                                <span style={{ color: '#334155', fontSize: '0.76rem', lineHeight: 1.4 }}>
                                                    {event.ticketsSold}/{event.ticketSupply} sold • {this.formatCurrency(revenueAmount)}
                                                </span>
                                            </div>
                                            <Link route={`/events/${event.address}/validate`} legacyBehavior>
                                                <a
                                                    className="poster-footer-link"
                                                    style={{
                                                        color: '#003ba8',
                                                        fontSize: '0.74rem',
                                                        fontWeight: 800,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em'
                                                    }}
                                                >
                                                    Validate
                                                </a>
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                {soldOutEvents.length ? (
                    <div className="board-group">
                        <div className="board-group-head">
                            <h4>Sold Out Events</h4>
                            <span className="group-count">{soldOutEvents.length} archived performers</span>
                        </div>
                        <div
                            className="active-event-grid"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                gap: '14px',
                                alignItems: 'stretch'
                            }}
                        >
                            {soldOutEvents.map((event) => {
                                const revenueAmount = event.ticketPriceWei * event.ticketsSold;
                                const schedule = this.formatEventSchedule(event);

                                return (
                                    <article
                                        key={event.address}
                                        className="poster-event-card sold-out-card"
                                        style={{
                                            background: 'linear-gradient(180deg, #ffffff 0%, #fff7f7 100%)',
                                            borderRadius: '16px',
                                            border: '1px solid #fecaca',
                                            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            minWidth: 0,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div className="poster-header">
                                            <span className="poster-badge sold-out-badge">SOLD OUT</span>
                                        </div>
                                        <div className="poster-body">
                                            <p className="poster-schedule">{schedule}</p>
                                            <Link route={`/events/${event.address}`} legacyBehavior>
                                                <a className="poster-title">{event.name || 'Unnamed Event'}</a>
                                            </Link>
                                            <p className="poster-location">{this.getEventLocation(event)}</p>
                                        </div>
                                        <div className="poster-footer">
                                            <div className="sponsor-mark">EC</div>
                                            <div className="poster-footer-copy">
                                                <strong>EventCoin</strong>
                                                <span>{event.ticketsSold}/{event.ticketSupply} sold - {this.formatCurrency(revenueAmount)} - {event.validations} validated</span>
                                            </div>
                                            <Link route={`/events/${event.address}`} legacyBehavior>
                                                <a className="poster-footer-link">Open Dashboard</a>
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                ) : null}
            </div>
        );
    }

    render() {
        const sortOptions = [
            { key: 'latest', text: 'Latest First', value: 'latest' },
            { key: 'oldest', text: 'Oldest First', value: 'oldest' }
        ];

        return (
            <AdminShell
                activeRoute="/admin/events"
                title="Events Management"
                subtitle="Monitor all event contracts and open their operation views."
                walletAddress={this.state.adminAccount}
                topActions={(
                    <Link route="/events/new" legacyBehavior>
                        <a><Button primary>Create Event</Button></a>
                    </Link>
                )}
                heroTitle="Live Event Contracts"
                heroDescription={`${this.props.events.length} deployed event contracts ready for admin access.`}
            >
                {this.props.successMessage ? <Message success content={this.props.successMessage} style={{ marginBottom: '14px' }} /> : null}
                <section className="panel event-panel">
                    <div className="panel-header">
                        <div className="panel-heading-copy">
                            <span className="section-kicker">Operations Board</span>
                            <h3>Event Management</h3>
                        </div>
                        <div className="table-controls">
                            <Input
                                icon="search"
                                placeholder="Search event name or contract..."
                                value={this.state.searchTerm}
                                onChange={(event) => this.setState({ searchTerm: event.target.value })}
                            />
                            <Dropdown
                                selection
                                options={sortOptions}
                                value={this.state.sortOrder}
                                onChange={(event, data) => this.setState({ sortOrder: data.value })}
                            />
                        </div>
                    </div>
                    {this.renderEventsBoard()}
                </section>

                {this.props.loadError ? <Message error content={this.props.loadError} style={{ marginTop: '14px' }} /> : null}

                <style jsx>{`
                    .panel {
                        background: white;
                        border-radius: 18px;
                        padding: 18px;
                        box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
                        border: 1px solid #e2e8f0;
                    }
                    .event-panel {
                        background:
                            radial-gradient(circle at top right, rgba(0, 185, 242, 0.12), transparent 30%),
                            linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
                        border-radius: 24px;
                        padding: 22px;
                        box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
                        position: relative;
                        overflow: hidden;
                    }
                    .event-panel::before {
                        content: '';
                        position: absolute;
                        inset: 0 0 auto 0;
                        height: 4px;
                        background: linear-gradient(90deg, #002060 0%, #00b9f2 100%);
                    }
                    .panel-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 18px;
                        margin-bottom: 22px;
                        padding-bottom: 16px;
                        border-bottom: 1px solid #dbeafe;
                        position: relative;
                        z-index: 1;
                    }
                    .panel-heading-copy {
                        max-width: 700px;
                    }
                    .section-kicker {
                        display: inline-block;
                        margin-bottom: 8px;
                        color: #2563eb;
                        font-size: 0.72rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.12em;
                    }
                    .panel-heading-copy h3 {
                        margin: 0;
                        color: #0f172a;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2.15rem;
                        letter-spacing: 0.04em;
                        text-transform: uppercase;
                    }
                    .table-controls {
                        display: flex;
                        gap: 8px;
                        align-items: center;
                        flex-wrap: wrap;
                        padding: 10px 12px;
                        border-radius: 16px;
                        background: rgba(255, 255, 255, 0.82);
                        border: 1px solid #e2e8f0;
                        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
                    }
                    :global(.table-controls .ui.input > input) {
                        border-radius: 14px !important;
                        border: 1px solid #cbd5e1 !important;
                        min-width: 250px;
                    }
                    :global(.table-controls .ui.selection.dropdown) {
                        border-radius: 14px !important;
                        min-width: 160px;
                    }
                    .event-board {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        position: relative;
                        z-index: 1;
                    }
                    .board-group {
                        display: flex;
                        flex-direction: column;
                        gap: 14px;
                        padding: 18px;
                        border-radius: 22px;
                        background: linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(248, 251, 255, 0.98) 100%);
                        border: 1px solid #dbeafe;
                        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
                    }
                    .board-group-head {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 12px;
                        padding-bottom: 14px;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .board-group-head h4 {
                        margin: 0;
                        color: #0f172a;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 1.55rem;
                        letter-spacing: 0.04em;
                        text-transform: uppercase;
                    }
                    .group-count {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        padding: 8px 12px;
                        border-radius: 999px;
                        background: #eff6ff;
                        color: #1d4ed8;
                        font-size: 0.76rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                        white-space: nowrap;
                    }
                    .active-event-grid,
                    .event-card-grid {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 14px;
                        align-items: stretch;
                    }
                    .poster-event-card {
                        background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
                        border-radius: 18px;
                        overflow: hidden;
                        border: 1px solid #dbe4f0;
                        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
                        display: flex;
                        flex-direction: column;
                        min-width: 0;
                        min-height: 100%;
                        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
                    }
                    .poster-event-card.sold-out-card {
                        border-color: #fecaca;
                        background: linear-gradient(180deg, #ffffff 0%, #fff7f7 100%);
                    }
                    .poster-event-card:hover,
                    .event-ops-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 18px 34px rgba(15, 23, 42, 0.12);
                        border-color: #93c5fd;
                    }
                    .poster-header {
                        padding: 16px 18px 0;
                    }
                    .poster-badge {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(135deg, #8b2cf5 0%, #d946ef 100%);
                        color: white;
                        min-width: 88px;
                        border-radius: 12px;
                        padding: 8px 12px;
                        font-size: 0.78rem;
                        font-weight: 800;
                        letter-spacing: 0.04em;
                    }
                    .poster-badge.sold-out-badge {
                        background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
                    }
                    .poster-body {
                        padding: 14px 18px 10px;
                        min-height: 156px;
                        display: flex;
                        flex-direction: column;
                    }
                    .poster-schedule {
                        margin: 0 0 10px;
                        color: #54657b;
                        font-size: 0.82rem;
                        font-weight: 700;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                    }
                    .poster-title {
                        display: inline-block;
                        margin-bottom: 10px;
                        color: #003ba8;
                        font-size: 1rem;
                        line-height: 1.4;
                        font-weight: 800;
                        text-decoration: underline;
                        text-decoration-thickness: 2px;
                        text-underline-offset: 3px;
                        min-height: 84px;
                    }
                    .poster-location {
                        margin: 0;
                        color: #1e293b;
                        font-size: 0.88rem;
                        line-height: 1.45;
                        min-height: 48px;
                    }
                    .poster-footer {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 14px 18px 16px;
                        border-top: 1px solid #dbe4f0;
                        margin-top: auto;
                    }
                    .sponsor-mark {
                        width: 42px;
                        height: 42px;
                        border-radius: 999px;
                        background: linear-gradient(135deg, #2058e8 0%, #426dff 100%);
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 800;
                        flex-shrink: 0;
                    }
                    .poster-footer-copy {
                        min-width: 0;
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                    }
                    .poster-footer-copy strong {
                        color: #0f172a;
                        font-size: 0.92rem;
                    }
                    .poster-footer-copy span {
                        color: #334155;
                        font-size: 0.76rem;
                        line-height: 1.4;
                    }
                    .poster-footer-link {
                        color: #003ba8;
                        font-size: 0.74rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    .event-ops-card {
                        border-radius: 18px;
                        padding: 16px;
                        border: 1px solid #dbeafe;
                        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
                        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
                    }
                    .event-ops-card.sold {
                        border-color: #fecaca;
                        background: linear-gradient(180deg, #ffffff 0%, #fff7f7 100%);
                    }
                    .event-ops-top {
                        display: flex;
                        gap: 12px;
                        align-items: flex-start;
                        margin-bottom: 14px;
                    }
                    .event-avatar {
                        width: 52px;
                        height: 52px;
                        border-radius: 16px;
                        background: linear-gradient(135deg, #002060 0%, #026cdf 100%);
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 1.25rem;
                        font-weight: 800;
                        letter-spacing: 0.06em;
                        flex-shrink: 0;
                    }
                    .event-top-copy {
                        min-width: 0;
                        flex: 1;
                    }
                    .title-row {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 10px;
                        margin-bottom: 5px;
                    }
                    .title-row h4 {
                        margin: 0;
                        color: #0f172a;
                        font-size: 1.05rem;
                    }
                    .event-top-copy p {
                        margin: 0 0 4px;
                        color: #64748b;
                        font-size: 0.82rem;
                    }
                    .event-insights {
                        display: grid;
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 8px;
                        margin-bottom: 14px;
                    }
                    .insight-block {
                        background: rgba(255, 255, 255, 0.72);
                        border: 1px solid #e2e8f0;
                        border-radius: 14px;
                        padding: 10px;
                    }
                    .insight-block span {
                        display: block;
                        color: #64748b;
                        font-size: 0.72rem;
                        margin-bottom: 4px;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    .insight-block strong {
                        color: #0f172a;
                        font-size: 0.92rem;
                    }
                    .event-actions {
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                    }
                    .primary-action,
                    .secondary-action {
                        border-radius: 999px;
                        padding: 8px 14px;
                        font-size: 0.8rem;
                        font-weight: 700;
                    }
                    .primary-action {
                        background: #026cdf;
                        color: white;
                    }
                    .secondary-action {
                        background: #eff6ff;
                        color: #1d4ed8;
                    }
                    .empty-event-state {
                        border: 1px dashed #cbd5e1;
                        border-radius: 18px;
                        padding: 24px;
                        text-align: center;
                        background: #f8fafc;
                    }
                    .empty-event-state p {
                        margin: 0 0 14px;
                        color: #64748b;
                    }
                    .mono {
                        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                        font-size: 0.8rem;
                        word-break: break-all;
                    }
                    .status-pill {
                        padding: 4px 10px;
                        border-radius: 999px;
                        font-size: 0.75rem;
                        font-weight: 600;
                    }
                    .status-pill.draft {
                        background: #f1f5f9;
                        color: #334155;
                    }
                    @media (max-width: 720px) {
                        .active-event-grid,
                        .event-card-grid,
                        .event-insights {
                            grid-template-columns: 1fr;
                        }
                    }
                    @media (max-width: 680px) {
                        .panel-header {
                            flex-direction: column;
                            align-items: stretch;
                        }
                        .table-controls {
                            flex-direction: column;
                            align-items: stretch;
                        }
                        .board-group-head {
                            flex-direction: column;
                            align-items: flex-start;
                        }
                        :global(.table-controls .ui.input > input),
                        :global(.table-controls .ui.selection.dropdown) {
                            min-width: 0;
                            width: 100%;
                        }
                        .poster-body,
                        .poster-title,
                        .poster-location {
                            min-height: auto;
                        }
                    }
                `}</style>
            </AdminShell>
        );
    }
}

export default AdminEvents;
