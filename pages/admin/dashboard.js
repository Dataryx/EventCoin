import React, { Component } from 'react';
import { Button, Message, Grid, Input, Dropdown, Icon } from 'semantic-ui-react';
import { contractAddress, getDeployedEventsInstance } from '../../ethereum/factory';
import AdminShell from '../../components/adminShell';
import { Link } from '../../routes';
import Event from '../../ethereum/event';
import { getStoredAuditLogs, persistAuditLog } from '../../ethereum/auditLog';
import { getStoredClientTransactions } from '../../ethereum/clientTransactions';
import { ensureClientTicketStorageVersion } from '../../ethereum/clientTickets';
import { createAdminExportPdfBlob } from '../../utils/adminExportPdf';
import { fetchEthUsdRate, formatEthFromWei, formatUsdFromWei, multiplyWeiAmount } from '../../utils/ethPricing';
import TopAlertStack from '../../components/topAlertStack';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const EMPTY_STATS = {
    totalEvents: 0,
    ticketsSold: 0,
    revenueWei: '0',
    ticketsUsed: 0
};

class AdminDashboard extends Component {
    static async getInitialProps() {
        if (!contractAddress || !getDeployedEventsInstance) {
            return { events: [], stats: EMPTY_STATS, loadError: 'Set NEXT_PUBLIC_DIAMOND_ADDRESS in .env to load deployed events.' };
        }

        try {
            const addresses = await getDeployedEventsInstance.methods.getDeployedEvents().call();
            const events = await Promise.all(addresses.map(async (address, deploymentIndex) => {
                const event = Event(address);
                const summary = await event.methods.getEventDetails().call();
                const ticketPriceWei = summary[1] ? summary[1].toString() : '0';
                const ticketSupply = parseInt(summary[2], 10) || 0;
                const ticketsSold = parseInt(summary[3], 10) || 0;

                let ticketsUsed = 0;
                for (let ticketId = 1; ticketId <= ticketsSold; ticketId += 1) {
                    try {
                        const ticket = await event.methods.tickets(ticketId).call();
                        const isUsed = ticket.isUsed || ticket[1];
                        if (isUsed) ticketsUsed += 1;
                    } catch (e) {
                        // If ticket lookup fails for this id, skip.
                    }
                }

                return {
                    address,
                    deploymentIndex,
                    name: summary[0],
                    ticketPriceWei,
                    ticketSupply,
                    ticketsSold,
                    description: summary[4] || '',
                    eventDate: summary[5] || '',
                    ticketsUsed
                };
            }));

            const stats = events.reduce((acc, item) => {
                acc.totalEvents += 1;
                acc.ticketsSold += item.ticketsSold;
                acc.revenueWei = (BigInt(acc.revenueWei) + (BigInt(item.ticketPriceWei || '0') * BigInt(item.ticketsSold || 0))).toString();
                acc.ticketsUsed += item.ticketsUsed;
                return acc;
            }, { ...EMPTY_STATS });

            return { events, stats, loadError: '' };
        } catch (error) {
            return { events: [], stats: EMPTY_STATS, loadError: 'Unable to load events from the blockchain right now.' };
        }
    }

    state = {
        adminAccount: '',
        searchTerm: '',
        sortOrder: 'latest',
        ethUsdRate: null,
        exportLoading: false,
        exportErrorMessage: '',
        exportSuccessMessage: ''
    };

    async componentDidMount() {
        const adminAccount = window.localStorage.getItem('adminAccount') || '';
        const ethUsdRate = await fetchEthUsdRate();
        this.setState({ adminAccount, ethUsdRate });
    }

    getStoredClients() {
        if (typeof window === 'undefined') {
            return [];
        }

        try {
            const rawValue = window.localStorage.getItem('eventCoinClients');
            const parsedClients = rawValue ? JSON.parse(rawValue) : [];
            return Array.isArray(parsedClients) ? parsedClients : [];
        } catch (error) {
            return [];
        }
    }

    getStoredOwnerNames() {
        if (typeof window === 'undefined') {
            return {};
        }

        ensureClientTicketStorageVersion();
        return Object.keys(window.localStorage).reduce((ownerNames, key) => {
            if (!key.startsWith('clientTickets:')) {
                return ownerNames;
            }

            const eventAddress = key.split(':')[1];

            try {
                const tickets = JSON.parse(window.localStorage.getItem(key) || '[]');
                tickets.forEach((ticket) => {
                    if (ticket.ticketId === undefined || ticket.ticketId === null) {
                        return;
                    }

                    ownerNames[`${eventAddress}-${ticket.ticketId}`] = ticket.purchaserName || ticket.purchaserId || '';
                });
            } catch (error) {
                // Ignore malformed browser ticket records.
            }

            return ownerNames;
        }, {});
    }

    async buildPurchasedTicketSnapshot() {
        const ownerNames = this.getStoredOwnerNames();
        const groupedRows = await Promise.all(this.props.events.map(async (eventSummary) => {
            const event = Event(eventSummary.address);
            const ticketSupply = parseInt(eventSummary.ticketSupply, 10) || 0;

            const tickets = await Promise.all(
                Array.from({ length: ticketSupply }, (_, ticketId) => (
                    event.methods.tickets(ticketId).call()
                        .then((ticket) => {
                            const ownerAddress = ticket.owner || ticket[0] || '';
                            const isUsed = Boolean(ticket.isUsed || ticket[1]);

                            if (!ownerAddress || ownerAddress.toLowerCase() === ZERO_ADDRESS) {
                                return null;
                            }

                            return {
                                eventAddress: eventSummary.address,
                                eventName: eventSummary.name || 'Unnamed Event',
                                ticketId,
                                ownerAddress,
                                ownerName: ownerNames[`${eventSummary.address}-${ticketId}`] || '',
                                status: isUsed ? 'Used' : 'Unused'
                            };
                        })
                        .catch(() => null)
                ))
            );

            return tickets.filter(Boolean);
        }));

        return groupedRows
            .flat()
            .sort((left, right) => {
                if (left.eventName !== right.eventName) {
                    return left.eventName.localeCompare(right.eventName);
                }

                return left.ticketId - right.ticketId;
            });
    }

    downloadExportFile(filename, blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    logAdminAudit = ({ action, status, details = {} }) => {
        const adminAccount = this.state.adminAccount || (typeof window !== 'undefined' ? window.localStorage.getItem('adminAccount') : '') || 'Admin';

        persistAuditLog({
            actorName: adminAccount,
            actorRole: 'admin',
            actorId: adminAccount,
            action,
            status,
            entityType: 'export',
            entityId: 'admin-dashboard',
            route: '/admin/dashboard',
            details
        });
    };

    handleExportData = async () => {
        this.setState({
            exportLoading: true,
            exportErrorMessage: '',
            exportSuccessMessage: ''
        });

        try {
            if (typeof window === 'undefined') {
                throw new Error('Export is only available in the browser.');
            }

            const purchasedTickets = await this.buildPurchasedTicketSnapshot();
            const clients = this.getStoredClients();
            const clientTransactions = getStoredClientTransactions();
            const auditLogs = getStoredAuditLogs();
            const exportedAt = new Date().toISOString();
            const fileTimestamp = exportedAt.replace(/[:.]/g, '-');

            const payload = {
                exportedAt,
                adminAccount: this.state.adminAccount || window.localStorage.getItem('adminAccount') || '',
                summary: {
                    ...this.props.stats,
                    ethUsdRate: this.state.ethUsdRate
                },
                events: this.props.events,
                purchasedTickets,
                clients,
                clientTransactions,
                auditLogs
            };

            const pdfBlob = createAdminExportPdfBlob(payload);
            this.downloadExportFile(`eventcoin-admin-export-${fileTimestamp}.pdf`, pdfBlob);
            this.logAdminAudit({
                action: 'Admin data export',
                status: 'success',
                details: {
                    events: this.props.events.length,
                    purchasedTickets: purchasedTickets.length,
                    clients: clients.length,
                    transactions: clientTransactions.length,
                    auditLogs: auditLogs.length
                }
            });
            this.setState({
                exportLoading: false,
                exportSuccessMessage: 'Admin data export downloaded successfully.'
            });
        } catch (error) {
            const message = error?.message || 'Unable to export admin data right now.';
            this.logAdminAudit({
                action: 'Admin data export',
                status: 'failed',
                details: { reason: message }
            });
            this.setState({
                exportLoading: false,
                exportErrorMessage: message
            });
        }
    };

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

        filtered.sort((a, b) => {
            const leftIndex = Number.isFinite(a.deploymentIndex) ? a.deploymentIndex : 0;
            const rightIndex = Number.isFinite(b.deploymentIndex) ? b.deploymentIndex : 0;

            return sortOrder === 'latest'
                ? rightIndex - leftIndex
                : leftIndex - rightIndex;
        });
        return filtered;
    }

    getSellThroughPercent(event) {
        if (!event.ticketSupply) {
            return 0;
        }

        return Math.min(Math.round((event.ticketsSold / event.ticketSupply) * 100), 100);
    }

    getEventRevenueWei(event) {
        return multiplyWeiAmount(event.ticketPriceWei, event.ticketsSold);
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

        return `${weekday} • ${month} ${day} • ${time}`;
    }

    getEventLocation(event) {
        if (event.description && event.description.trim()) {
            return event.description.trim();
        }

        return 'EventCoin Live • On-chain ticket release';
    }

    renderEventsTable() {
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
                                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                gap: '14px',
                                alignItems: 'stretch'
                            }}
                        >
                            {activeEvents.map((event, index) => {
                                const sellThrough = this.getSellThroughPercent(event);
                                const revenueWei = this.getEventRevenueWei(event);
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
                                                    {event.ticketsSold}/{event.ticketSupply} sold • {formatUsdFromWei(revenueWei, this.state.ethUsdRate)} • {formatEthFromWei(revenueWei)} • {event.ticketsUsed} used
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
                                const revenueWei = this.getEventRevenueWei(event);
                                const schedule = this.formatEventSchedule(event);

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
                                                className="poster-badge sold-out-badge"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                                                    color: '#fff',
                                                    minWidth: '88px',
                                                    borderRadius: '12px',
                                                    padding: '8px 12px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 800,
                                                    letterSpacing: '0.04em'
                                                }}
                                            >
                                                SOLD OUT
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
                                                <span>{event.ticketsSold}/{event.ticketSupply} sold • {formatUsdFromWei(revenueWei, this.state.ethUsdRate)} • {formatEthFromWei(revenueWei)} • {event.ticketsUsed} used</span>
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
            </div>
        );
    }

    render() {
        const sortOptions = [
            { key: 'latest', text: 'Latest First', value: 'latest' },
            { key: 'oldest', text: 'Oldest First', value: 'oldest' }
        ];

        const statCards = [
            { title: 'Total Events', value: this.props.stats.totalEvents, accent: '#00B9F2', note: 'Contracts in circulation', icon: 'ticket' },
            { title: 'Tickets Sold', value: this.props.stats.ticketsSold, accent: '#00A651', note: 'Completed fan checkouts', icon: 'shopping cart' },
            { title: 'Revenue', value: formatUsdFromWei(this.props.stats.revenueWei, this.state.ethUsdRate), accent: '#026CDF', note: `${formatEthFromWei(this.props.stats.revenueWei)} gross on-chain sales`, icon: 'line graph' },
            { title: 'Tickets Used', value: this.props.stats.ticketsUsed, accent: '#7C3AED', note: 'Tickets scanned at gate', icon: 'check circle' }
        ];

        return (
            <AdminShell
                activeRoute="/admin/dashboard"
                title="Event Admin Dashboard"
                subtitle=""
                walletAddress={this.state.adminAccount}
                topActions={(
                    <>
                        <Link route="/events/new" legacyBehavior>
                            <a><Button primary className="tm-top-action">Create Event</Button></a>
                        </Link>
                        <Button
                            basic
                            color="blue"
                            className="tm-top-action secondary"
                            loading={this.state.exportLoading}
                            onClick={this.handleExportData}
                        >
                            Export Data
                        </Button>
                    </>
                )}
                heroTitle="Admin Ops Desk"
                heroDescription={this.state.adminAccount || 'Sign in to unlock event operations.'}
                heroActions={(
                    <>
                        <Link route="/admin/ticket-validation" legacyBehavior>
                            <a><Button color="blue" className="tm-hero-btn">Open Validation Queue</Button></a>
                        </Link>
                        <Button basic inverted className="tm-hero-btn ghost">View Smart Contract</Button>
                    </>
                )}
            >
                <TopAlertStack
                    alerts={[
                        this.state.exportErrorMessage ? {
                            id: 'admin-export-error',
                            type: 'error',
                            content: this.state.exportErrorMessage,
                            onDismiss: () => this.setState({ exportErrorMessage: '' })
                        } : null,
                        this.state.exportSuccessMessage ? {
                            id: 'admin-export-success',
                            type: 'success',
                            content: this.state.exportSuccessMessage,
                            onDismiss: () => this.setState({ exportSuccessMessage: '' })
                        } : null
                    ]}
                />
                <section className="stats-grid">
                    {statCards.map((card) => (
                        <article key={card.title} className="stat-card" style={{ '--card-accent': card.accent }}>
                            <div className="stat-card-top">
                                <p className="stat-title">{card.title}</p>
                                <span className="stat-icon">
                                    <Icon name={card.icon} />
                                </span>
                            </div>
                            <h3>{card.value}</h3>
                            <p className="stat-note">{card.note}</p>
                        </article>
                    ))}
                </section>

                <Grid stackable columns={1} className="content-grid">
                    <Grid.Column width={16}>
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
                            {this.renderEventsTable()}
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
                        gap: 14px;
                        margin-bottom: 16px;
                    }
                    .stat-card {
                        background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
                        border-radius: 18px;
                        border: 1px solid #dbeafe;
                        padding: 16px;
                        box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
                        position: relative;
                        overflow: hidden;
                    }
                    .stat-card::before {
                        content: '';
                        position: absolute;
                        inset: 0 auto 0 0;
                        width: 5px;
                        background: var(--card-accent);
                    }
                    .stat-card-top {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 8px;
                    }
                    .stat-title {
                        color: #64748b;
                        margin: 0 0 6px;
                        font-size: 0.78rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                    }
                    .stat-icon {
                        width: 36px;
                        height: 36px;
                        border-radius: 12px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        background: rgba(2, 108, 223, 0.08);
                        color: var(--card-accent);
                    }
                    .stat-card h3 {
                        margin: 0 0 6px;
                        color: #0f172a;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2rem;
                        letter-spacing: 0.03em;
                        line-height: 1.1;
                        word-break: break-word;
                    }
                    .stat-note {
                        margin: 0;
                        color: #64748b;
                        font-size: 0.82rem;
                    }
                    .content-grid {
                        margin-top: 0;
                    }
                    .panel {
                        background: white;
                        border-radius: 18px;
                        padding: 18px;
                        box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
                        border: 1px solid #e2e8f0;
                    }
                    .panel h3 {
                        margin-top: 0;
                        color: #0f172a;
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
                        margin: 0 0 6px;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2.15rem;
                        letter-spacing: 0.04em;
                        text-transform: uppercase;
                    }
                    .panel-heading-copy p {
                        margin: 0;
                        color: #64748b;
                        font-size: 0.92rem;
                        line-height: 1.6;
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
                    .event-card-grid {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 14px;
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
                    .active-event-grid {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(240px, 1fr));
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
                    .event-ops-card.live {
                        border-color: #bfdbfe;
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
                    .progress-panel {
                        background: #0f172a;
                        color: white;
                        border-radius: 16px;
                        padding: 12px;
                        margin-bottom: 12px;
                    }
                    .progress-copy,
                    .progress-foot {
                        display: flex;
                        justify-content: space-between;
                        gap: 10px;
                        font-size: 0.82rem;
                    }
                    .progress-copy strong {
                        font-size: 0.9rem;
                    }
                    .progress-track {
                        height: 10px;
                        background: rgba(255, 255, 255, 0.12);
                        border-radius: 999px;
                        overflow: hidden;
                        margin: 10px 0 8px;
                    }
                    .progress-fill {
                        height: 100%;
                        border-radius: 999px;
                        background: linear-gradient(90deg, #00b9f2 0%, #00d084 100%);
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
                    .status-pill.live {
                        background: #dcfce7;
                        color: #166534;
                    }
                    .status-pill.draft {
                        background: #f1f5f9;
                        color: #334155;
                    }
                    :global(.tm-top-action.ui.button) {
                        border-radius: 999px !important;
                        font-weight: 800 !important;
                        letter-spacing: 0.04em;
                    }
                    :global(.tm-top-action.secondary.ui.button) {
                        border-color: #93c5fd !important;
                    }
                    :global(.tm-hero-btn.ui.button) {
                        border-radius: 999px !important;
                        font-weight: 800 !important;
                    }

                    @media (max-width: 720px) {
                        .active-event-grid {
                            grid-template-columns: repeat(2, minmax(0, 1fr));
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
                        .stats-grid {
                            grid-template-columns: 1fr;
                        }
                        .event-card-grid,
                        .event-insights {
                            grid-template-columns: 1fr;
                        }
                        .poster-body {
                            min-height: auto;
                        }
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

export default AdminDashboard;
