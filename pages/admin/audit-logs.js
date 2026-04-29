import React, { Component } from 'react';
import AdminShell from '../../components/adminShell';
import { Card, Reveal } from '../../components/ui';

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
                title="Audit logs"
                subtitle="Trace operational and security activity."
                walletAddress={this.state.adminAccount}
                heroTitle="Security timeline"
                heroDescription="Immutable operational trail for admin actions."
            >
                <Reveal>
                    <Card className="overflow-hidden">
                        <ul className="divide-y divide-border">
                            {logs.map((log) => (
                                <li key={`${log.at}-${log.action}`} className="grid grid-cols-[auto_1fr] gap-4 px-5 py-4">
                                    <div className="flex flex-col items-center pt-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                        <span className="w-px flex-1 bg-border mt-1.5" />
                                    </div>
                                    <div>
                                        <p className="font-mono text-[11px] text-muted">{log.at}</p>
                                        <p className="text-sm text-fg mt-1"><span className="font-medium">{log.actor}</span> · {log.action}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </Reveal>
            </AdminShell>
        );
    }
}

export default AuditLogsPage;
