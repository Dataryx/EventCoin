import React, { Component } from 'react';
import { Button, Form, Input, Message } from 'semantic-ui-react';
import Layout from '../../components/layout';
import Event from '../../ethereum/event';
import { Router } from '../../routes';
import { persistAuditLog } from '../../ethereum/auditLog';
import { applyStoredEventOverride, writeEventOverride } from '../../ethereum/eventOverrides';
import TopAlertStack from '../../components/topAlertStack';
import { fetchEthUsdRate, formatEthFromWei, formatUsdFromWei } from '../../utils/ethPricing';

class EditEventPage extends Component {
    static async getInitialProps(props) {
        const event = Event(props.query.address);
        const summary = await event.methods.getEventDetails().call();

        return {
            eventAddress: props.query.address,
            name: summary[0] || '',
            ticketPrice: summary[1].toString(),
            ticketSupply: summary[2].toString(),
            ticketsSold: summary[3].toString(),
            description: summary[4] || '',
            eventDate: summary[5] || ''
        };
    }

    state = {
        eventName: this.props.name || '',
        eventDescription: this.props.description || '',
        eventDate: this.props.eventDate || '',
        successMessage: '',
        errorMessage: '',
        loading: false,
        ethUsdRate: null
    };

    async componentDidMount() {
        const overriddenEvent = applyStoredEventOverride({
            address: this.props.eventAddress,
            name: this.props.name,
            description: this.props.description,
            eventDate: this.props.eventDate
        });
        const ethUsdRate = await fetchEthUsdRate();

        this.setState({
            eventName: overriddenEvent.name || '',
            eventDescription: overriddenEvent.description || '',
            eventDate: overriddenEvent.eventDate || '',
            ethUsdRate
        });
    }

    logAdminAudit = ({ status, details = {} }) => {
        const adminAccount = typeof window !== 'undefined'
            ? (window.localStorage.getItem('adminAccount') || 'Admin')
            : 'Admin';

        persistAuditLog({
            actorName: adminAccount,
            actorRole: 'admin',
            actorId: adminAccount,
            action: 'Event details edit',
            status,
            entityType: 'event',
            entityId: this.props.eventAddress,
            route: `/events/${this.props.eventAddress}/edit`,
            details
        });
    };

    handleSubmit = async (event) => {
        event.preventDefault();

        this.setState({
            loading: true,
            errorMessage: '',
            successMessage: ''
        });

        try {
            if (!this.state.eventName.trim()) {
                throw new Error('Event name is required.');
            }

            writeEventOverride(this.props.eventAddress, {
                name: this.state.eventName.trim(),
                description: this.state.eventDescription.trim(),
                eventDate: this.state.eventDate
            });

            this.logAdminAudit({
                status: 'success',
                details: {
                    eventName: this.state.eventName.trim(),
                    eventDate: this.state.eventDate
                }
            });

            Router.pushRoute(`/admin/events?successMessage=${encodeURIComponent('Event details updated successfully.')}`);
        } catch (error) {
            const message = error?.message || 'Unable to update event details right now.';

            this.logAdminAudit({
                status: 'failed',
                details: {
                    reason: message
                }
            });

            this.setState({
                loading: false,
                errorMessage: message
            });
            return;
        }

        this.setState({ loading: false });
    };

    render() {
        const ticketPriceEth = formatEthFromWei(this.props.ticketPrice);
        const ticketPriceUsd = formatUsdFromWei(this.props.ticketPrice, this.state.ethUsdRate);

        return (
            <Layout>
                <TopAlertStack
                    alerts={[
                        this.state.successMessage ? {
                            id: 'edit-event-success',
                            type: 'success',
                            content: this.state.successMessage,
                            onDismiss: () => this.setState({ successMessage: '' })
                        } : null,
                        this.state.errorMessage ? {
                            id: 'edit-event-error',
                            type: 'error',
                            content: this.state.errorMessage,
                            onDismiss: () => this.setState({ errorMessage: '' })
                        } : null
                    ]}
                />
                <section className="edit-shell">
                    <div className="hero-panel">
                        <span className="eyebrow">Admin Event Editor</span>
                        <h1>Edit Event</h1>
                        <p>Update the event details shown in the admin experience. Ticket price and supply stay tied to the live smart contract.</p>
                    </div>

                    <section className="panel">
                        <Form onSubmit={this.handleSubmit}>
                            <Form.Field>
                                <label>Event Name</label>
                                <Input
                                    value={this.state.eventName}
                                    onChange={(evt) => this.setState({ eventName: evt.target.value })}
                                />
                            </Form.Field>
                            <Form.Field>
                                <label>Description</label>
                                <Input
                                    value={this.state.eventDescription}
                                    onChange={(evt) => this.setState({ eventDescription: evt.target.value })}
                                />
                            </Form.Field>
                            <Form.Field>
                                <label>Event Date</label>
                                <Input
                                    type="date"
                                    value={this.state.eventDate}
                                    onChange={(evt) => this.setState({ eventDate: evt.target.value })}
                                />
                            </Form.Field>

                            <div className="contract-grid">
                                <article className="contract-card">
                                    <span>On-chain Ticket Price</span>
                                    <strong>{ticketPriceEth}</strong>
                                    <small>{ticketPriceUsd}</small>
                                </article>
                                <article className="contract-card">
                                    <span>On-chain Ticket Supply</span>
                                    <strong>{this.props.ticketSupply}</strong>
                                </article>
                                <article className="contract-card">
                                    <span>Tickets Sold</span>
                                    <strong>{this.props.ticketsSold}</strong>
                                </article>
                            </div>

                            <div className="action-row">
                                <Button loading={this.state.loading} primary>
                                    Save Event Details
                                </Button>
                                <Button
                                    type="button"
                                    basic
                                    color="blue"
                                    onClick={() => Router.pushRoute('/admin/events')}
                                >
                                    Back to Events
                                </Button>
                            </div>
                        </Form>
                        <Message info content="This edit updates the admin-side event presentation stored in the browser. It does not change the deployed event contract price or ticket supply." />
                    </section>
                </section>

                <style jsx>{`
                    .edit-shell {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        font-family: 'Nunito Sans', sans-serif;
                    }
                    .hero-panel {
                        border-radius: 24px;
                        padding: 24px;
                        background: radial-gradient(circle at top right, rgba(0, 185, 242, 0.24), transparent 30%), linear-gradient(125deg, #00112c 0%, #002d72 55%, #026cdf 100%);
                        color: white;
                    }
                    .eyebrow {
                        display: inline-block;
                        margin-bottom: 8px;
                        color: #7dd3fc;
                        font-size: 0.72rem;
                        letter-spacing: 0.11em;
                        text-transform: uppercase;
                        font-weight: 800;
                    }
                    .hero-panel h1 {
                        margin: 0 0 8px;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2.6rem;
                        text-transform: uppercase;
                    }
                    .hero-panel p {
                        margin: 0;
                        color: #dbeafe;
                        max-width: 720px;
                        line-height: 1.6;
                    }
                    .panel {
                        border: 1px solid #dbeafe;
                        border-radius: 20px;
                        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
                        padding: 18px;
                    }
                    .contract-grid {
                        display: grid;
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 10px;
                        margin: 16px 0;
                    }
                    .contract-card {
                        border: 1px solid #e2e8f0;
                        border-radius: 14px;
                        padding: 12px;
                        background: white;
                    }
                    .contract-card span {
                        display: block;
                        color: #64748b;
                        font-size: 0.72rem;
                        font-weight: 800;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                        margin-bottom: 4px;
                    }
                    .contract-card strong {
                        color: #0f172a;
                        font-size: 0.95rem;
                        display: block;
                    }
                    .contract-card small {
                        display: block;
                        margin-top: 4px;
                        color: #64748b;
                        font-size: 0.78rem;
                    }
                    .action-row {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        margin: 12px 0 16px;
                    }
                    @media (max-width: 760px) {
                        .contract-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                `}</style>
            </Layout>
        );
    }
}

export default EditEventPage;
