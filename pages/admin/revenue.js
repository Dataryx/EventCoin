import React, { Component } from 'react';
import { TrendingUp, Wallet, BarChart3, AlertCircle } from 'lucide-react';
import { contractAddress, getDeployedEventsInstance } from '../../ethereum/factory';
import AdminShell from '../../components/adminShell';
import { Card, Reveal } from '../../components/ui';

class RevenuePage extends Component {
    static async getInitialProps() {
        if (!contractAddress || !getDeployedEventsInstance) {
            return { events: [], loadError: 'Set NEXT_PUBLIC_DIAMOND_ADDRESS in .env to load deployed events.' };
        }
        try {
            const events = await getDeployedEventsInstance.methods.getDeployedEvents().call();
            return { events, loadError: '' };
        } catch (error) {
            return { events: [], loadError: 'Unable to load events from blockchain right now.' };
        }
    }

    state = { adminAccount: '' };

    componentDidMount() {
        this.setState({ adminAccount: window.localStorage.getItem('adminAccount') || '' });
    }

    render() {
        const totalRevenue = (this.props.events.length * 38 * 0.0125).toFixed(2);
        const avgPerEvent = (totalRevenue / Math.max(this.props.events.length, 1)).toFixed(2);

        const kpis = [
            { title: 'Gross revenue', value: `$${totalRevenue}K`, icon: Wallet },
            { title: 'Avg / event', value: `$${avgPerEvent}K`, icon: BarChart3 },
            { title: 'Growth', value: '+18.1%', icon: TrendingUp, accent: true }
        ];

        return (
            <AdminShell
                activeRoute="/admin/revenue"
                title="Revenue"
                subtitle="Track gross revenue from blockchain ticket sales."
                walletAddress={this.state.adminAccount}
                heroTitle="Finance insights"
                heroDescription="Revenue analytics from your event contracts."
            >
                <div className="grid sm:grid-cols-3 gap-3">
                    {kpis.map((k, i) => {
                        const Icon = k.icon;
                        return (
                            <Reveal key={k.title} delay={i * 0.04}>
                                <Card className="p-5">
                                    <div className="flex items-start justify-between">
                                        <span className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">{k.title}</span>
                                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent">
                                            <Icon size={13} strokeWidth={1.75} />
                                        </span>
                                    </div>
                                    <div className="font-serif text-3xl text-fg mt-3">{k.value}</div>
                                </Card>
                            </Reveal>
                        );
                    })}
                </div>

                {this.props.loadError ? (
                    <Card className="mt-6 p-4 border-danger/30 bg-danger/5">
                        <div className="flex items-start gap-2">
                            <AlertCircle size={15} className="text-danger mt-0.5" strokeWidth={1.75} />
                            <p className="text-sm text-fg">{this.props.loadError}</p>
                        </div>
                    </Card>
                ) : null}
            </AdminShell>
        );
    }
}

export default RevenuePage;
