import React, { Component } from 'react';
import { Grid, Message } from 'semantic-ui-react';
import { contractAddress, getDeployedEventsInstance } from '../../ethereum/factory';
import AdminShell from '../../components/adminShell';

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
                    <Grid.Column><div className="kpi"><p>Gross Revenue</p><h3>${totalRevenue}K</h3></div></Grid.Column>
                    <Grid.Column><div className="kpi"><p>Avg/Event</p><h3>${(totalRevenue / Math.max(this.props.events.length, 1)).toFixed(2)}K</h3></div></Grid.Column>
                    <Grid.Column><div className="kpi"><p>Growth</p><h3>+18.1%</h3></div></Grid.Column>
                </Grid>
                {this.props.loadError ? <Message error content={this.props.loadError} style={{ marginTop: '14px' }} /> : null}
                <style jsx>{`
                    .kpi { background:white;border-radius:12px;padding:14px;box-shadow:0 8px 20px rgba(15,23,42,.06); }
                    .kpi p { margin:0;color:#64748b; }
                    .kpi h3 { margin:8px 0 0;font-family:'Syne',sans-serif;color:#0f172a; }
                `}</style>
            </AdminShell>
        );
    }
}

export default RevenuePage;
