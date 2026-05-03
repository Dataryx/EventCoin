import React, { Component } from 'react';
import { Input, Message } from 'semantic-ui-react';
import { contractAddress, getDeployedEventsInstance } from '../../ethereum/factory';
import Event from '../../ethereum/event';
import AdminShell from '../../components/adminShell';
import { ensureClientTicketStorageVersion } from '../../ethereum/clientTickets';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

class AdminPurchasedTicketsPage extends Component {
    static async getInitialProps() {
        if (!contractAddress || !getDeployedEventsInstance) {
            return {
                ticketRows: [],
                loadError: 'Set NEXT_PUBLIC_DIAMOND_ADDRESS in .env to load purchased tickets.'
            };
        }

        try {
            const addresses = await getDeployedEventsInstance.methods.getDeployedEvents().call();
            const groupedRows = await Promise.all(addresses.map(async (address) => {
                const event = Event(address);
                const summary = await event.methods.getEventDetails().call();
                const eventName = summary[0] || 'Unnamed Event';
                const ticketSupply = parseInt(summary[2], 10) || 0;

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
                                    key: `${address}-${ticketId}`,
                                    eventAddress: address,
                                    eventName,
                                    ticketId,
                                    ownerAddress,
                                    ownerName: '',
                                    status: isUsed ? 'Used' : 'Unused'
                                };
                            })
                            .catch(() => null)
                    ))
                );

                return tickets.filter(Boolean);
            }));

            const ticketRows = groupedRows
                .flat()
                .sort((left, right) => {
                    if (left.eventName !== right.eventName) {
                        return left.eventName.localeCompare(right.eventName);
                    }

                    return left.ticketId - right.ticketId;
                });

            return { ticketRows, loadError: '' };
        } catch (error) {
            return {
                ticketRows: [],
                loadError: 'Unable to load purchased ticket records from the blockchain right now.'
            };
        }
    }

    state = {
        adminAccount: '',
        searchTerm: '',
        statusFilter: 'all',
        ticketRows: this.props.ticketRows
    };

    componentDidMount() {
        const adminAccount = window.localStorage.getItem('adminAccount') || '';
        const ownerNames = {};

        ensureClientTicketStorageVersion();
        Object.keys(window.localStorage).forEach((key) => {
            if (!key.startsWith('clientTickets:')) {
                return;
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
        });

        const ticketRows = this.props.ticketRows.map((row) => ({
            ...row,
            ownerName: ownerNames[row.key] || row.ownerName || ''
        }));

        this.setState({ adminAccount, ticketRows });
    }

    getFilteredRows() {
        const { searchTerm, statusFilter, ticketRows } = this.state;
        let filteredRows = [...ticketRows];

        if (statusFilter === 'used') {
            filteredRows = filteredRows.filter((row) => row.status === 'Used');
        } else if (statusFilter === 'unused') {
            filteredRows = filteredRows.filter((row) => row.status === 'Unused');
        }

        if (searchTerm.trim()) {
            const keyword = searchTerm.trim().toLowerCase();
            filteredRows = filteredRows.filter((row) =>
                row.eventName.toLowerCase().includes(keyword) ||
                row.ownerAddress.toLowerCase().includes(keyword) ||
                (row.ownerName || '').toLowerCase().includes(keyword) ||
                row.ticketId.toString().includes(keyword)
            );
        }

        return filteredRows;
    }

    renderRows() {
        const rows = this.getFilteredRows();

        if (!rows.length) {
            return (
                <div className="empty-state">
                    <p>No purchased tickets found for this filter.</p>
                </div>
            );
        }

        return (
            <div className="table-wrap">
                <table className="tickets-table">
                    <thead>
                        <tr>
                            <th>Event Name</th>
                            <th>Ticket ID</th>
                            <th>Owner Name</th>
                            <th>Owner Wallet</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.key}>
                                <td>
                                    <div className="event-cell">
                                        <strong>{row.eventName}</strong>
                                    </div>
                                </td>
                                <td>#{row.ticketId}</td>
                                <td>{row.ownerName || 'Unknown client'}</td>
                                <td className="mono">{row.ownerAddress}</td>
                                <td>
                                    <span className={`status-pill ${row.status === 'Used' ? 'used' : 'unused'}`}>
                                        {row.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    render() {
        const usedCount = this.state.ticketRows.filter((row) => row.status === 'Used').length;
        const unusedCount = this.state.ticketRows.filter((row) => row.status === 'Unused').length;

        return (
            <AdminShell
                activeRoute="/admin/purchased-tickets"
                title="Purchased Tickets"
                subtitle="Review all sold tickets across every event contract in one table."
                walletAddress={this.state.adminAccount}
                heroTitle="Ticket Purchase Ledger"
                heroDescription={`${this.state.ticketRows.length} sold tickets tracked • ${unusedCount} unused • ${usedCount} used`}
            >
                <section className="panel purchased-panel">
                    <div className="panel-header">
                        <div className="heading-copy">
                            <span className="section-kicker">Ticket Ledger</span>
                            <h3>Purchased Tickets</h3>
                        </div>
                        <div className="controls">
                            <Input
                                icon="search"
                                placeholder="Search event, owner, wallet or ticket id..."
                                value={this.state.searchTerm}
                                onChange={(event) => this.setState({ searchTerm: event.target.value })}
                            />
                            <div className="filter-group">
                                <button
                                    type="button"
                                    className={`filter-pill ${this.state.statusFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => this.setState({ statusFilter: 'all' })}
                                >
                                    All
                                </button>
                                <button
                                    type="button"
                                    className={`filter-pill ${this.state.statusFilter === 'unused' ? 'active' : ''}`}
                                    onClick={() => this.setState({ statusFilter: 'unused' })}
                                >
                                    Unused
                                </button>
                                <button
                                    type="button"
                                    className={`filter-pill ${this.state.statusFilter === 'used' ? 'active' : ''}`}
                                    onClick={() => this.setState({ statusFilter: 'used' })}
                                >
                                    Used
                                </button>
                            </div>
                        </div>
                    </div>

                    {this.props.loadError ? <Message error content={this.props.loadError} /> : null}
                    {this.renderRows()}
                </section>

                <style jsx>{`
                    .panel {
                        background: white;
                        border-radius: 18px;
                        padding: 18px;
                        box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
                        border: 1px solid #e2e8f0;
                    }
                    .purchased-panel {
                        background:
                            radial-gradient(circle at top right, rgba(0, 185, 242, 0.12), transparent 30%),
                            linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
                        border-radius: 24px;
                        position: relative;
                        overflow: hidden;
                    }
                    .purchased-panel::before {
                        content: '';
                        position: absolute;
                        inset: 0 0 auto 0;
                        height: 4px;
                        background: linear-gradient(90deg, #002060 0%, #00b9f2 100%);
                    }
                    .panel-header {
                        display: flex;
                        justify-content: space-between;
                        gap: 16px;
                        align-items: center;
                        padding-bottom: 14px;
                        margin-bottom: 14px;
                        border-bottom: 1px solid #dbeafe;
                        position: relative;
                        z-index: 1;
                    }
                    .section-kicker {
                        display: inline-block;
                        margin-bottom: 7px;
                        color: #2563eb;
                        font-size: 0.72rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.11em;
                    }
                    .heading-copy h3 {
                        margin: 0;
                        color: #0f172a;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2rem;
                        letter-spacing: 0.04em;
                        text-transform: uppercase;
                    }
                    .controls {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        flex-wrap: wrap;
                    }
                    .filter-group {
                        display: flex;
                        gap: 6px;
                    }
                    .filter-pill {
                        border: 1px solid #cbd5e1;
                        background: white;
                        border-radius: 999px;
                        padding: 6px 12px;
                        font-weight: 700;
                        cursor: pointer;
                    }
                    .filter-pill.active {
                        background: #026cdf;
                        color: white;
                        border-color: #026cdf;
                    }
                    .table-wrap {
                        overflow-x: auto;
                        position: relative;
                        zIndex: 1;
                    }
                    .tickets-table {
                        width: 100%;
                        border-collapse: separate;
                        border-spacing: 0;
                        border: 1px solid #dbeafe;
                        border-radius: 16px;
                        overflow: hidden;
                        background: white;
                    }
                    .tickets-table th,
                    .tickets-table td {
                        padding: 12px 10px;
                        text-align: left;
                        border-bottom: 1px solid #e2e8f0;
                        vertical-align: middle;
                        color: #0f172a;
                        font-size: 0.88rem;
                    }
                    .tickets-table th {
                        background: #eff6ff;
                        color: #1e3a8a;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                        font-size: 0.76rem;
                    }
                    .tickets-table tbody tr:hover {
                        background: #f8fbff;
                    }
                    .tickets-table tbody tr:last-child td {
                        border-bottom: 0;
                    }
                    .event-cell {
                        display: flex;
                        flex-direction: column;
                        min-width: 0;
                    }
                    .event-cell strong {
                        color: #0f172a;
                    }
                    .mono {
                        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                        word-break: break-all;
                        color: #64748b;
                        font-size: 0.78rem;
                    }
                    .status-pill {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 999px;
                        padding: 5px 10px;
                        font-size: 0.72rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    .status-pill.unused {
                        background: #dcfce7;
                        color: #166534;
                    }
                    .status-pill.used {
                        background: #fee2e2;
                        color: #b91c1c;
                    }
                    .empty-state {
                        border: 1px dashed #cbd5e1;
                        border-radius: 16px;
                        padding: 20px;
                        text-align: center;
                        background: #f8fafc;
                    }
                    .empty-state p {
                        margin: 0;
                        color: #64748b;
                    }
                    @media (max-width: 680px) {
                        .panel-header {
                            flex-direction: column;
                            align-items: stretch;
                        }
                        .controls {
                            flex-direction: column;
                            align-items: stretch;
                        }
                        .tickets-table {
                            min-width: 920px;
                        }
                    }
                `}</style>
            </AdminShell>
        );
    }
}

export default AdminPurchasedTicketsPage;
