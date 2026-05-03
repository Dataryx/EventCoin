import React, { Component } from 'react';
import { Button, Message, Input } from 'semantic-ui-react';
import { contractAddress, getDeployedEventsInstance } from '../../ethereum/factory';
import Layout from '../../components/layout';
import { Link } from '../../routes';
import Event from '../../ethereum/event';
import { getClientSession, isTicketOwnedByClient } from '../../ethereum/clientSession';
import { ensureClientTicketStorageVersion, reconcileClientTicketsForEvent } from '../../ethereum/clientTickets';
import ClientAccountDropdown from '../../components/clientAccountDropdown';
import ClientWalletBalance from '../../components/clientWalletBalance';
import { fetchEthUsdRate, formatEthFromWei, formatUsdFromWei } from '../../utils/ethPricing';

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
                    ticketPriceWei: summary[1] ? summary[1].toString() : '0',
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
        clientWallet: '',
        ethUsdRate: null,
        searchTerm: '',
        selectedCategory: 'All Events',
        myTickets: []
    };

    async componentDidMount() {
        const ethUsdRate = await fetchEthUsdRate();
        this.setState({ ethUsdRate });
        this.loadClientTickets();
    }

    loadClientTickets = async () => {
        const session = getClientSession();
        ensureClientTicketStorageVersion();
        const ticketKeys = Object.keys(window.localStorage).filter((key) => key.startsWith('clientTickets:'));
        const ticketGroups = await Promise.all(
            ticketKeys.map((key) => reconcileClientTicketsForEvent(key.split(':')[1], session))
        );
        const myTickets = ticketGroups.flat().filter((ticket) => isTicketOwnedByClient(ticket, session));

        this.setState({
            clientAccount: session.clientAccount,
            clientWallet: session.clientWallet,
            myTickets
        });
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

    getSellThroughPercent(event) {
        if (!event.ticketSupply) {
            return 0;
        }

        return Math.min(Math.round((event.ticketsSold / event.ticketSupply) * 100), 100);
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

    renderEventCards() {
        const filteredEvents = this.getFilteredEvents();
        if (filteredEvents.length === 0) {
            return <p className="empty-state">No events found.</p>;
        }

        return (
            <div className="events-list">
                <div className="section-header">
                    <h2>LIVE EVENTS</h2>
                    <div className="line" />
                </div>
                <div
                    className="events-grid"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: '14px',
                        alignItems: 'stretch'
                    }}
                >
                    {filteredEvents.map((event) => {
                        const isSoldOut = event.ticketSupply > 0 && event.ticketsSold >= event.ticketSupply;
                        const left = Math.max(event.ticketSupply - event.ticketsSold, 0);
                        const schedule = this.formatEventSchedule(event);
                        const sellThrough = this.getSellThroughPercent(event);
                        const statusLabel = isSoldOut ? 'SOLD OUT' : sellThrough < 25 ? 'PRESALE' : 'LIVE';
                        const availabilityLabel = event.ticketSupply > 0 ? `${left} tickets left` : 'Open inventory';

                        return (
                            <article
                                key={event.address}
                                className={`event-card ${isSoldOut ? 'sold-out' : ''}`}
                                style={{
                                    background: isSoldOut
                                        ? 'linear-gradient(180deg, #ffffff 0%, #fff7f7 100%)'
                                        : 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
                                    borderRadius: '18px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: `1px solid ${isSoldOut ? '#fecaca' : '#dbeafe'}`,
                                    overflow: 'hidden',
                                    minHeight: '100%',
                                    boxShadow: '0 14px 28px rgba(15, 23, 42, 0.08)'
                                }}
                            >
                                <div
                                    className="event-poster"
                                    style={{
                                        position: 'relative',
                                        minHeight: '124px',
                                        padding: '14px 16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        background: 'radial-gradient(circle at top right, rgba(217, 70, 239, 0.42), transparent 32%), linear-gradient(135deg, #00112c 0%, #002d72 55%, #026cdf 100%)'
                                    }}
                                >
                                    <div className="poster-overlay" />
                                    <div
                                        className="poster-topline"
                                        style={{
                                            position: 'relative',
                                            zIndex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '10px'
                                        }}
                                    >
                                        <span
                                            className={`status-badge ${isSoldOut ? 'sold' : ''}`}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '999px',
                                                padding: '7px 12px',
                                                fontSize: '0.72rem',
                                                textTransform: 'uppercase',
                                                fontWeight: 800,
                                                letterSpacing: '0.06em',
                                                background: isSoldOut
                                                    ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                                                    : 'linear-gradient(135deg, #8b2cf5 0%, #d946ef 100%)',
                                                color: '#fff'
                                            }}
                                        >
                                            {statusLabel}
                                        </span>
                                        <span
                                            className="availability-pill"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '999px',
                                                padding: '7px 12px',
                                                fontSize: '0.72rem',
                                                textTransform: 'uppercase',
                                                fontWeight: 800,
                                                letterSpacing: '0.06em',
                                                background: 'rgba(255, 255, 255, 0.16)',
                                                color: '#fff',
                                                border: '1px solid rgba(255, 255, 255, 0.18)'
                                            }}
                                        >
                                            {availabilityLabel}
                                        </span>
                                    </div>
                                    <div
                                        className="poster-mark"
                                        style={{
                                            position: 'relative',
                                            zIndex: 1,
                                            width: '52px',
                                            height: '52px',
                                            borderRadius: '16px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'rgba(255, 255, 255, 0.14)',
                                            border: '1px solid rgba(255, 255, 255, 0.18)',
                                            color: '#fff',
                                            fontFamily: "'Barlow Condensed', sans-serif",
                                            fontSize: '1.2rem',
                                            fontWeight: 800,
                                            letterSpacing: '0.08em',
                                            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.18)'
                                        }}
                                    >
                                        {(event.name || 'Event')
                                            .split(' ')
                                            .filter(Boolean)
                                            .slice(0, 2)
                                            .map((word) => word[0])
                                            .join('')
                                            .toUpperCase() || 'EV'}
                                    </div>
                                </div>

                                <div
                                    className="event-card-top"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '12px 16px 0'
                                    }}
                                >
                                    <p
                                        className="event-schedule"
                                        style={{
                                            margin: 0,
                                            color: '#54657b',
                                            fontSize: '0.8rem',
                                            fontWeight: 800,
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        {schedule}
                                    </p>
                                </div>

                                <div
                                    className="event-main"
                                    style={{
                                        padding: '8px 16px 10px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        minHeight: '168px'
                                    }}
                                >
                                    <Link route={`/events/${event.address}/client`} legacyBehavior>
                                        <a
                                            style={{
                                                margin: 0,
                                                fontFamily: "'Barlow Condensed', sans-serif",
                                                fontSize: '1.55rem',
                                                fontWeight: 800,
                                                lineHeight: 1.05,
                                                color: '#003ba8',
                                                textDecoration: 'underline',
                                                textDecorationThickness: '2px',
                                                textUnderlineOffset: '3px'
                                            }}
                                        >
                                            {event.name || 'Unnamed Event'}
                                        </a>
                                    </Link>
                                    <p
                                        className="event-location"
                                        style={{
                                            margin: 0,
                                            color: '#1e293b',
                                            fontSize: '0.85rem',
                                            lineHeight: 1.5
                                        }}
                                    >
                                        {this.getEventLocation(event)}
                                    </p>
                                    <div
                                        className="meta-strip"
                                        style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}
                                    >
                                        <span className="meta-chip" style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '999px', padding: '4px 8px', background: '#dbeafe', color: '#1e3a8a', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Barcode Delivery</span>
                                        <span className="meta-chip" style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '999px', padding: '4px 8px', background: '#dbeafe', color: '#1e3a8a', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>On-chain</span>
                                        <span className="meta-chip" style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '999px', padding: '4px 8px', background: '#dbeafe', color: '#1e3a8a', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{event.ticketsSold} sold</span>
                                    </div>
                                    <p
                                        className="contract"
                                        style={{
                                            margin: 'auto 0 0',
                                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                            fontSize: '0.7rem',
                                            color: '#64748b',
                                            wordBreak: 'break-all'
                                        }}
                                    >
                                        {event.address}
                                    </p>
                                </div>

                                <div className="event-progress" style={{ padding: '0 16px 12px' }}>
                                    <div
                                        className="progress-copy"
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            gap: '10px',
                                            marginBottom: '6px',
                                            color: '#475569',
                                            fontSize: '0.74rem',
                                            fontWeight: 700
                                        }}
                                    >
                                        <span>Sell-through</span>
                                        <strong style={{ color: '#0f172a' }}>{sellThrough}%</strong>
                                    </div>
                                    <div
                                        className="progress-track"
                                        style={{
                                            height: '8px',
                                            borderRadius: '999px',
                                            background: '#dbeafe',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <span
                                            className="progress-fill"
                                            style={{
                                                display: 'block',
                                                width: `${sellThrough}%`,
                                                height: '100%',
                                                borderRadius: '999px',
                                                background: 'linear-gradient(90deg, #00b9f2 0%, #026cdf 100%)'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div
                                    className="event-footer"
                                    style={{
                                        padding: '12px 16px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '12px',
                                        marginTop: 'auto',
                                        borderTop: '1px solid #dbe4f0'
                                    }}
                                >
                                    <div className="price-block">
                                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em' }}>
                                            {isSoldOut ? 'STATUS' : 'FROM'}
                                        </p>
                                        {!isSoldOut ? (
                                            <div>
                                                <h4 style={{ margin: '4px 0 0', color: '#002060', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.4rem' }}>
                                                    {formatEthFromWei(event.ticketPriceWei)}
                                                </h4>
                                                <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.78rem', fontWeight: 700 }}>
                                                    {formatUsdFromWei(event.ticketPriceWei, this.state.ethUsdRate)}
                                                </p>
                                            </div>
                                        ) : (
                                            <h4 className="sold-out-text" style={{ margin: '4px 0 0', color: '#ef4444', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem' }}>
                                                SOLD OUT
                                            </h4>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        <Link route={`/events/${event.address}/client`} legacyBehavior>
                                            <a style={{ color: '#003ba8', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                View Details
                                            </a>
                                        </Link>
                                        {!isSoldOut ? (
                                            <Link route={`/events/${event.address}/client`} legacyBehavior>
                                                <a>
                                                    <Button
                                                        className="buy-btn"
                                                        style={{
                                                            borderRadius: '999px',
                                                            background: '#026CDF',
                                                            color: '#fff',
                                                            fontWeight: 800,
                                                            letterSpacing: '0.04em',
                                                            padding: '10px 16px'
                                                        }}
                                                    >
                                                        {left > 0 ? 'Buy Tickets' : 'Open Event'}
                                                    </Button>
                                                </a>
                                            </Link>
                                        ) : (
                                            <span className="sold-note" style={{ color: '#94a3b8', fontSize: '0.74rem', fontWeight: 700 }}>Join waitlist soon</span>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
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
            <Layout>
                <div className="tm-portal">
                    <div className="home-header">
                        <div>
                            <h1>FIND YOUR NEXT EVENT</h1>
                            <p>Signed in as: {this.state.clientAccount || 'Not connected'}</p>
                            <div className="header-balance">
                                <ClientWalletBalance
                                    walletAddress={this.state.clientWallet}
                                    label="Live ETH Balance"
                                    inverted
                                />
                            </div>
                        </div>
                        <ClientAccountDropdown
                            clientAccount={this.state.clientAccount}
                            clientWallet={this.state.clientWallet}
                            inverted
                        />
                    </div>
                    <div className="summary-row">
                        <div className="summary-card">
                            <h3>My Summary</h3>
                            <p>Events: {this.props.events.length}</p>
                            <p>My Tickets: {this.state.myTickets.length}</p>
                            <p>Tickets Available: {ticketsAvailableTotal}</p>
                        </div>
                        <div className="summary-card">
                            <h3>My Tickets</h3>
                            <p>Total Tickets: {this.state.myTickets.length}</p>
                            <Link route="/client/tickets" legacyBehavior>
                                <a><Button color="blue">My Tickets</Button></a>
                            </Link>
                        </div>
                    </div>
                    <section className="search-bar" style={{ marginTop: '0px' }}>
                        <Input
                            fluid
                            placeholder="Search events by name or contract address"
                            value={this.state.searchTerm}
                            onChange={(event) => this.setState({ searchTerm: event.target.value })}
                        />
                    </section>
                    <section className="pill-row">
                        {categories.map((category) => (
                            <button
                                key={category}
                                type="button"
                                className={`pill ${this.state.selectedCategory === category ? 'active' : ''}`}
                                onClick={() => this.setState({ selectedCategory: category })}
                            >
                                {category}
                            </button>
                        ))}
                    </section>
                    {this.renderEventCards()}
                </div>
                {this.props.loadError ? <Message error content={this.props.loadError} style={{ marginTop: '14px' }} /> : null}

                <style jsx>{`
                    .tm-portal {
                        font-family: 'Nunito Sans', sans-serif;
                    }
                    .home-header {
                        background: #002060;
                        color: white;
                        border-radius: 12px;
                        padding: 14px 16px;
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                    }
                    .home-header h1 {
                        margin: 0;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2rem;
                        letter-spacing: 0.03em;
                    }
                    .home-header p {
                        margin: 6px 0 0;
                        color: #cbd5e1;
                        font-size: 0.85rem;
                    }
                    .header-balance {
                        margin-top: 8px;
                    }
                    .summary-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                        margin-bottom: 12px;
                    }
                    .summary-card {
                        background: white;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                        padding: 12px;
                    }
                    .summary-card h3 {
                        margin: 0 0 8px;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 1.35rem;
                        color: #002060;
                    }
                    .summary-card p {
                        margin: 4px 0;
                        color: #334155;
                    }
                    .search-bar {
                        background: white;
                        padding: 10px;
                        border-radius: 12px;
                        margin-top: 12px;
                    }
                    .pill-row {
                        margin-top: 10px;
                        margin-bottom: 10px;
                        display: flex;
                        gap: 8px;
                        flex-wrap: wrap;
                    }
                    .pill {
                        border: 1px solid #cbd5e1;
                        background: white;
                        border-radius: 999px;
                        padding: 6px 12px;
                        font-weight: 700;
                        cursor: pointer;
                    }
                    .pill.active {
                        background: #026CDF;
                        color: white;
                        border-color: #026CDF;
                    }
                    .events-list {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .section-header {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-top: 2px;
                        margin-bottom: 4px;
                    }
                    .section-header h2 {
                        margin: 0;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-weight: 800;
                        font-size: 1.35rem;
                        letter-spacing: 0.06em;
                        color: #002060;
                    }
                    .section-header .line {
                        height: 1px;
                        flex: 1;
                        background: #cbd5e1;
                    }
                    .events-grid {
                        display: grid;
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 16px;
                        align-items: stretch;
                    }
                    .event-card {
                        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                        border-radius: 22px;
                        display: flex;
                        flex-direction: column;
                        border: 1px solid #dbeafe;
                        overflow: hidden;
                        min-height: 100%;
                        box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
                        transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
                    }
                    .event-card:hover {
                        transform: translateY(-3px);
                        border-color: #93c5fd;
                        box-shadow: 0 22px 40px rgba(15, 23, 42, 0.14);
                    }
                    .event-card.sold-out {
                        background: linear-gradient(180deg, #ffffff 0%, #fff7f7 100%);
                        border-color: #fecaca;
                    }
                    .event-poster {
                        position: relative;
                        min-height: 150px;
                        padding: 16px 18px;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        background:
                            radial-gradient(circle at top right, rgba(217, 70, 239, 0.42), transparent 32%),
                            linear-gradient(135deg, #00112c 0%, #002d72 55%, #026cdf 100%);
                    }
                    .poster-overlay {
                        position: absolute;
                        inset: 0;
                        background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(0, 0, 0, 0.12) 100%);
                    }
                    .poster-topline {
                        position: relative;
                        z-index: 1;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 10px;
                    }
                    .poster-mark {
                        position: relative;
                        z-index: 1;
                        width: 62px;
                        height: 62px;
                        border-radius: 18px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        background: rgba(255, 255, 255, 0.14);
                        border: 1px solid rgba(255, 255, 255, 0.18);
                        color: white;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 1.45rem;
                        font-weight: 800;
                        letter-spacing: 0.08em;
                        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
                    }
                    .event-card-top {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 14px 18px 0;
                    }
                    .status-badge,
                    .availability-pill {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 999px;
                        padding: 7px 12px;
                        font-size: 0.72rem;
                        text-transform: uppercase;
                        font-weight: 800;
                        letter-spacing: 0.06em;
                    }
                    .status-badge {
                        background: linear-gradient(135deg, #8b2cf5 0%, #d946ef 100%);
                        color: white;
                    }
                    .status-badge.sold {
                        background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
                    }
                    .availability-pill {
                        background: rgba(255, 255, 255, 0.16);
                        color: white;
                        border: 1px solid rgba(255, 255, 255, 0.18);
                    }
                    .event-main {
                        padding: 10px 18px 12px;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        min-height: 210px;
                    }
                    .event-schedule {
                        margin: 0;
                        color: #54657b;
                        font-size: 0.8rem;
                        font-weight: 800;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                    }
                    .event-main h3 {
                        margin: 0;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 1.8rem;
                        font-weight: 800;
                        line-height: 1.05;
                        color: #003ba8;
                        text-decoration: underline;
                        text-decoration-thickness: 2px;
                        text-underline-offset: 3px;
                    }
                    .event-location {
                        margin: 0;
                        color: #1e293b;
                        font-size: 0.92rem;
                        line-height: 1.5;
                    }
                    .meta-strip {
                        display: flex;
                        gap: 6px;
                        flex-wrap: wrap;
                    }
                    .meta-chip {
                        display: inline-flex;
                        align-items: center;
                        border-radius: 999px;
                        padding: 4px 8px;
                        background: #dbeafe;
                        color: #1e3a8a;
                        font-size: 0.68rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                    }
                    .contract {
                        margin: auto 0 0;
                        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                        font-size: 0.74rem;
                        color: #64748b;
                        word-break: break-all;
                    }
                    .event-progress {
                        padding: 0 18px 14px;
                    }
                    .progress-copy {
                        display: flex;
                        justify-content: space-between;
                        gap: 10px;
                        margin-bottom: 8px;
                        color: #475569;
                        font-size: 0.78rem;
                        font-weight: 700;
                    }
                    .progress-copy strong {
                        color: #0f172a;
                    }
                    .progress-track {
                        height: 8px;
                        border-radius: 999px;
                        background: #dbeafe;
                        overflow: hidden;
                    }
                    .progress-fill {
                        display: block;
                        height: 100%;
                        border-radius: 999px;
                        background: linear-gradient(90deg, #00b9f2 0%, #026cdf 100%);
                    }
                    .event-footer {
                        padding: 14px 18px 18px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                        margin-top: auto;
                        border-top: 1px solid #dbe4f0;
                    }
                    .price-block p {
                        margin: 0;
                        color: #64748b;
                        font-size: 0.72rem;
                        font-weight: 800;
                        letter-spacing: 0.08em;
                    }
                    .price-block h4 {
                        margin: 4px 0 0;
                        color: #002060;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2rem;
                    }
                    .sold-out-text {
                        color: #ef4444 !important;
                        font-size: 1.3rem !important;
                    }
                    .buy-btn {
                        border-radius: 999px !important;
                        background: #026CDF !important;
                        color: #fff !important;
                        font-weight: 800 !important;
                        letter-spacing: 0.04em;
                        padding: 12px 18px !important;
                    }
                    .sold-note {
                        color: #94a3b8;
                        font-size: 0.78rem;
                        font-weight: 700;
                    }
                    .empty-state {
                        color: #64748b;
                        padding: 16px;
                        background: white;
                        border-radius: 12px;
                    }
                    @media (max-width: 700px) {
                        .events-grid {
                            grid-template-columns: repeat(2, minmax(0, 1fr));
                        }
                    }
                    @media (max-width: 520px) {
                        .home-header {
                            flex-direction: column;
                            align-items: flex-start;
                        }
                        .summary-row {
                            grid-template-columns: 1fr;
                        }
                        .events-grid {
                            grid-template-columns: 1fr;
                        }
                        .event-main {
                            min-height: auto;
                        }
                        .event-footer {
                            flex-direction: column;
                            align-items: flex-start;
                        }
                    }
                `}</style>
            </Layout>
        );
    }
}

export default ClientDashboard;
