import React, { Component } from 'react';
import { Button, Message } from 'semantic-ui-react';
import { contractAddress, getDeployedEventsInstance } from '../../ethereum/factory';
import AdminShell from '../../components/adminShell';
import { Link } from '../../routes';

class TicketValidationPage extends Component {
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
        return (
            <AdminShell
                activeRoute="/admin/ticket-validation"
                title="Ticket Validation Center"
                subtitle="Validation is always event-specific. Choose one event below."
                walletAddress={this.state.adminAccount}
                heroTitle="Validation Queue"
                heroDescription="Each link opens a dedicated validation page scoped to one event contract."
            >
                <div className="panel">
                    <h3>Event Validation Links</h3>
                    <ul className="validation-list">
                        {this.props.events.map((address) => (
                            <li key={address}>
                                <span className="mono">{address}</span>
                                <Link route={`/events/${address}/validate`} legacyBehavior>
                                    <a><Button size="tiny" primary>Validate QR</Button></a>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
                {this.props.loadError ? <Message error content={this.props.loadError} style={{ marginTop: '14px' }} /> : null}
                <style jsx>{`
                    .panel {
                        background: white;
                        border-radius: 12px;
                        padding: 16px;
                        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
                    }
                    .validation-list { list-style: none; padding: 0; margin: 0; }
                    .validation-list li {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 1px solid #e2e8f0;
                        padding: 10px 0;
                        gap: 8px;
                    }
                    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.8rem; word-break: break-word; }
                `}</style>
            </AdminShell>
        );
    }
}

export default TicketValidationPage;
