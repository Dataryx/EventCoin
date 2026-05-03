import React, { Component } from 'react';
import { Form, Button, Input } from 'semantic-ui-react';
import Layout from '../../../components/layout';
import Event from '../../../ethereum/event';
import web3 from '../../../ethereum/web3';
import { Router } from '../../../routes';
import { persistAuditLog } from '../../../ethereum/auditLog';
import TopAlertStack from '../../../components/topAlertStack';

class EventNew extends Component {
    static async getInitialProps(props) {
        return {
            contractAddress: props.query.address
        };
    }

    state = {
        ticketId: '',
        errorMessage: '',
        statusMessage: '',
        loading: false
    };

    logAdminAudit = ({ status, entityId = '', details = {} }) => {
        const adminAccount = typeof window !== 'undefined'
            ? (window.localStorage.getItem('adminAccount') || 'Admin')
            : 'Admin';

        persistAuditLog({
            actorName: adminAccount,
            actorRole: 'admin',
            actorId: adminAccount,
            action: 'Ticket use',
            status,
            entityType: 'ticket',
            entityId: entityId ? entityId.toString() : '',
            route: `/events/${this.props.contractAddress}/owners/useTicket`,
            details: {
                eventAddress: this.props.contractAddress,
                ...details
            }
        });
    };

    formatUseTicketError = (error) => {
        const message = error?.message || 'Unable to mark this ticket as used.';

        if (message.includes('User denied')) {
            return 'The use-ticket transaction was cancelled in MetaMask.';
        }

        if (message.includes('revert')) {
            return 'Only the ticket owner or the event manager can use this ticket, and the ticket must still be unused.';
        }

        return message;
    };

    onSubmit = async (event) => {
        event.preventDefault();
        this.setState({
            loading: true,
            errorMessage: '',
            statusMessage: 'Checking ticket data and preparing the wallet transaction.'
        });
        const eventInstance = Event(this.props.contractAddress);

        try {
            if (!this.state.ticketId.trim()) {
                throw new Error('Enter a ticket ID before using a ticket.');
            }

            const accounts = await web3.eth.getAccounts();
            if (!accounts.length) {
                throw new Error('Connect a wallet in MetaMask before using a ticket.');
            }

            this.setState({
                statusMessage: `Submitting the use-ticket transaction for ticket #${this.state.ticketId.trim()}. Confirm it in MetaMask.`
            });
            const result = await eventInstance.methods
                .useTicket(this.state.ticketId)
                .send({
                    from: accounts[0],
                    gas: 300000 // Set a high gas limit
                });

            const useEvent = result.events.TicketUsed;
            const successMessage = `Ticket used successfully! Ticket ID: ${useEvent.returnValues.ticketId}`;
            this.logAdminAudit({
                status: 'success',
                entityId: useEvent.returnValues.ticketId,
                details: {
                    walletUsed: accounts[0]
                }
            });

            Router.pushRoute(`/events/${this.props.contractAddress}?successMessage=${encodeURIComponent(successMessage)}`);
        } catch (err) {
            const friendlyError = this.formatUseTicketError(err);
            this.logAdminAudit({
                status: 'failed',
                entityId: this.state.ticketId.trim(),
                details: {
                    reason: friendlyError
                }
            });
            this.setState({ errorMessage: friendlyError, statusMessage: '' });
        }
        this.setState({ loading: false });
    };

    render() {
        return (
            <Layout>
                <h3>Use a Ticket</h3>
                <TopAlertStack
                    alerts={[
                        this.state.statusMessage ? {
                            id: 'use-ticket-status',
                            type: 'info',
                            header: 'Ticket use status',
                            content: this.state.statusMessage,
                            autoDismissMs: 0
                        } : null,
                        this.state.errorMessage ? {
                            id: 'use-ticket-error',
                            type: 'error',
                            header: 'Ticket use failed',
                            content: this.state.errorMessage,
                            onDismiss: () => this.setState({ errorMessage: '' })
                        } : null
                    ]}
                />

                <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
                    <Form.Field>
                        <label>Ticket Id</label>
                        <Input
                            value={this.state.ticketId}
                            onChange={event => this.setState({ ticketId: event.target.value })}
                        />
                    </Form.Field>
                    <Button loading={this.state.loading} primary>Use!</Button>
                </Form>
            </Layout>
        );
    }
}

export default EventNew;
