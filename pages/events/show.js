
import React, { Component } from 'react';
import { Card, Button, Message, Label } from 'semantic-ui-react';
import Layout from '../../components/layout';
import Event from '../../ethereum/event';
import { Link } from '../../routes';

class EventShow extends Component {
    static async getInitialProps(props) {
        const event = Event(props.query.address);
        const summary = await event.methods.getEventDetails().call();
        const owner = await event.methods.manager().call();

        return {
            name: summary[0],
            ticketPrice: summary[1].toString(),
            ticketSupply: summary[2].toString(),
            ticketsSold: summary[3].toString(),
            description: summary[4] || '',
            eventDate: summary[5] || '',
            owner,
            contractAddress: props.query.address,
            successMessage: props.query.successMessage || '',
        };
    }

    constructor(props) {
        super(props);
        this.state = {
            errorMessage: '',
            successMessage: this.props.successMessage,
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.successMessage !== this.props.successMessage) {
            this.setState({ successMessage: this.props.successMessage });
        }
    }

    renderCards() {
        const {
            name,
            ticketPrice,
            ticketSupply,
            ticketsSold,
            description,
            eventDate,
            owner
        } = this.props;

        const items = [
            {
                header: name,
                description: 'Admin view for this event'
            },
            {
                header: ticketPrice,
                meta: 'in wei',
                description: 'Price of one ticket'
            },
            {
                header: ticketSupply - ticketsSold,
                description: 'Total number of tickets available for the event'
            },
            {
                header: ticketsSold,
                description: 'Number of tickets sold'
            },
            {
                header: owner,
                description: 'Event owner wallet address'
            },
            {
                header: eventDate || 'Not set',
                description: 'Event date'
            },
            {
                header: description || 'No description',
                description: 'Event description'
            }
        ];
        return <Card.Group items={items} />;
    }

    render() {
        const { errorMessage, successMessage } = this.state;

        return (
            <Layout>
                <h3>Event Admin Dashboard</h3>
                <Label color="blue" content="Admin" />
                {this.renderCards()}
                {errorMessage && (
                    <Message error header="Oops!" content={errorMessage} style={{ marginTop: '10px' }} />
                )}
                {successMessage && (
                    <Message success header="Success!" content={successMessage} style={{ marginTop: '10px' }} />
                )}
                <Link legacyBehavior route={`/events/${this.props.contractAddress}/owners`}>
                    <a>
                        <Button primary>View Owners</Button>
                    </a>
                </Link>
                <Link legacyBehavior route={`/events/${this.props.contractAddress}/validate`}>
                    <a>
                        <Button primary style={{ marginLeft: '10px' }}>Validate Ticket QR</Button>
                    </a>
                </Link>
                <Link legacyBehavior route={`/events/${this.props.contractAddress}/useTicket`}>
                    <a>
                        <Button primary style={{ marginLeft: '10px' }}>Use a Ticket</Button>
                    </a>
                </Link>
                <Link legacyBehavior route={`/events/${this.props.contractAddress}/refundTicket`}>
                    <a>
                        <Button primary style={{ marginLeft: '10px' }}>Request a refund</Button>
                    </a>
                </Link>
                <Link legacyBehavior route={`/events/${this.props.contractAddress}/transferTicket`}>
                    <a>
                        <Button primary style={{ marginLeft: '10px' }}>Transfer Ticket</Button>
                    </a>
                </Link>
                <Link legacyBehavior route={`/events/${this.props.contractAddress}/client`}>
                    <a>
                        <Button style={{ marginLeft: '10px' }}>Open Client Purchase View</Button>
                    </a>
                </Link>
            </Layout>
        );
    }
}

export default EventShow;
