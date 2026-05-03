import React, { Component } from 'react';
import { Grid, Message } from 'semantic-ui-react';
import { contractAddress, getDeployedEventsInstance } from '../../ethereum/factory';
import AdminShell from '../../components/adminShell';
import Event from '../../ethereum/event';
import { fetchEthUsdRate, formatEthFromWei, formatUsdFromWei, multiplyWeiAmount } from '../../utils/ethPricing';

class RevenuePage extends Component {
    static async getInitialProps() {
        if (!contractAddress || !getDeployedEventsInstance) {
            return { events: [], loadError: 'Set NEXT_PUBLIC_DIAMOND_ADDRESS in .env to load deployed events.' };
        }
        try {
            const eventAddresses = await getDeployedEventsInstance.methods.getDeployedEvents().call();
            const events = await Promise.all(eventAddresses.map(async (address) => {
                const event = Event(address);
                const summary = await event.methods.getEventDetails().call();
                return {
                    address,
                    name: summary[0] || 'Unnamed Event',
                    ticketPriceWei: summary[1] ? summary[1].toString() : '0',
                    ticketsSold: parseInt(summary[3], 10) || 0
                };
            }));
            return { events, loadError: '' };
        } catch (error) {
            return { events: [], loadError: 'Unable to load events from blockchain right now.' };
        }
    }

    state = { adminAccount: '', ethUsdRate: null };

    async componentDidMount() {
        const ethUsdRate = await fetchEthUsdRate();
        this.setState({
            adminAccount: window.localStorage.getItem('adminAccount') || '',
            ethUsdRate
        });
    }

    render() {
        const totalRevenueWei = this.props.events.reduce(
            (sum, event) => (sum + BigInt(multiplyWeiAmount(event.ticketPriceWei, event.ticketsSold))),
            0n
        ).toString();
        const averageRevenueWei = this.props.events.length
            ? (BigInt(totalRevenueWei) / BigInt(this.props.events.length)).toString()
            : '0';
        return (
            <AdminShell
                activeRoute="/admin/revenue"
                title="Revenue Overview"
                subtitle="Track gross revenue from blockchain ticket sales."
                walletAddress={this.state.adminAccount}
                heroTitle="Finance Insights"
                heroDescription="Revenue analytics from event contracts."
            >
                <Grid stackable columns={3}>
                    <Grid.Column>
                        <div className="kpi">
                            <p>Gross Revenue</p>
                            <h3>{formatUsdFromWei(totalRevenueWei, this.state.ethUsdRate)}</h3>
                            <span>{formatEthFromWei(totalRevenueWei)}</span>
                        </div>
                    </Grid.Column>
                    <Grid.Column>
                        <div className="kpi">
                            <p>Avg/Event</p>
                            <h3>{formatUsdFromWei(averageRevenueWei, this.state.ethUsdRate)}</h3>
                            <span>{formatEthFromWei(averageRevenueWei)}</span>
                        </div>
                    </Grid.Column>
                    <Grid.Column>
                        <div className="kpi">
                            <p>Total Tickets Sold</p>
                            <h3>{this.props.events.reduce((sum, event) => sum + event.ticketsSold, 0)}</h3>
                            <span>Across {this.props.events.length} event(s)</span>
                        </div>
                    </Grid.Column>
                </Grid>
                {this.props.loadError ? <Message error content={this.props.loadError} style={{ marginTop: '14px' }} /> : null}
                <style jsx>{`
                    .kpi { background:white;border-radius:12px;padding:14px;box-shadow:0 8px 20px rgba(15,23,42,.06); }
                    .kpi p { margin:0;color:#64748b; }
                    .kpi h3 { margin:8px 0 0;font-family:'Syne',sans-serif;color:#0f172a; }
                    .kpi span { display:block;margin-top:6px;color:#334155;font-size:0.85rem; }
                `}</style>
            </AdminShell>
        );
    }
}

export default RevenuePage;
