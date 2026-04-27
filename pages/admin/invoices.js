import React, { Component } from 'react';
import AdminShell from '../../components/adminShell';

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
                heroTitle="Billing Ledger"
                heroDescription="Review invoice health and payment collection."
            >
                <div className="panel">
                    {invoices.map((invoice) => (
                        <div key={invoice.number} className="row">
                            <div>
                                <strong>{invoice.number}</strong>
                                <p>{invoice.client}</p>
                            </div>
                            <div><strong>{invoice.total}</strong></div>
                            <span className={`pill ${invoice.status.toLowerCase()}`}>{invoice.status}</span>
                        </div>
                    ))}
                </div>
                <style jsx>{`
                    .panel { background:white;border-radius:12px;padding:14px;box-shadow:0 8px 20px rgba(15,23,42,.06); }
                    .row { display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #e2e8f0; }
                    .row p { margin:4px 0 0;color:#64748b;font-size:.9rem; }
                    .pill { padding:4px 10px;border-radius:999px;font-size:.75rem;font-weight:700; }
                    .paid { background:#dcfce7;color:#166534; }
                    .open { background:#dbeafe;color:#1d4ed8; }
                    .overdue { background:#fee2e2;color:#991b1b; }
                `}</style>
            </AdminShell>
        );
    }
}

export default InvoicesPage;
