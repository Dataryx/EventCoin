import React, { Component } from 'react';
import { Button, Message, Input } from 'semantic-ui-react';
import { contractAddress, getDeployedEventsInstance } from '../../ethereum/factory';
import Layout from '../../components/layout';
import { Link } from '../../routes';
import Event from '../../ethereum/event';

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
            return <p className="empty-state">No events found.</p>;
        }

        return (
            <div className="events-list">
                <div className="section-header">
                    <h2>LIVE EVENTS</h2>
                    <div className="line" />
                </div>
                {filteredEvents.map((event, index) => {
                    const isSoldOut = event.ticketSupply > 0 && event.ticketsSold >= event.ticketSupply;
                    const isFeatured = index === 0;
                    const left = Math.max(event.ticketSupply - event.ticketsSold, 0);
                    const month = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][index % 12];
                    const day = String((index % 27) + 1).padStart(2, '0');
                    const week = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][index % 7];

                    return (
                        <article key={event.address} className={`event-card ${isSoldOut ? 'sold-out' : ''} ${isFeatured ? 'featured' : ''}`}>
                            <div className="date-col">
                                {isFeatured && !isSoldOut ? <div className="featured-pill">FEATURED</div> : null}
                                <small className="month">{month}</small>
                                <span>{day}</span>
                                <small className="weekday">{week}</small>
                            </div>
                            <div className="event-main">
                                <h3>{event.name || 'Unnamed Event'}</h3>
                                {event.eventDate ? <p className="event-date">Date: {event.eventDate}</p> : null}
                                {event.description ? <p className="desc">{event.description}</p> : null}
                                <p className="venue-row">
                                    <span className="pin">◎</span>
                                    <span className="contract">{event.address}</span>
                                </p>
                                <div className="tags">
                                    <span className={`tag ${isSoldOut ? 'sold' : 'live'}`}>{isSoldOut ? 'SOLD OUT' : 'LIVE NOW'}</span>
                                    <span className="tag">QR DELIVERY</span>
                                    <span className="tag">ON-CHAIN</span>
                                </div>
                            </div>
                            <div className="event-price">
                                {!isSoldOut ? <p>FROM</p> : null}
                                {!isSoldOut ? <h4>${event.ticketPriceWei}</h4> : <h4 className="sold-out-text">SOLD OUT</h4>}
                                {!isSoldOut ? (
                                    <Link route={`/events/${event.address}/client`} legacyBehavior>
                                        <a><Button className="buy-btn">{left > 0 ? 'BUY NOW' : 'CHECKOUT'}</Button></a>
                                    </Link>
                                ) : null}
                                {!isSoldOut ? <small className="left-count">{left} LEFT</small> : null}
                            </div>
                        </article>
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
            <Layout>
                <div className="tm-portal">
                    <div className="home-header">
                        <h1>FIND YOUR NEXT EVENT</h1>
                        <p>Connected wallet: {this.state.clientAccount || 'Not connected'}</p>
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
                    .summary-card p { margin: 4px 0; color: #334155; }
                    .muted { color: #64748b; font-size: 0.85rem; }
                    .event-card h3 {
                        font-family: 'Barlow Condensed', sans-serif;
                        font-weight: 800;
                        letter-spacing: 0.03em;
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
                    .events-list { display: flex; flex-direction: column; gap: 10px; }
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
                    .event-card {
                        background: white;
                        border-radius: 16px;
                        display: grid;
                        grid-template-columns: 86px 1fr 170px;
                        gap: 12px;
                        border: 1px solid #e2e8f0;
                        overflow: hidden;
                        transition: border-color 0.2s ease, box-shadow 0.2s ease;
                    }
                    .event-card.featured { border: 2px solid #026CDF; }
                    .event-card:not(.featured):hover {
                        border-color: #026CDF;
                        box-shadow: 0 6px 18px rgba(2, 108, 223, 0.12);
                    }
                    .event-card.sold-out { opacity: 0.82; background: #f3f4f6; }
                    .date-col {
                        background: #002060;
                        color: white;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2.1rem;
                        position: relative;
                        padding: 8px 0;
                    }
                    .featured-pill {
                        position: absolute;
                        top: 6px;
                        left: 6px;
                        background: #026CDF;
                        border-radius: 6px;
                        padding: 2px 7px;
                        font-size: 0.68rem;
                        text-transform: uppercase;
                        font-weight: 800;
                        letter-spacing: 0.04em;
                    }
                    .date-col .month { font-size: 1.1rem; color: #00B9F2; letter-spacing: 0.07em; }
                    .date-col .weekday { font-size: 0.9rem; letter-spacing: 0.07em; opacity: 0.92; }
                    .event-main { padding: 10px 0; }
                    .event-main h3 {
                        margin: 0 0 5px;
                        font-size: 13px;
                        font-weight: 800;
                        color: #0f172a;
                    }
                    .event-date { font-size: 0.78rem; color: #1e3a8a; font-weight: 700; }
                    .desc { font-size: 0.8rem; color: #475569; }
                    .event-main p { margin: 0 0 4px; color: #64748b; }
                    .venue-row {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .pin {
                        color: #94a3b8;
                        font-size: 0.78rem;
                    }
                    .contract { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.75rem; color: #64748b; word-break: break-all; }
                    .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
                    .tag { background: #dbeafe; color: #002060; border-radius: 999px; padding: 3px 8px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; }
                    .tag.live { background: #dcfce7; color: #00A651; }
                    .tag.sold { background: #fee2e2; color: #E53E3E; }
                    .event-price {
                        padding: 10px;
                        display: flex;
                        flex-direction: column;
                        align-items: flex-end;
                        justify-content: center;
                    }
                    .event-price p { margin: 0; color: #64748b; font-size: 0.76rem; }
                    .event-price h4 {
                        margin: 2px 0 8px;
                        color: #002060;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2.2rem;
                    }
                    .sold-out-text { color: #ef4444 !important; font-size: 1.45rem !important; }
                    .buy-btn {
                        width: 128px;
                        border-radius: 14px !important;
                        background: #026CDF !important;
                        color: #fff !important;
                        font-weight: 700 !important;
                    }
                    .left-count { color: #64748b; font-size: 0.72rem; margin-top: 6px; }
                    .empty-state { color: #64748b; padding: 16px; background: white; border-radius: 12px; }
                    @media (max-width: 800px) {
                        .summary-row { grid-template-columns: 1fr; }
                        .event-card { grid-template-columns: 78px 1fr; }
                        .event-price { align-items: flex-start; grid-column: span 2; border-top: 1px solid #e2e8f0; }
                    }
                `}</style>
            </Layout>
        );
    }
}

export default ClientDashboard;
