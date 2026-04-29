import React, { Component } from 'react';
import { Button, Message } from 'semantic-ui-react';
import { contractAddress, getDeployedEventsInstance } from '../../ethereum/factory';
import Event from '../../ethereum/event';
import AdminShell from '../../components/adminShell';
import { Link } from '../../routes';

class TicketValidationPage extends Component {
    static async getInitialProps() {
        if (!contractAddress || !getDeployedEventsInstance) {
            return { events: [], loadError: 'Set NEXT_PUBLIC_DIAMOND_ADDRESS in .env to load deployed events.' };
        }
        try {
            const addresses = await getDeployedEventsInstance.methods.getDeployedEvents().call();
            const events = await Promise.all(addresses.map(async (address) => {
                const event = Event(address);
                const details = await event.methods.getEventDetails().call();
                return {
                    address,
                    name: details[0] || 'Unnamed Event',
                    description: details[4] || ''
                };
            }));
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
                subtitle="Validation and ticket usage are both event-specific. Choose one event below."
                walletAddress={this.state.adminAccount}
                heroTitle="Validation and Entry Queue"
                heroDescription="Each link opens a dedicated event page where admins can validate tickets or mark them used."
            >
                <div className="panel">
                    <h3>Event Validation and Use Links</h3>
                    <ul className="validation-list">
                        {this.props.events.map((event) => (
                            <li key={event.address}>
                                <div className="event-copy">
                                    <p className="event-name">{event.name}</p>
                                    {event.description ? <p className="event-description">{event.description}</p> : null}
                                    <span className="mono">{event.address}</span>
                                </div>
                                <Link route={`/events/${event.address}/validate`} legacyBehavior>
                                    <a><Button size="tiny" primary>Open Validation</Button></a>
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
                         align-items: flex-start;
                         border-bottom: 1px solid #e2e8f0;
                         padding: 10px 0;
                         gap: 12px;
                     }
                     .event-copy {
                         display: flex;
                         flex-direction: column;
                         gap: 4px;
                         min-width: 0;
                     }
                     .event-name {
                         margin: 0;
                         color: #0f172a;
                         font-weight: 800;
                         font-size: 0.95rem;
                     }
                     .event-description {
                         margin: 0;
                         color: #475569;
                         font-size: 0.82rem;
                         line-height: 1.45;
                     }
                     .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.8rem; word-break: break-word; }
                 `}</style>
            </AdminShell>
        );
    }
}

export default TicketValidationPage;
