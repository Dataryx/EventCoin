import React, { Component } from 'react';
import { Segment, Header, Message } from 'semantic-ui-react';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '../../components/layout';
import Event from '../../ethereum/event';

class ClientTicketPage extends Component {
    static async getInitialProps(props) {
        const { eventAddress, ticketId } = props.query;
        const event = Event(eventAddress);
        const summary = await event.methods.getEventDetails().call();

        return {
            eventAddress,
            ticketId,
            eventName: summary[0],
            eventDescription: summary[4] || '',
            eventDate: summary[5] || ''
        };
    }

    state = {
        ticket: null,
        errorMessage: ''
    };

    componentDidMount() {
        try {
            const storageKey = `clientTickets:${this.props.eventAddress}`;
            const stored = window.localStorage.getItem(storageKey);
            const tickets = stored ? JSON.parse(stored) : [];
            const ticket = tickets.find((item) => item.ticketId.toString() === this.props.ticketId.toString());

            if (!ticket) {
                this.setState({ errorMessage: 'Ticket not found in this browser wallet storage.' });
                return;
            }

            this.setState({ ticket });
        } catch (error) {
            this.setState({ errorMessage: 'Unable to load ticket details.' });
        }
    }

    render() {
        const { ticket, errorMessage } = this.state;

        return (
            <Layout>
                <Segment padded="very" style={{ maxWidth: '760px', margin: '0 auto' }}>
                    <Header as="h2">My Ticket</Header>
                    <p><strong>Event:</strong> {this.props.eventName}</p>
                    <p><strong>Description:</strong> {this.props.eventDescription || 'No description'}</p>
                    <p><strong>Date:</strong> {this.props.eventDate || 'Not set'}</p>
                    <p><strong>Contract:</strong> {this.props.eventAddress}</p>
                    <p><strong>Ticket ID:</strong> {this.props.ticketId}</p>

                    {errorMessage ? <Message error content={errorMessage} /> : null}

                    {ticket ? (
                        <div style={{ marginTop: '14px' }}>
                            <QRCodeSVG value={ticket.qrPayload} size={220} />
                        </div>
                    ) : null}
                </Segment>
            </Layout>
        );
    }
}

export default ClientTicketPage;
