import React, { Component } from 'react';
import { Save } from 'lucide-react';
import AdminShell from '../../components/adminShell';
import { Card, Button, Input, Field, Reveal } from '../../components/ui';

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

    set = (k) => (e) => this.setState({ [k]: e.target.value });

    render() {
        return (
            <AdminShell
                activeRoute="/admin/settings"
                title="Settings"
                subtitle="Configure global admin-level defaults."
                walletAddress={this.state.adminAccount}
                heroTitle="System configuration"
                heroDescription="Apply platform identity and fee preferences."
            >
                <Reveal>
                    <Card className="p-6 sm:p-8 max-w-2xl">
                        <form
                            onSubmit={(e) => { e.preventDefault(); }}
                            className="flex flex-col gap-5"
                        >
                            <Field label="Platform name">
                                <Input value={this.state.companyName} onChange={this.set('companyName')} />
                            </Field>
                            <Field label="Support email">
                                <Input type="email" value={this.state.supportEmail} onChange={this.set('supportEmail')} />
                            </Field>
                            <Field label="Default platform fee" hint="Percentage applied to gross ticket revenue.">
                                <Input value={this.state.defaultFee} onChange={this.set('defaultFee')} className="font-mono" />
                            </Field>
                            <Button
                                as="button"
                                type="submit"
                                leftIcon={<Save size={14} strokeWidth={1.75} />}
                                className="self-start"
                            >
                                Save settings
                            </Button>
                        </form>
                    </Card>
                </Reveal>
            </AdminShell>
        );
    }
}

export default SettingsPage;
