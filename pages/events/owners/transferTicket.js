import React, { Component } from 'react';
import { Form, Button, Input, Message } from 'semantic-ui-react';
import Layout from '../../../components/layout';
import Event from '../../../ethereum/event';
import web3 from '../../../ethereum/web3';
import { Router } from '../../../routes';

class TransferTicket extends Component {
    static async getInitialProps(props) {
        return {
            contractAddress: props.query.address
        };
    }

    state = {
        ticketId: '',
        newOwner: '',
        errorMessage: '',
        loading: false
    };

    onSubmit = async (event) => {
        event.preventDefault();
        this.setState({ loading: true, errorMessage: '' });
        const eventInstance = Event(this.props.contractAddress);

        try {
            const accounts = await web3.eth.getAccounts();
            const result = await eventInstance.methods
                .transferTicket(this.state.ticketId, this.state.newOwner)
                .send({
                    from: accounts[0],
                    gas: 300000 // Set a high gas limit
                });

            const transferEvent = result.events.TicketTransferred;
            const successMessage = `Ticket transferred successfully! Ticket ID: ${transferEvent.returnValues.ticketId} transferred from : ${transferEvent.returnValues.from} to ${transferEvent.returnValues.to}`;

            Router.pushRoute(`/events/${this.props.contractAddress}?successMessage=${encodeURIComponent(successMessage)}`);
        } catch (err) {
            // Capture the error message
            const errorMessage = err.message.includes("revert")
                ? "You do not own this ticket"
                : err.message;
            this.setState({ errorMessage });
        }
        this.setState({ loading: false });
    };

    render() {
        return (
            <Layout>
                <h3>Transfer a Ticket</h3>

                <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
                    <Form.Field>
                        <label>Ticket Id</label>
                        <Input
                            value={this.state.ticketId}
                            onChange={event => this.setState({ ticketId: event.target.value })}
                        />
                    </Form.Field>
                    <Form.Field>
                        <label>New Owner Address</label>
                        <Input
                            value={this.state.newOwner}
                            onChange={event => this.setState({ newOwner: event.target.value })}
                        />
                    </Form.Field>
                    {this.state.errorMessage && (
                        <Message error header="Oops!" content={this.state.errorMessage} />
                    )}
                    <Button loading={this.state.loading} primary>Transfer!</Button>
                </Form>
            </Layout>
        );
    }
}

export default TransferTicket;
