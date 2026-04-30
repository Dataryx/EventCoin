import React, { Component } from 'react';
import { Button, Icon, Message } from 'semantic-ui-react';
import AdminShell from '../../components/adminShell';
import { formatAuditTimestamp, getStoredAuditLogs } from '../../ethereum/auditLog';

class AuditLogsPage extends Component {
    state = {
        adminAccount: '',
        logs: []
    };

    componentDidMount() {
        this.loadLogs();
        window.addEventListener('storage', this.loadLogs);
    }

    componentWillUnmount() {
        window.removeEventListener('storage', this.loadLogs);
    }

    loadLogs = () => {
        this.setState({
            adminAccount: window.localStorage.getItem('adminAccount') || '',
            logs: getStoredAuditLogs()
        });
    };

    formatLabel(value) {
        return value
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^./, (character) => character.toUpperCase());
    }

    renderLogDetails(log) {
        const detailEntries = Object.entries(log.details || {});

        return detailEntries.length ? (
            <div className="detail-grid">
                {detailEntries.map(([key, value]) => (
                    <div className="detail-pill" key={`${log.id}-${key}`}>
                        <span>{this.formatLabel(key)}</span>
                        <strong>{String(value)}</strong>
                    </div>
                ))}
            </div>
        ) : null;
    }

    render() {
        const totalLogs = this.state.logs.length;
        return (
            <AdminShell
                activeRoute="/admin/audit-logs"
                title="Audit Logs"
                subtitle="Trace client and admin activity with the acting user name."
                walletAddress={this.state.adminAccount}
                heroTitle="Activity Timeline"
                heroDescription={totalLogs ? `${totalLogs} activity records captured in this browser.` : 'No audit activity has been recorded in this browser yet.'}
                topActions={<Button className="tm-btn" onClick={this.loadLogs}>Refresh Logs</Button>}
            >
                {this.state.logs.length ? (
                    <div className="panel">
                        {this.state.logs.map((log) => (
                            <article className="item" key={log.id}>
                                <div className="item-head">
                                    <div>
                                        <p className="ts">{formatAuditTimestamp(log.at)}</p>
                                        <h3>{log.action}</h3>
                                    </div>
                                    <span className={`status-pill ${log.status === 'success' ? 'success' : 'failed'}`}>
                                        {log.status || 'unknown'}
                                    </span>
                                </div>
                                <p className="actor-row">
                                    <Icon name="user circle outline" />
                                    <strong>{log.actorName}</strong>
                                    <span>{log.actorRole}</span>
                                    {log.actorId && log.actorId !== log.actorName ? <em>{log.actorId}</em> : null}
                                </p>
                                {log.walletAddress ? <p className="meta-row">Wallet: {log.walletAddress}</p> : null}
                                {log.entityType || log.entityId ? (
                                    <p className="meta-row">
                                        Target: {[log.entityType, log.entityId].filter(Boolean).join(' / ')}
                                    </p>
                                ) : null}
                                {log.route ? <p className="meta-row">Route: {log.route}</p> : null}
                                {this.renderLogDetails(log)}
                            </article>
                        ))}
                    </div>
                ) : (
                    <Message info>
                        <Message.Header>No audit logs yet</Message.Header>
                        <p>Once users log in, create events, buy tickets, validate entries, or manage clients, those actions will appear here.</p>
                    </Message>
                )}
                <style jsx>{`
                    .panel {
                        display: grid;
                        gap: 12px;
                    }
                    .item {
                        background: white;
                        border-radius: 18px;
                        padding: 16px;
                        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
                        border: 1px solid #dbeafe;
                    }
                    .item-head {
                        display: flex;
                        justify-content: space-between;
                        gap: 10px;
                        align-items: flex-start;
                        margin-bottom: 10px;
                    }
                    .item-head h3 {
                        margin: 4px 0 0;
                        color: #0f172a;
                        font-size: 1.15rem;
                    }
                    .ts {
                        margin: 0;
                        color: #64748b;
                        font-size: 0.8rem;
                    }
                    .actor-row {
                        margin: 0 0 8px;
                        display: flex;
                        gap: 8px;
                        flex-wrap: wrap;
                        align-items: center;
                        color: #1e293b;
                    }
                    .actor-row span,
                    .actor-row em,
                    .meta-row {
                        color: #64748b;
                        font-size: 0.85rem;
                        font-style: normal;
                    }
                    .meta-row {
                        margin: 0 0 8px;
                        word-break: break-word;
                    }
                    .detail-grid {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                    }
                    .detail-pill {
                        min-width: 0;
                        border-radius: 14px;
                        background: #eff6ff;
                        border: 1px solid #bfdbfe;
                        padding: 8px 10px;
                    }
                    .detail-pill span {
                        display: block;
                        color: #1d4ed8;
                        font-size: 0.72rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    .detail-pill strong {
                        display: block;
                        color: #0f172a;
                        font-size: 0.84rem;
                        margin-top: 4px;
                        word-break: break-word;
                    }
                    .status-pill {
                        border-radius: 999px;
                        padding: 6px 10px;
                        font-size: 0.72rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    .status-pill.success {
                        background: #dcfce7;
                        color: #166534;
                    }
                    .status-pill.failed {
                        background: #fee2e2;
                        color: #b91c1c;
                    }
                    :global(.tm-btn.ui.button) {
                        border-radius: 999px !important;
                        font-weight: 800 !important;
                    }
                `}</style>
            </AdminShell>
        );
    }
}

export default AuditLogsPage;
