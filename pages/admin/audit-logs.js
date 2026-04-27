import React, { Component } from 'react';
import AdminShell from '../../components/adminShell';

class AuditLogsPage extends Component {
    state = { adminAccount: '' };

    componentDidMount() {
        this.setState({ adminAccount: window.localStorage.getItem('adminAccount') || '' });
    }

    render() {
        const logs = [
            { at: '2026-04-26 18:35', actor: 'Admin Wallet', action: 'Created event contract' },
            { at: '2026-04-26 18:37', actor: 'Validator Node', action: 'Validated ticket #112' },
            { at: '2026-04-26 18:41', actor: 'Finance Bot', action: 'Generated payout batch' },
            { at: '2026-04-26 18:44', actor: 'System', action: 'Updated integration keys' }
        ];
        return (
            <AdminShell
                activeRoute="/admin/audit-logs"
                title="Audit Logs"
                subtitle="Trace operational and security activity."
                walletAddress={this.state.adminAccount}
                heroTitle="Security Timeline"
                heroDescription="Immutable operational trail for admin actions."
            >
                <div className="panel">
                    {logs.map((log) => (
                        <div className="item" key={`${log.at}-${log.action}`}>
                            <p className="ts">{log.at}</p>
                            <p><strong>{log.actor}</strong> - {log.action}</p>
                        </div>
                    ))}
                </div>
                <style jsx>{`
                    .panel { background:white;border-radius:12px;padding:14px;box-shadow:0 8px 20px rgba(15,23,42,.06); }
                    .item { border-left:3px solid #2563eb; padding:6px 10px; margin-bottom:10px; background:#f8fafc; }
                    .ts { margin:0 0 4px; color:#64748b; font-size:.8rem; }
                    .item p { margin:0; }
                `}</style>
            </AdminShell>
        );
    }
}

export default AuditLogsPage;
