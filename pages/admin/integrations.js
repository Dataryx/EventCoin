import React, { Component } from 'react';
import { Plug } from 'lucide-react';
import AdminShell from '../../components/adminShell';
import { Card, Button, Badge, Reveal } from '../../components/ui';

class IntegrationsPage extends Component {
    state = { adminAccount: '' };

    componentDidMount() {
        this.setState({ adminAccount: window.localStorage.getItem('adminAccount') || '' });
    }

    render() {
        const integrations = [
            { name: 'MetaMask', status: 'Connected', tone: 'accent' },
            { name: 'WalletConnect', status: 'Connected', tone: 'accent' },
            { name: 'Email Alerts', status: 'Not Connected', tone: 'warning' },
            { name: 'Analytics Stream', status: 'Connected', tone: 'accent' }
        ];

        return (
            <AdminShell
                activeRoute="/admin/integrations"
                title="Integrations"
                subtitle="Manage external services and infrastructure connections."
                walletAddress={this.state.adminAccount}
                heroTitle="Connected services"
                heroDescription="Control all integrations used by EventCoin admin stack."
            >
                <div className="grid gap-3 sm:grid-cols-2">
                    {integrations.map((item, i) => (
                        <Reveal key={item.name} delay={i * 0.04}>
                            <Card className="p-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-fg/70">
                                        <Plug size={14} strokeWidth={1.75} />
                                    </span>
                                    <div className="min-w-0">
                                        <div className="font-medium text-fg truncate">{item.name}</div>
                                        <Badge tone={item.tone} className="mt-1.5">{item.status}</Badge>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline">Configure</Button>
                            </Card>
                        </Reveal>
                    ))}
                </div>
            </AdminShell>
        );
    }
}

export default IntegrationsPage;
