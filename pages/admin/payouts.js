import React, { Component } from 'react';
import { Info } from 'lucide-react';
import AdminShell from '../../components/adminShell';
import { Card, Badge, Reveal } from '../../components/ui';

const TONE = { Completed: 'accent', Pending: 'warning', Scheduled: 'outline' };

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
                heroTitle="Settlement pipeline"
                heroDescription="Monitor payout batch statuses and release schedule."
            >
                <Reveal>
                    <Card className="overflow-hidden">
                        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 px-5 py-3 border-b border-border text-[10px] tracking-[0.18em] uppercase text-muted font-medium">
                            <div>Payout ID</div>
                            <div>Destination</div>
                            <div>Amount</div>
                            <div>Status</div>
                        </div>
                        <ul>
                            {rows.map((row, i) => (
                                <li key={row.id} className={`grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center px-5 py-4 ${i !== 0 ? 'border-t border-border' : ''}`}>
                                    <span className="font-mono text-sm text-fg">{row.id}</span>
                                    <span className="font-mono text-xs text-fg/80">{row.destination}</span>
                                    <span className="font-serif text-lg text-fg">{row.amount}</span>
                                    <Badge tone={TONE[row.status]}>{row.status}</Badge>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </Reveal>
                <Card className="mt-6 p-4 bg-accent/5 border-accent/20">
                    <div className="flex items-start gap-2">
                        <Info size={15} className="text-accent mt-0.5" strokeWidth={1.75} />
                        <p className="text-sm text-fg/80">Payout actions can be wired to settlement contracts next.</p>
                    </div>
                </Card>
            </AdminShell>
        );
    }
}

export default PayoutsPage;
