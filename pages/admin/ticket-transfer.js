import React, { Component } from 'react';
import { Button, Message } from 'semantic-ui-react';
import { contractAddress, getDeployedEventsInstance } from '../../ethereum/factory';
import Event from '../../ethereum/event';
import AdminShell from '../../components/adminShell';
import { Link } from '../../routes';

class TicketTransferPage extends Component {
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
                    description: details[4] || '',
                    eventDate: details[5] || ''
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

    renderEventSchedule(event) {
        if (!event.eventDate) {
            return 'Date not set';
        }

        const parsed = new Date(event.eventDate);
        if (Number.isNaN(parsed.getTime())) {
            return event.eventDate;
        }

        return parsed.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    render() {
        return (
            <AdminShell
                activeRoute="/admin/ticket-transfer"
                title="Ticket Transfer Center"
                subtitle="Ticket transfers are event-specific. Choose an event below to open its transfer form."
                walletAddress={this.state.adminAccount}
                heroTitle="Transfer Queue"
                heroDescription="Each event opens its own transfer screen so admins can move the right ticket under the correct event contract."
            >
                <div className="panel">
                    <h3>Event Transfer Links</h3>
                    <ul className="transfer-list">
                        {this.props.events.map((event) => (
                            <li key={event.address}>
                                <div className="event-copy">
                                    <p className="event-name">{event.name}</p>
                                    {event.description ? <p className="event-description">{event.description}</p> : null}
                                    <p className="event-date">{this.renderEventSchedule(event)}</p>
                                    <span className="mono">{event.address}</span>
                                </div>
                                <Link route={`/events/${event.address}/transferTicket`} legacyBehavior>
                                    <a><Button size="tiny" primary>Open Transfer</Button></a>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    {!this.props.events.length && !this.props.loadError ? (
                        <div className="empty-state">
                            <p>No deployed events found yet.</p>
                            <Link route="/events/new" legacyBehavior>
                                <a><Button primary>Create Event</Button></a>
                            </Link>
                        </div>
                    ) : null}
                </div>
                {this.props.loadError ? <Message error content={this.props.loadError} style={{ marginTop: '14px' }} /> : null}
                <style jsx>{`
                    .panel {
                        background: white;
                        border-radius: 12px;
                        padding: 16px;
                        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
                    }
                    .panel h3 {
                        margin: 0 0 12px;
                        color: #0f172a;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 1.65rem;
                        text-transform: uppercase;
                    }
                    .transfer-list {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }
                    .transfer-list li {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        border-bottom: 1px solid #e2e8f0;
                        padding: 12px 0;
                        gap: 12px;
                    }
                    .transfer-list li:last-child {
                        border-bottom: 0;
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
                    .event-description,
                    .event-date {
                        margin: 0;
                        color: #475569;
                        font-size: 0.82rem;
                        line-height: 1.45;
                    }
                    .mono {
                        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                        font-size: 0.8rem;
                        word-break: break-word;
                    }
                    .empty-state {
                        border: 1px dashed #cbd5e1;
                        border-radius: 12px;
                        padding: 18px;
                        margin-top: 8px;
                        text-align: center;
                        background: #f8fafc;
                    }
                    .empty-state p {
                        margin: 0 0 10px;
                        color: #64748b;
                    }
                    @media (max-width: 680px) {
                        .transfer-list li {
                            flex-direction: column;
                            align-items: stretch;
                        }
                    }
                `}</style>
            </AdminShell>
        );
    }
}

export default TicketTransferPage;
