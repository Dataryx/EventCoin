import React, { Component } from 'react';
import { Form, Button } from 'semantic-ui-react';
import AdminShell from '../../components/adminShell';

class SettingsPage extends Component {
    state = {
        adminAccount: '',
        companyName: 'EventCoin',
        supportEmail: 'support@eventcoin.app',
        defaultFee: '2.5'
    };

    componentDidMount() {
        this.setState({ adminAccount: window.localStorage.getItem('adminAccount') || '' });
    }

    render() {
        return (
            <AdminShell
                activeRoute="/admin/settings"
                title="Platform Settings"
                subtitle="Configure global admin-level defaults."
                walletAddress={this.state.adminAccount}
                heroTitle="System Configuration"
                heroDescription="Apply platform identity and fee preferences."
            >
                <div className="panel">
                    <Form>
                        <Form.Input
                            label="Platform Name"
                            value={this.state.companyName}
                            onChange={(event) => this.setState({ companyName: event.target.value })}
                        />
                        <Form.Input
                            label="Support Email"
                            value={this.state.supportEmail}
                            onChange={(event) => this.setState({ supportEmail: event.target.value })}
                        />
                        <Form.Input
                            label="Default Platform Fee (%)"
                            value={this.state.defaultFee}
                            onChange={(event) => this.setState({ defaultFee: event.target.value })}
                        />
                        <Button primary>Save Settings</Button>
                    </Form>
                </div>
                <style jsx>{`
                    .panel { background:white;border-radius:12px;padding:14px;box-shadow:0 8px 20px rgba(15,23,42,.06); }
                `}</style>
            </AdminShell>
        );
    }
}

export default SettingsPage;
