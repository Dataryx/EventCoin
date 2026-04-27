import React, { Component } from 'react';
import { Message } from 'semantic-ui-react';
import AdminShell from '../../components/adminShell';

class PayoutsPage extends Component {
    state = { adminAccount: '' };

    componentDidMount() {
        this.setState({ adminAccount: window.localStorage.getItem('adminAccount') || '' });
    }

    render() {
        const rows = [
            { id: 'P-1021', destination: '0x8Af...1E2', amount: '$3.20K', status: 'Completed' },
            { id: 'P-1022', destination: '0x4Dc...9aA', amount: '$1.18K', status: 'Pending' },
            { id: 'P-1023', destination: '0x2Fd...334', amount: '$0.92K', status: 'Scheduled' }
        ];
        return (
            <AdminShell
                activeRoute="/admin/payouts"
                title="Payouts"
                subtitle="Manage treasury and organizer settlement payouts."
                walletAddress={this.state.adminAccount}
                heroTitle="Settlement Pipeline"
                heroDescription="Monitor payout batch statuses and release schedule."
            >
                <div className="panel">
                    <table>
                        <thead><tr><th>Payout ID</th><th>Destination</th><th>Amount</th><th>Status</th></tr></thead>
                        <tbody>
                            {rows.map((row) => <tr key={row.id}><td>{row.id}</td><td>{row.destination}</td><td>{row.amount}</td><td>{row.status}</td></tr>)}
                        </tbody>
                    </table>
                </div>
                <Message info style={{ marginTop: '14px' }} content="Payout actions can be wired to settlement contracts next." />
                <style jsx>{`
                    .panel { background:white;border-radius:12px;padding:14px;box-shadow:0 8px 20px rgba(15,23,42,.06); }
                    table { width:100%; border-collapse: collapse; }
                    th, td { text-align:left; padding:10px 8px; border-bottom:1px solid #e2e8f0; }
                `}</style>
            </AdminShell>
        );
    }
}

export default PayoutsPage;
