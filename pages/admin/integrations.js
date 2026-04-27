import React, { Component } from 'react';
import { Button } from 'semantic-ui-react';
import AdminShell from '../../components/adminShell';

class IntegrationsPage extends Component {
    state = { adminAccount: '' };

    componentDidMount() {
        this.setState({ adminAccount: window.localStorage.getItem('adminAccount') || '' });
    }

    render() {
        const integrations = [
            { name: 'MetaMask', status: 'Connected', tone: 'connected' },
            { name: 'WalletConnect', status: 'Connected', tone: 'connected' },
            { name: 'Email Alerts', status: 'Not Connected', tone: 'warning' },
            { name: 'Analytics Stream', status: 'Connected', tone: 'connected' }
        ];
        return (
            <AdminShell
                activeRoute="/admin/integrations"
                title="Integrations"
                subtitle="Manage external services and infrastructure connections."
                walletAddress={this.state.adminAccount}
                heroTitle="Connected Services"
                heroDescription="Control all integrations used by EventCoin admin stack."
            >
                <div className="panel">
                    {integrations.map((item) => (
                        <div className="row" key={item.name}>
                            <div>
                                <strong>{item.name}</strong>
                                <p className={item.tone}>{item.status}</p>
                            </div>
                            <Button size="tiny">Configure</Button>
                        </div>
                    ))}
                </div>
                <style jsx>{`
                    .panel { background:white;border-radius:12px;padding:14px;box-shadow:0 8px 20px rgba(15,23,42,.06); }
                    .row { display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #e2e8f0; }
                    p { margin:4px 0 0;font-size:.85rem; }
                    .connected { color:#166534; } .warning { color:#b45309; }
                `}</style>
            </AdminShell>
        );
    }
}

export default IntegrationsPage;
