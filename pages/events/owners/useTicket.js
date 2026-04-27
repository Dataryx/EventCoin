import React, { Component } from 'react';
import { Form, Button, Input, Message } from 'semantic-ui-react';
import Layout from '../../../components/layout';
import Event from '../../../ethereum/event';
import web3 from '../../../ethereum/web3';
import { Router } from '../../../routes';

class EventNew extends Component {
    static async getInitialProps(props) {
        return {
            contractAddress: props.query.address
        };
    }

    state = {
        ticketId: '',
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
                .useTicket(this.state.ticketId)
                .send({
                    from: accounts[0],
                    gas: 300000 // Set a high gas limit
                });

            const useEvent = result.events.TicketUsed;
            const successMessage = `Ticket used successfully! Ticket ID: ${useEvent.returnValues.ticketId}`;

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
                <h3>Use a Ticket</h3>

                <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
                    <Form.Field>
                        <label>Ticket Id</label>
                        <Input
                            value={this.state.ticketId}
                            onChange={event => this.setState({ ticketId: event.target.value })}
                        />
                    </Form.Field>
                    {this.state.errorMessage && (
                        <Message error header="Oops!" content={this.state.errorMessage} />
                    )}
                    <Button loading={this.state.loading} primary>Use!</Button>
                </Form>
            </Layout>
        );
    }
}

export default EventNew;
