import React, { Component } from 'react';
import { Message, Button, Input, Dropdown } from 'semantic-ui-react';
import { contractAddress, getDeployedEventsInstance } from '../../ethereum/factory';
import AdminShell from '../../components/adminShell';
import { Link } from '../../routes';

class AdminEvents extends Component {
    static async getInitialProps() {
        if (!contractAddress || !getDeployedEventsInstance) {
            return { events: [], loadError: 'Set NEXT_PUBLIC_DIAMOND_ADDRESS in .env to load deployed events.' };
        }

        try {
            const events = await getDeployedEventsInstance.methods.getDeployedEvents().call();
            return { events, loadError: '' };
        } catch (error) {
            return { events: [], loadError: 'Unable to load events from blockchain right now.' };
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
            events = events.filter((address) => address.toLowerCase().includes(key));
        }

        events.sort((a, b) => (sortOrder === 'latest' ? b.localeCompare(a) : a.localeCompare(b)));
        return events;
    }

    render() {
        const sortOptions = [
            { key: 'latest', text: 'Latest First', value: 'latest' },
            { key: 'oldest', text: 'Oldest First', value: 'oldest' }
        ];
        const events = this.getFilteredEvents();

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
                heroDescription={`Total contracts discovered: ${this.props.events.length}`}
            >
                <div className="panel">
                    <div className="controls">
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
                    <table className="event-table">
                        <thead>
                            <tr>
                                <th>Contract Address</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((address, index) => (
                                <tr key={address}>
                                    <td className="mono">{address}</td>
                                    <td>
                                        <span className={`status-pill ${index % 2 ? 'live' : 'draft'}`}>
                                            {index % 2 ? 'Live' : 'Draft'}
                                        </span>
                                    </td>
                                    <td>
                                        <Link route={`/events/${address}`} legacyBehavior>
                                            <a className="action-link">Open</a>
                                        </Link>
                                        <Link route={`/events/${address}/validate`} legacyBehavior>
                                            <a className="action-link">Validate</a>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {this.props.loadError ? <Message error content={this.props.loadError} style={{ marginTop: '14px' }} /> : null}
                <style jsx>{`
                    .panel {
                        background: white;
                        border-radius: 12px;
                        padding: 14px;
                        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
                    }
                    .controls {
                        display: flex;
                        gap: 8px;
                        margin-bottom: 12px;
                    }
                    .event-table { width: 100%; border-collapse: collapse; }
                    .event-table th, .event-table td {
                        padding: 10px 8px;
                        border-bottom: 1px solid #e2e8f0;
                        text-align: left;
                    }
                    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.8rem; }
                    .status-pill { padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
                    .status-pill.live { background: #dcfce7; color: #166534; }
                    .status-pill.draft { background: #f1f5f9; color: #334155; }
                    .action-link { margin-right: 10px; color: #2563eb; font-weight: 700; }
                    @media (max-width: 680px) {
                        .controls { flex-direction: column; }
                    }
                `}</style>
            </AdminShell>
        );
    }
}

export default AdminEvents;
