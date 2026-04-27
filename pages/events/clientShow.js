import React, { Component } from 'react';
import { Card, Button, Message, Segment, Header, Grid, Label, Divider, Icon, List, Input } from 'semantic-ui-react';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '../../components/layout';
import Event from '../../ethereum/event';
import web3 from '../../ethereum/web3';

class ClientEventShow extends Component {
    static async getInitialProps(props) {
        const event = Event(props.query.address);
        const summary = await event.methods.getEventDetails().call();

        return {
            name: summary[0],
            ticketPrice: summary[1].toString(),
            ticketSupply: summary[2].toString(),
            ticketsSold: summary[3].toString(),
            description: summary[4] || '',
            eventDate: summary[5] || '',
            contractAddress: props.query.address,
        };
    }

    state = {
        loading: false,
        errorMessage: '',
        successMessage: '',
        clientAccount: '',
        purchasedTickets: [],
        copiedTicketId: '',
        quantity: 1,
        cartQuantity: 0
    };

    componentDidMount() {
        this.restoreClientState();
    }

    storageKey() {
        return `clientTickets:${this.props.contractAddress}`;
    }

    restoreClientState = async () => {
        const clientAccount = window.localStorage.getItem('clientAccount') || '';
        const storedTickets = window.localStorage.getItem(this.storageKey());
        const purchasedTickets = storedTickets ? JSON.parse(storedTickets) : [];

        this.setState({ clientAccount, purchasedTickets });
    };

    persistTickets = (tickets) => {
        window.localStorage.setItem(this.storageKey(), JSON.stringify(tickets));
        this.setState({ purchasedTickets: tickets });
    };

    createQrPayload = (ticketId, buyerAddress) => {
        const uniqueNonce = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        return JSON.stringify({
            eventAddress: this.props.contractAddress,
            ticketId: ticketId.toString(),
            buyerAddress,
            issuedAt: new Date().toISOString(),
            nonce: uniqueNonce
        });
    };

    handleCheckout = async () => {
        this.setState({ loading: true, errorMessage: '', successMessage: '' });
        const event = Event(this.props.contractAddress);

        try {
            const accounts = await web3.eth.getAccounts();
            if (!accounts.length) {
                throw new Error('No wallet account found. Login as client first.');
            }

            const buyerAddress = accounts[0];
            if (!this.state.cartQuantity) {
                throw new Error('Add at least one ticket to cart before checkout.');
            }
            const available = parseInt(this.props.ticketSupply, 10) - parseInt(this.props.ticketsSold, 10);
            if (this.state.cartQuantity > available) {
                throw new Error('Requested quantity exceeds available tickets.');
            }

            const newTickets = [];
            for (let i = 0; i < this.state.cartQuantity; i += 1) {
                const result = await event.methods.buyTicket().send({
                    from: buyerAddress,
                    value: this.props.ticketPrice
                });

                const ticketId = result.events.TicketPurchased.returnValues.ticketId;
                const qrPayload = this.createQrPayload(ticketId, buyerAddress);
                newTickets.push({
                    ticketId: ticketId.toString(),
                    qrPayload,
                    buyerAddress,
                    eventAddress: this.props.contractAddress
                });
            }

            const nextTickets = [...newTickets, ...this.state.purchasedTickets];
            this.persistTickets(nextTickets);
            window.localStorage.setItem('clientAccount', buyerAddress);

            this.setState({
                successMessage: `Checkout successful! Purchased ${this.state.cartQuantity} ticket(s).`,
                clientAccount: buyerAddress,
                cartQuantity: 0
            });
        } catch (err) {
            this.setState({ errorMessage: err.message });
        }

        this.setState({ loading: false });
    };

    handleAddToCart = () => {
        const quantity = parseInt(this.state.quantity, 10);
        const available = parseInt(this.props.ticketSupply, 10) - parseInt(this.props.ticketsSold, 10);

        if (!quantity || quantity < 1) {
            this.setState({ errorMessage: 'Enter a valid quantity.', successMessage: '' });
            return;
        }
        if (quantity > available) {
            this.setState({ errorMessage: 'Requested quantity exceeds available tickets.', successMessage: '' });
            return;
        }

        this.setState({
            cartQuantity: quantity,
            errorMessage: '',
            successMessage: `${quantity} ticket(s) added to cart.`
        });
    };

    renderCards() {
        const { name, ticketPrice, ticketSupply, ticketsSold, description, eventDate } = this.props;

        const items = [
            {
                header: name,
                description: 'Buy your ticket from this client dashboard'
            },
            {
                header: ticketPrice,
                meta: 'in wei',
                description: 'Price of one ticket'
            },
            {
                header: ticketSupply - ticketsSold,
                description: 'Tickets available'
            },
            {
                header: ticketsSold,
                description: 'Tickets sold'
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

    renderTicketQrCodes() {
        if (!this.state.purchasedTickets.length) {
            return <p>No purchased tickets in this browser for this event yet.</p>;
        }

        const handleCopy = async (qrPayload, ticketId) => {
            try {
                await navigator.clipboard.writeText(qrPayload);
                this.setState({ copiedTicketId: ticketId.toString() });
            } catch (error) {
                this.setState({ errorMessage: 'Unable to copy QR payload from this browser.' });
            }
        };

        return this.state.purchasedTickets.map((ticket) => (
            <Segment key={ticket.ticketId} style={{ marginTop: '12px' }}>
                <Header as="h4">
                    <Icon name="qrcode" />
                    <Header.Content>Ticket #{ticket.ticketId}</Header.Content>
                </Header>
                <p>Owner: {ticket.buyerAddress}</p>
                <QRCodeSVG value={ticket.qrPayload} size={180} />
                <p style={{ marginTop: '10px', wordBreak: 'break-word' }}>
                    QR payload: {ticket.qrPayload}
                </p>
                <Button
                    basic
                    color="teal"
                    size="tiny"
                    onClick={() => handleCopy(ticket.qrPayload, ticket.ticketId)}
                >
                    Copy QR Payload
                </Button>
                {this.state.copiedTicketId === ticket.ticketId ? (
                    <Label color="green" style={{ marginLeft: '10px' }}>Copied</Label>
                ) : null}
            </Segment>
        ));
    }

    render() {
        return (
            <Layout>
                <Segment
                    padded="very"
                    style={{
                        borderRadius: '16px',
                        border: '1px solid #155e75',
                        backgroundImage:
                            "linear-gradient(105deg, rgba(15, 23, 42, 0.88), rgba(8, 145, 178, 0.62)), url('https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1600&q=80')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        color: '#f8fafc'
                    }}
                >
                    <Header as="h2">Client Event Storefront</Header>
                    <Label color="teal" content="Purchase and Checkout" />
                    <p style={{ marginTop: '10px' }}>
                        Logged-in client wallet: {this.state.clientAccount || 'Not logged in'}
                    </p>
                </Segment>

                <Grid stackable columns={2}>
                    <Grid.Column width={10}>
                        {this.renderCards()}
                    </Grid.Column>
                    <Grid.Column width={6}>
                        <Segment>
                            <Header as="h4">Checkout</Header>
                            <List>
                                <List.Item icon="check circle" content="Secure on-chain purchase" />
                                <List.Item icon="check circle" content="Instant QR delivery after payment" />
                                <List.Item icon="check circle" content="Admin-side QR validation supported" />
                            </List>
                            <Divider />
                            <p>Ticket price: <strong>{this.props.ticketPrice}</strong> wei</p>
                            <p>Event: <strong>{this.props.name}</strong></p>
                            <p>Tickets available: <strong>{parseInt(this.props.ticketSupply, 10) - parseInt(this.props.ticketsSold, 10)}</strong></p>
                            <Input
                                type="number"
                                min="1"
                                value={this.state.quantity}
                                onChange={(event) => this.setState({ quantity: event.target.value })}
                                style={{ marginBottom: '10px' }}
                                fluid
                                label="Qty"
                                labelPosition="left"
                            />
                            <Button onClick={this.handleAddToCart} color="blue" fluid style={{ marginBottom: '8px' }}>
                                Add to Cart
                            </Button>
                            <p>Cart quantity: <strong>{this.state.cartQuantity}</strong></p>
                            <Button loading={this.state.loading} onClick={this.handleCheckout} primary fluid>
                                Checkout
                            </Button>
                        </Segment>
                    </Grid.Column>
                </Grid>

                {this.state.errorMessage && (
                    <Message error header="Oops!" content={this.state.errorMessage} style={{ marginTop: '10px' }} />
                )}
                {this.state.successMessage && (
                    <Message success header="Success!" content={this.state.successMessage} style={{ marginTop: '10px' }} />
                )}

                <Divider />
                <h4>Your Ticket QR Codes</h4>
                {this.renderTicketQrCodes()}
            </Layout>
        );
    }
}

export default ClientEventShow;
