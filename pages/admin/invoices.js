import React, { Component } from 'react';
import AdminShell from '../../components/adminShell';
import { Card, Badge, Reveal } from '../../components/ui';

const TONE = { Paid: 'accent', Open: 'outline', Overdue: 'danger' };

class InvoicesPage extends Component {
    state = { adminAccount: '' };

    componentDidMount() {
        this.setState({ adminAccount: window.localStorage.getItem('adminAccount') || '' });
    }

    render() {
        const invoices = [
            { number: 'INV-9001', client: 'Alpha Events', total: '$850', status: 'Paid' },
            { number: 'INV-9002', client: 'Nova Tickets', total: '$1,200', status: 'Open' },
            { number: 'INV-9003', client: 'Venue Ops', total: '$430', status: 'Overdue' }
        ];

        return (
            <AdminShell
                activeRoute="/admin/invoices"
                title="Invoices"
                subtitle="Invoice ledger for platform and organizer billing."
                walletAddress={this.state.adminAccount}
                heroTitle="Billing ledger"
                heroDescription="Review invoice health and payment collection."
            >
                <Reveal>
                    <Card className="overflow-hidden">
                        <ul>
                            {invoices.map((invoice, i) => (
                                <li key={invoice.number} className={`grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-4 ${i !== 0 ? 'border-t border-border' : ''}`}>
                                    <div className="min-w-0">
                                        <div className="font-mono text-sm text-fg">{invoice.number}</div>
                                        <div className="text-xs text-muted mt-0.5">{invoice.client}</div>
                                    </div>
                                    <span className="font-serif text-lg text-fg">{invoice.total}</span>
                                    <Badge tone={TONE[invoice.status]}>{invoice.status}</Badge>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </Reveal>
            </AdminShell>
        );
    }
}

export default InvoicesPage;
