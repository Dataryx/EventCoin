import React, { Component } from 'react';
import { Button, Message, Input, Form } from 'semantic-ui-react';
import AdminShell from '../../components/adminShell';

class AdminClients extends Component {
    state = {
        adminAccount: '',
        clients: [],
        searchTerm: '',
        filterStatus: 'all',
        editingClientId: '',
        editName: '',
        editUsername: '',
        editEmail: '',
        errorMessage: '',
        successMessage: ''
    };

    componentDidMount() {
        const adminAccount = window.localStorage.getItem('adminAccount') || '';
        this.setState({ adminAccount }, this.loadClients);
    }

    getStoredClients = () => {
        try {
            const raw = window.localStorage.getItem('eventCoinClients');
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            return [];
        }
    };

    persistClients = (clients) => {
        window.localStorage.setItem('eventCoinClients', JSON.stringify(clients));
        this.setState({ clients });
    };

    loadClients = () => {
        const clients = this.getStoredClients();
        this.setState({ clients });
    };

    normalizeIdentity = (value) => (value || '').trim().toLowerCase();

    startEdit = (client) => {
        this.setState({
            editingClientId: client.id,
            editName: client.name || '',
            editUsername: client.username || '',
            editEmail: client.email || '',
            errorMessage: '',
            successMessage: ''
        });
    };

    cancelEdit = () => {
        this.setState({
            editingClientId: '',
            editName: '',
            editUsername: '',
            editEmail: ''
        });
    };

    saveClient = (event) => {
        if (event) {
            event.preventDefault();
        }
        const { editingClientId, editName, editUsername, editEmail } = this.state;

        const nextName = editName.trim();
        const nextUsername = editUsername.trim();
        const nextEmail = editEmail.trim();

        if (!nextName || !nextUsername || !nextEmail) {
            this.setState({ errorMessage: 'Name, username, and email are required.', successMessage: '' });
            return;
        }
        if (!nextEmail.includes('@')) {
            this.setState({ errorMessage: 'Enter a valid email address.', successMessage: '' });
            return;
        }

        const usernameExists = this.state.clients.some(
            (client) => client.id !== editingClientId && this.normalizeIdentity(client.username) === this.normalizeIdentity(nextUsername)
        );
        const emailExists = this.state.clients.some(
            (client) => client.id !== editingClientId && this.normalizeIdentity(client.email) === this.normalizeIdentity(nextEmail)
        );

        if (usernameExists) {
            this.setState({ errorMessage: 'Username already exists.', successMessage: '' });
            return;
        }
        if (emailExists) {
            this.setState({ errorMessage: 'Email already exists.', successMessage: '' });
            return;
        }

        const updatedClients = this.state.clients.map((client) => (
            client.id === editingClientId
                ? { ...client, name: nextName, username: nextUsername, email: nextEmail }
                : client
        ));

        this.persistClients(updatedClients);
        this.setState({
            editingClientId: '',
            editName: '',
            editUsername: '',
            editEmail: '',
            errorMessage: '',
            successMessage: 'Client updated successfully.'
        });
    };

    deleteClient = (clientId) => {
        const clientToDelete = this.state.clients.find((client) => client.id === clientId);
        const targetIdentity = clientToDelete?.username || clientToDelete?.email;
        if (!window.confirm('Delete this client account?')) {
            return;
        }

        const nextClients = this.state.clients.filter((client) => client.id !== clientId);
        this.persistClients(nextClients);

        const activeIdentity = window.localStorage.getItem('clientAccount');
        if (activeIdentity && targetIdentity && this.normalizeIdentity(activeIdentity) === this.normalizeIdentity(targetIdentity)) {
            window.localStorage.removeItem('clientAccount');
            window.localStorage.removeItem('clientProfile');
        }

        this.setState({
            errorMessage: '',
            successMessage: 'Client deleted successfully.'
        });
    };

    formatLastLogin(value) {
        if (!value) {
            return 'No login yet';
        }
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }
        return parsed.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    }

    getFilteredClients() {
        const { clients, searchTerm, filterStatus } = this.state;
        let filteredClients = [...clients];

        if (searchTerm.trim()) {
            const key = searchTerm.trim().toLowerCase();
            filteredClients = filteredClients.filter((client) =>
                (client.name || '').toLowerCase().includes(key) ||
                (client.username || '').toLowerCase().includes(key) ||
                (client.email || '').toLowerCase().includes(key)
            );
        }

        if (filterStatus === 'active') {
            filteredClients = filteredClients.filter((client) => Boolean(client.isActive));
        } else if (filterStatus === 'registered') {
            filteredClients = filteredClients.filter((client) => !client.isActive);
        }

        return filteredClients;
    }

    renderClientRow(client) {
        const isEditing = this.state.editingClientId === client.id;

        if (isEditing) {
            return (
                <tr key={client.id} className="editing-row">
                    <td>
                        <Input
                            fluid
                            value={this.state.editName}
                            onChange={(event) => this.setState({ editName: event.target.value })}
                        />
                    </td>
                    <td>
                        <Input
                            fluid
                            value={this.state.editEmail}
                            onChange={(event) => this.setState({ editEmail: event.target.value })}
                        />
                    </td>
                    <td>
                        <Input
                            fluid
                            value={this.state.editUsername}
                            onChange={(event) => this.setState({ editUsername: event.target.value })}
                        />
                    </td>
                    <td>
                        <span className="status-pill active">Editing</span>
                    </td>
                    <td>{this.formatLastLogin(client.lastLoginAt)}</td>
                    <td className="actions-cell">
                        <Button primary className="tm-btn" size="tiny" onClick={this.saveClient}>Save</Button>
                        <Button basic size="tiny" type="button" onClick={this.cancelEdit}>Cancel</Button>
                    </td>
                </tr>
            );
        }

        return (
            <tr key={client.id}>
                <td>{client.name || 'Unnamed Client'}</td>
                <td>{client.email || 'No email'}</td>
                <td>{client.username || 'No username'}</td>
                <td>
                    <span className={`status-pill ${client.isActive ? 'active' : 'registered'}`}>
                        {client.isActive ? 'Active' : 'Registered'}
                    </span>
                </td>
                <td>{this.formatLastLogin(client.lastLoginAt)}</td>
                <td className="actions-cell">
                    <Button primary className="tm-btn" size="tiny" onClick={() => this.startEdit(client)}>Update</Button>
                    <Button basic color="red" size="tiny" onClick={() => this.deleteClient(client.id)}>Delete</Button>
                </td>
            </tr>
        );
    }

    render() {
        const filteredClients = this.getFilteredClients();
        const activeCount = this.state.clients.filter((client) => Boolean(client.isActive)).length;
        const registeredCount = this.state.clients.length;

        return (
            <AdminShell
                activeRoute="/admin/clients"
                title="Clients Management"
                subtitle="Manage active and registered clients from one Ticketmaster-style board."
                walletAddress={this.state.adminAccount}
                heroTitle="Client Operations Board"
                heroDescription={`${activeCount} active / ${registeredCount} registered clients`}
                topActions={<Button className="tm-btn" onClick={this.loadClients}>Refresh</Button>}
            >
                <section className="panel clients-panel">
                    <div className="panel-header">
                        <div className="heading-copy">
                            <span className="section-kicker">Operations Board</span>
                            <h3>Clients</h3>
                        </div>
                        <div className="controls">
                            <Input
                                icon="search"
                                placeholder="Search name, username or email..."
                                value={this.state.searchTerm}
                                onChange={(event) => this.setState({ searchTerm: event.target.value })}
                            />
                            <div className="filter-group">
                                <button
                                    type="button"
                                    className={`filter-pill ${this.state.filterStatus === 'all' ? 'active' : ''}`}
                                    onClick={() => this.setState({ filterStatus: 'all' })}
                                >
                                    All
                                </button>
                                <button
                                    type="button"
                                    className={`filter-pill ${this.state.filterStatus === 'active' ? 'active' : ''}`}
                                    onClick={() => this.setState({ filterStatus: 'active' })}
                                >
                                    Active
                                </button>
                                <button
                                    type="button"
                                    className={`filter-pill ${this.state.filterStatus === 'registered' ? 'active' : ''}`}
                                    onClick={() => this.setState({ filterStatus: 'registered' })}
                                >
                                    Registered
                                </button>
                            </div>
                        </div>
                    </div>

                    {this.state.errorMessage ? <Message error content={this.state.errorMessage} /> : null}
                    {this.state.successMessage ? <Message success content={this.state.successMessage} /> : null}

                    {filteredClients.length ? (
                        <div className="table-wrap">
                            <table className="clients-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Username</th>
                                        <th>Status</th>
                                        <th>Last Login</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClients.map((client) => this.renderClientRow(client))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No clients found for this filter.</p>
                        </div>
                    )}
                </section>

                <style jsx>{`
                    .panel {
                        background: white;
                        border-radius: 18px;
                        padding: 18px;
                        box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
                        border: 1px solid #e2e8f0;
                    }
                    .clients-panel {
                        background:
                            radial-gradient(circle at top right, rgba(0, 185, 242, 0.12), transparent 30%),
                            linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
                        border-radius: 24px;
                        position: relative;
                        overflow: hidden;
                    }
                    .clients-panel::before {
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
                        z-index: 1;
                    }
                    .clients-table {
                        width: 100%;
                        border-collapse: separate;
                        border-spacing: 0;
                        border: 1px solid #dbeafe;
                        border-radius: 16px;
                        overflow: hidden;
                        background: white;
                    }
                    .clients-table th,
                    .clients-table td {
                        padding: 12px 10px;
                        text-align: left;
                        border-bottom: 1px solid #e2e8f0;
                        vertical-align: middle;
                        color: #0f172a;
                        font-size: 0.88rem;
                    }
                    .clients-table th {
                        background: #eff6ff;
                        color: #1e3a8a;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                        font-size: 0.76rem;
                    }
                    .clients-table tbody tr:hover {
                        background: #f8fbff;
                    }
                    .clients-table tbody tr:last-child td {
                        border-bottom: 0;
                    }
                    .editing-row {
                        background: #eff6ff;
                    }
                    .actions-cell {
                        white-space: nowrap;
                    }
                    .status-pill {
                        border-radius: 999px;
                        padding: 5px 10px;
                        font-size: 0.72rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.06em;
                    }
                    .status-pill.active {
                        background: #dcfce7;
                        color: #166534;
                    }
                    .status-pill.registered {
                        background: #dbeafe;
                        color: #1d4ed8;
                    }
                    :global(.tm-btn.ui.button) {
                        border-radius: 999px !important;
                        font-weight: 800 !important;
                        letter-spacing: 0.04em;
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
                        .clients-table {
                            min-width: 760px;
                        }
                    }
                `}</style>
            </AdminShell>
        );
    }
}

export default AdminClients;
