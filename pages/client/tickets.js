import React, { Component } from 'react';
import { Segment, Header, Message, Divider, Button } from 'semantic-ui-react';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '../../components/layout';
import Event from '../../ethereum/event';

class ClientTicketsPage extends Component {
    state = {
        tickets: [],
        loading: true,
        errorMessage: '',
        copiedTicketKey: ''
    };

    async componentDidMount() {
        try {
            const baseTickets = [];

            Object.keys(window.localStorage).forEach((key) => {
                if (key.startsWith('clientTickets:')) {
                    const eventAddress = key.split(':')[1];
                    try {
                        const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
                        parsed.forEach((ticket) => {
                            baseTickets.push({
                                ...ticket,
                                eventAddress,
                                eventName: 'Unknown Event',
                                ticketPrice: '',
                                eventDescription: '',
                                eventDate: '',
                                detailsUnavailable: false
                            });
                        });
                    } catch (error) {
                        // Ignore invalid local ticket data.
                    }
                }
            });

            const enrichedTickets = await Promise.all(baseTickets.map(async (ticket) => {
                try {
                    const summary = await Event(ticket.eventAddress).methods.getEventDetails().call();
                    return {
                        ...ticket,
                        eventName: summary[0],
                        ticketPrice: summary[1].toString(),
                        eventDescription: summary[4] || '',
                        eventDate: summary[5] || '',
                        detailsUnavailable: false
                    };
                } catch (error) {
                    // Keep local ticket visible even if on-chain lookup fails
                    // (e.g. old contract address from previous migration).
                    return {
                        ...ticket,
                        detailsUnavailable: true
                    };
                }
            }));

            this.setState({ tickets: enrichedTickets, loading: false });
        } catch (error) {
            this.setState({ errorMessage: 'Unable to load tickets.', loading: false });
        }
    }

    renderTicket(ticket) {
        let parsedPayload = null;
        try {
            parsedPayload = JSON.parse(ticket.qrPayload);
        } catch (error) {
            parsedPayload = null;
        }

        const ticketKey = `${ticket.eventAddress}-${ticket.ticketId}`;

        return (
            <Segment key={ticketKey} padded="very" style={{ marginBottom: '12px' }}>
                <Header as="h3">{ticket.eventName || 'Unnamed Event'}</Header>
                {ticket.detailsUnavailable ? (
                    <Message warning content="Event details unavailable for this ticket on current network deployment." />
                ) : null}
                <p><strong>Description:</strong> {ticket.eventDescription || 'No description'}</p>
                <p><strong>Date:</strong> {ticket.eventDate || 'Not set'}</p>
                <p><strong>Contract:</strong> {ticket.eventAddress}</p>
                <p><strong>Ticket ID:</strong> {ticket.ticketId}</p>
                <p><strong>Ticket Price:</strong> {ticket.ticketPrice ? `$${ticket.ticketPrice}` : 'Unavailable'}</p>
                <Divider />
                <Header as="h4">Validation Data</Header>
                <p><strong>QR Event Address:</strong> {parsedPayload?.eventAddress || 'Unavailable'}</p>
                <p><strong>QR Ticket ID:</strong> {parsedPayload?.ticketId || 'Unavailable'}</p>
                <p><strong>Buyer Address:</strong> {parsedPayload?.buyerAddress || 'Unavailable'}</p>
                <p><strong>Issued At:</strong> {parsedPayload?.issuedAt || 'Unavailable'}</p>
                <p><strong>Nonce:</strong> {parsedPayload?.nonce || 'Unavailable'}</p>
                <Button
                    size="small"
                    color="blue"
                    onClick={async () => {
                        try {
                            await navigator.clipboard.writeText(ticket.qrPayload || '');
                            this.setState({ copiedTicketKey: ticketKey });
                        } catch (error) {
                            this.setState({ errorMessage: 'Unable to copy QR payload.' });
                        }
                    }}
                >
                    Copy QR Payload
                </Button>
                {this.state.copiedTicketKey === ticketKey ? (
                    <span style={{ marginLeft: '10px', color: '#059669', fontWeight: 700 }}>Copied</span>
                ) : null}
                <Divider />
                <QRCodeSVG value={ticket.qrPayload} size={220} />
            </Segment>
        );
    }

    render() {
        return (
            <Layout>
                <Header as="h2">My Tickets</Header>
                {this.state.errorMessage ? <Message error content={this.state.errorMessage} /> : null}
                {!this.state.loading && this.state.tickets.length === 0 ? (
                    <Message info content="No tickets found in this browser wallet storage." />
                ) : null}
                {this.state.tickets.map((ticket) => this.renderTicket(ticket))}
            </Layout>
        );
    }
}

export default ClientTicketsPage;
