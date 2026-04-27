import React, { Component } from 'react';
import { Button, Message, Grid, Input, Dropdown } from 'semantic-ui-react';
import { contractAddress, getDeployedEventsInstance } from '../../ethereum/factory';
import AdminShell from '../../components/adminShell';
import { Link } from '../../routes';
import Event from '../../ethereum/event';

class AdminDashboard extends Component {
    static async getInitialProps() {
        if (!contractAddress || !getDeployedEventsInstance) {
            return { events: [], stats: { totalEvents: 0, ticketsSold: 0, revenueWei: 0, validations: 0 }, loadError: 'Set NEXT_PUBLIC_DIAMOND_ADDRESS in .env to load deployed events.' };
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
                        // If ticket lookup fails for this id, skip.
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

            const stats = events.reduce((acc, item) => {
                acc.totalEvents += 1;
                acc.ticketsSold += item.ticketsSold;
                acc.revenueWei += item.ticketPriceWei * item.ticketsSold;
                acc.validations += item.validations;
                return acc;
            }, { totalEvents: 0, ticketsSold: 0, revenueWei: 0, validations: 0 });

            return { events, stats, loadError: '' };
        } catch (error) {
            return { events: [], stats: { totalEvents: 0, ticketsSold: 0, revenueWei: 0, validations: 0 }, loadError: 'Unable to load events from the blockchain right now.' };
        }
    }

    state = {
        adminAccount: '',
        searchTerm: '',
        sortOrder: 'latest'
    };

    componentDidMount() {
        const adminAccount = window.localStorage.getItem('adminAccount') || '';
        this.setState({ adminAccount });
    }

    getFilteredEvents() {
        const { events } = this.props;
        const { searchTerm, sortOrder } = this.state;
        let filtered = [...events];

        if (searchTerm.trim()) {
            const keyword = searchTerm.trim().toLowerCase();
            filtered = filtered.filter((event) =>
                event.address.toLowerCase().includes(keyword) ||
                event.name.toLowerCase().includes(keyword)
            );
        }

        filtered.sort((a, b) => (sortOrder === 'latest' ? b.address.localeCompare(a.address) : a.address.localeCompare(b.address)));
        return filtered;
    }

    renderEventsTable() {
        const filteredEvents = this.getFilteredEvents();
        if (filteredEvents.length === 0) {
            return <p style={{ color: '#64748b' }}>No events found yet. Create your first event.</p>;
        }

        return (
            <div className="event-table-wrap">
                <table className="event-table">
                    <thead>
                        <tr>
                            <th>Contract Address</th>
                            <th>Status</th>
                            <th>Performance</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEvents.map((event) => {
                            const soldOut = event.ticketSupply > 0 && event.ticketsSold >= event.ticketSupply;
                            const statusClass = soldOut ? 'draft' : 'live';

                            return (
                                <tr key={event.address}>
                                    <td>
                                        <p style={{ margin: 0, fontWeight: 700 }}>{event.name || 'Unnamed Event'}</p>
                                        <p style={{ margin: '2px 0', color: '#475569', fontSize: '0.8rem' }}>{event.eventDate || 'No date set'}</p>
                                        <p className="mono">{event.address}</p>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${statusClass}`}>
                                            {soldOut ? 'Sold Out' : 'Live'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="trend-badge positive">
                                            {event.ticketsSold}/{event.ticketSupply}
                                        </span>
                                    </td>
                                    <td>
                                        <Link route={`/events/${event.address}`} legacyBehavior>
                                            <a className="action-link">Dashboard</a>
                                        </Link>
                                        <Link route={`/events/${event.address}/validate`} legacyBehavior>
                                            <a className="action-link">Validate</a>
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    render() {
        const sortOptions = [
            { key: 'latest', text: 'Latest First', value: 'latest' },
            { key: 'oldest', text: 'Oldest First', value: 'oldest' }
        ];

        const statCards = [
            { title: 'Total Events', value: this.props.stats.totalEvents, accent: '#2563EB' },
            { title: 'Tickets Sold', value: this.props.stats.ticketsSold, accent: '#16A34A' },
            { title: 'Revenue (wei)', value: this.props.stats.revenueWei, accent: '#F59E0B' },
            { title: 'Validations', value: this.props.stats.validations, accent: '#A855F7' }
        ];

        return (
            <AdminShell
                activeRoute="/admin/dashboard"
                title="Admin Dashboard"
                subtitle="Manage blockchain events, tickets, and validations."
                walletAddress={this.state.adminAccount}
                topActions={(
                    <>
                        <Link route="/events/new" legacyBehavior>
                            <a><Button primary>Create Event</Button></a>
                        </Link>
                        <Button basic color="blue">Export Data</Button>
                    </>
                )}
                heroTitle="Wallet Command Center"
                heroDescription={this.state.adminAccount || 'Connect wallet to unlock admin actions.'}
                heroActions={(
                    <>
                        <Link route="/admin/ticket-validation" legacyBehavior>
                            <a><Button color="blue">Open Validation Queue</Button></a>
                        </Link>
                        <Button basic inverted>View Smart Contract</Button>
                    </>
                )}
            >
                <section className="stats-grid">
                    {statCards.map((card) => (
                        <article key={card.title} className="stat-card" style={{ borderTopColor: card.accent }}>
                            <p className="stat-title">{card.title}</p>
                            <h3>{card.value}</h3>
                        </article>
                    ))}
                </section>

                <Grid stackable columns={2} className="content-grid">
                    <Grid.Column width={11}>
                        <section className="panel">
                            <div className="panel-header">
                                <h3>Event Management</h3>
                                <div className="table-controls">
                                    <Input
                                        icon="search"
                                        placeholder="Search contract address..."
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
                            {this.renderEventsTable()}
                        </section>
                    </Grid.Column>
                    <Grid.Column width={5}>
                        <section className="panel">
                            <h3>Quick Actions</h3>
                            <Link route="/events/new" legacyBehavior>
                                <a><Button primary fluid style={{ marginBottom: '10px' }}>Create New Event</Button></a>
                            </Link>
                            <Link route="/admin/ticket-validation" legacyBehavior>
                                <a><Button fluid style={{ marginBottom: '10px' }}>Open Validation Center</Button></a>
                            </Link>
                            <Link route="/admin/revenue" legacyBehavior>
                                <a><Button fluid>Open Finance Overview</Button></a>
                            </Link>
                        </section>
                        <section className="panel" style={{ marginTop: '16px' }}>
                            <h3>On-Chain Snapshot</h3>
                            <ul className="activity-list">
                                <li><span className="dot blue" /> Contracts loaded: {this.props.stats.totalEvents}</li>
                                <li><span className="dot green" /> Sold tickets: {this.props.stats.ticketsSold}</li>
                                <li><span className="dot orange" /> Used tickets: {this.props.stats.validations}</li>
                            </ul>
                        </section>
                    </Grid.Column>
                </Grid>

                {this.props.loadError ? (
                    <Message error content={this.props.loadError} style={{ marginTop: '14px' }} />
                ) : null}
                <style jsx>{`
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                        gap: 12px;
                        margin-bottom: 14px;
                    }
                    .stat-card {
                        background: white;
                        border-radius: 12px;
                        border-top: 4px solid #2563eb;
                        padding: 14px;
                        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
                    }
                    .stat-title {
                        color: #64748b;
                        margin: 0 0 6px;
                        font-size: 0.86rem;
                    }
                    .stat-card h3 {
                        margin: 0 0 8px;
                        color: #0f172a;
                    }
                    .content-grid {
                        margin-top: 0;
                    }
                    .panel {
                        background: white;
                        border-radius: 12px;
                        padding: 14px;
                        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
                    }
                    .panel h3 {
                        margin-top: 0;
                        color: #0f172a;
                    }
                    .panel-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 10px;
                    }
                    .table-controls {
                        display: flex;
                        gap: 8px;
                    }
                    .event-table-wrap {
                        overflow-x: auto;
                    }
                    .event-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .event-table th,
                    .event-table td {
                        padding: 10px 8px;
                        border-bottom: 1px solid #e2e8f0;
                        text-align: left;
                        font-size: 0.9rem;
                    }
                    .event-table th {
                        color: #475569;
                        font-weight: 700;
                    }
                    .mono {
                        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                        font-size: 0.8rem;
                    }
                    .status-pill {
                        padding: 4px 10px;
                        border-radius: 999px;
                        font-size: 0.75rem;
                        font-weight: 600;
                    }
                    .status-pill.live {
                        background: #dcfce7;
                        color: #166534;
                    }
                    .status-pill.draft {
                        background: #f1f5f9;
                        color: #334155;
                    }
                    .trend-badge {
                        padding: 4px 8px;
                        border-radius: 999px;
                        font-size: 0.74rem;
                        font-weight: 700;
                    }
                    .trend-badge.positive {
                        background: #dbeafe;
                        color: #1d4ed8;
                    }
                    .action-link {
                        color: #2563eb;
                        margin-right: 10px;
                        font-weight: 600;
                    }
                    .activity-list {
                        list-style: none;
                        padding-left: 0;
                        margin: 0;
                    }
                    .activity-list li {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        color: #334155;
                        font-size: 0.9rem;
                        margin-bottom: 10px;
                    }
                    .dot {
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        display: inline-block;
                    }
                    .dot.blue { background: #2563eb; }
                    .dot.green { background: #16a34a; }
                    .dot.orange { background: #f59e0b; }
                    .dot.purple { background: #a855f7; }

                    @media (max-width: 680px) {
                        .table-controls {
                            flex-direction: column;
                        }
                        .stats-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                `}</style>
            </AdminShell>
        );
    }
}

export default AdminDashboard;
