import React, { Component } from 'react';
import { Button, Message, Input, Icon } from 'semantic-ui-react';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '../../components/layout';
import Event from '../../ethereum/event';
import web3 from '../../ethereum/web3';
import { Router } from '../../routes';

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
            contractAddress: props.query.address
        };
    }

    state = {
        loading: false,
        errorMessage: '',
        successMessage: '',
        clientAccount: '',
        clientWallet: '',
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

    isTicketOwnedByClient = (ticket, clientAccount, clientWallet) => {
        if (clientAccount && ticket.purchaserId) {
            return ticket.purchaserId === clientAccount;
        }

        if (clientWallet && ticket.buyerAddress) {
            return ticket.buyerAddress.toLowerCase() === clientWallet.toLowerCase();
        }

        return false;
    };

    restoreClientState = async () => {
        const clientAccount = window.localStorage.getItem('clientAccount') || '';
        const clientWallet = window.localStorage.getItem('clientWallet') || '';
        const storedTickets = window.localStorage.getItem(this.storageKey());
        const allTickets = storedTickets ? JSON.parse(storedTickets) : [];
        const purchasedTickets = allTickets.filter((ticket) => this.isTicketOwnedByClient(ticket, clientAccount, clientWallet));

        this.setState({ clientAccount, clientWallet, purchasedTickets });
    };

    persistTickets = (tickets) => {
        const clientAccount = window.localStorage.getItem('clientAccount') || '';
        const clientWallet = window.localStorage.getItem('clientWallet') || '';
        const storedTickets = window.localStorage.getItem(this.storageKey());
        const allTickets = storedTickets ? JSON.parse(storedTickets) : [];
        const preservedTickets = allTickets.filter((ticket) => !this.isTicketOwnedByClient(ticket, clientAccount, clientWallet));
        const nextTickets = [...preservedTickets, ...tickets];

        window.localStorage.setItem(this.storageKey(), JSON.stringify(nextTickets));
        this.setState({ purchasedTickets: tickets });
    };

    handleLogout = () => {
        window.localStorage.removeItem('clientAccount');
        window.localStorage.removeItem('clientProfile');
        window.localStorage.removeItem('clientWallet');
        Router.pushRoute('/client/login');
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
            if (!window.ethereum) {
                throw new Error('Install MetaMask to complete checkout.');
            }
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const accounts = await web3.eth.getAccounts();
            if (!accounts.length) {
                throw new Error('No wallet account found. Connect MetaMask first.');
            }

            const buyerAddress = accounts[0];
            const profile = JSON.parse(window.localStorage.getItem('clientProfile') || '{}');
            const purchaserId = window.localStorage.getItem('clientAccount') || '';
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
                    eventAddress: this.props.contractAddress,
                    purchaserId,
                    purchaserName: profile.name || purchaserId
                });
            }

            const nextTickets = [...newTickets, ...this.state.purchasedTickets];
            this.persistTickets(nextTickets);
            window.localStorage.setItem('clientWallet', buyerAddress);

            this.setState({
                successMessage: `Checkout successful! Purchased ${this.state.cartQuantity} ticket(s).`,
                clientWallet: buyerAddress,
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

    renderTicketQrCards() {
        if (!this.state.purchasedTickets.length) {
            return <p className="empty-tickets">No purchased tickets in this browser for this event yet.</p>;
        }

        return this.state.purchasedTickets.map((ticket) => (
            <article key={ticket.ticketId} className="qr-card">
                <div className="qr-card-head">
                    <h4>Ticket #{ticket.ticketId}</h4>
                    <span className="ticket-pill">QR READY</span>
                </div>
                <p className="owner-row">Owner: {ticket.purchaserName || ticket.purchaserId || ticket.buyerAddress}</p>
                <div className="qr-wrap">
                    <QRCodeSVG value={ticket.qrPayload} size={180} />
                </div>
                <p className="payload-copy">{ticket.qrPayload}</p>
                <Button
                    basic
                    color="blue"
                    size="tiny"
                    onClick={async () => {
                        try {
                            await navigator.clipboard.writeText(ticket.qrPayload);
                            this.setState({ copiedTicketId: ticket.ticketId.toString() });
                        } catch (error) {
                            this.setState({ errorMessage: 'Unable to copy QR payload from this browser.' });
                        }
                    }}
                >
                    Copy QR Payload
                </Button>
                {this.state.copiedTicketId === ticket.ticketId ? <span className="copied-pill">Copied</span> : null}
            </article>
        ));
    }

    render() {
        const availableTickets = Math.max(parseInt(this.props.ticketSupply, 10) - parseInt(this.props.ticketsSold, 10), 0);
        const sellThrough = parseInt(this.props.ticketSupply, 10)
            ? Math.min(Math.round((parseInt(this.props.ticketsSold, 10) / parseInt(this.props.ticketSupply, 10)) * 100), 100)
            : 0;

        return (
            <Layout>
                <div className="tm-client-page">
                    <section className="hero-panel">
                        <div className="hero-copy">
                            <span className="kicker">EventCoin Commerce Hub</span>
                            <h1>{this.props.name || 'Unnamed Event'}</h1>
                            <p>{this.props.description || 'Get tickets instantly with Ticketmaster-style checkout and QR delivery.'}</p>
                            <div className="hero-tags">
                                <span className="tag">{this.props.eventDate || 'Date TBD'}</span>
                                <span className="tag">Sell-through {sellThrough}%</span>
                                <span className="tag">{availableTickets} LEFT</span>
                            </div>
                        </div>
                        <div className="hero-side">
                            <p className="side-label">Client Session</p>
                            <h2>${this.props.ticketPrice}</h2>
                            <p className="side-copy">Price per ticket</p>
                            <p className="wallet-copy">{this.state.clientAccount || 'No active client profile'}</p>
                            <p className="wallet-copy">{this.state.clientWallet || 'Wallet not connected yet'}</p>
                            <Button basic inverted size="small" className="client-logout-btn" onClick={this.handleLogout}>
                                Logout
                            </Button>
                        </div>
                    </section>

                    {this.state.errorMessage ? <Message error content={this.state.errorMessage} /> : null}
                    {this.state.successMessage ? <Message success content={this.state.successMessage} /> : null}

                    <section className="checkout-grid">
                        <article className="info-card">
                            <span className="section-kicker">Event Snapshot</span>
                            <h3>Purchase Insights</h3>
                            <div className="insight-grid">
                                <div className="insight-item"><span>Available</span><strong>{availableTickets}</strong></div>
                                <div className="insight-item"><span>Sold</span><strong>{this.props.ticketsSold}</strong></div>
                                <div className="insight-item"><span>Capacity</span><strong>{this.props.ticketSupply}</strong></div>
                                <div className="insight-item"><span>Contract</span><strong className="mono">{this.props.contractAddress}</strong></div>
                            </div>
                        </article>

                        <article className="checkout-card">
                            <span className="section-kicker">Checkout</span>
                            <h3>Buy Tickets</h3>
                            <p className="checkout-note">
                                <Icon name="check circle" /> Secure on-chain purchase and instant QR ticket issuance.
                            </p>
                            <Input
                                type="number"
                                min="1"
                                value={this.state.quantity}
                                onChange={(event) => this.setState({ quantity: event.target.value })}
                                fluid
                                label="Qty"
                                labelPosition="left"
                            />
                            <Button className="tm-btn" onClick={this.handleAddToCart} fluid>
                                Add to Cart
                            </Button>
                            <p className="cart-row">Cart quantity: <strong>{this.state.cartQuantity}</strong></p>
                            <Button loading={this.state.loading} onClick={this.handleCheckout} primary fluid className="tm-btn checkout-btn">
                                Checkout
                            </Button>
                        </article>
                    </section>

                    <section className="tickets-rail">
                        <div className="tickets-head">
                            <span className="section-kicker">My Tickets</span>
                            <h3>QR Ticket Wallet</h3>
                        </div>
                        <div className="tickets-grid">
                            {this.renderTicketQrCards()}
                        </div>
                    </section>
                </div>

                <style jsx>{`
                    .tm-client-page { display: flex; flex-direction: column; gap: 14px; font-family: 'Nunito Sans', sans-serif; }
                    .hero-panel {
                        display: grid;
                        grid-template-columns: 1.2fr 0.8fr;
                        gap: 16px;
                        padding: 24px;
                        border-radius: 24px;
                        background: radial-gradient(circle at top right, rgba(0, 185, 242, 0.24), transparent 30%), linear-gradient(125deg, #00112c 0%, #002d72 55%, #026cdf 100%);
                        color: white;
                        box-shadow: 0 24px 44px rgba(0, 32, 96, 0.2);
                    }
                    .kicker, .section-kicker { display: inline-block; margin-bottom: 8px; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.11em; font-weight: 800; color: #7dd3fc; }
                    .hero-copy h1 { margin: 0 0 8px; font-family: 'Barlow Condensed', sans-serif; font-size: 2.7rem; text-transform: uppercase; letter-spacing: 0.03em; }
                    .hero-copy p { margin: 0 0 10px; color: #dbeafe; line-height: 1.6; }
                    .hero-tags { display: flex; flex-wrap: wrap; gap: 8px; }
                    .tag { border-radius: 999px; border: 1px solid rgba(191, 219, 254, 0.45); background: rgba(15, 23, 42, 0.28); padding: 6px 10px; font-size: 0.74rem; font-weight: 700; }
                    .hero-side { border-radius: 18px; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(2, 23, 60, 0.42); padding: 16px; }
                    .side-label { margin: 0; color: #bae6fd; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; }
                    .hero-side h2 { margin: 8px 0 4px; font-family: 'Barlow Condensed', sans-serif; font-size: 2.6rem; }
                    .side-copy { margin: 0 0 10px; color: #dbeafe; }
                    .wallet-copy { margin: 0; color: #e2e8f0; font-size: 0.8rem; word-break: break-word; }
                    :global(.client-logout-btn.ui.button) { margin-top: 10px; border-radius: 999px !important; font-weight: 800 !important; letter-spacing: 0.04em; }
                    .checkout-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 12px; }
                    .info-card, .checkout-card, .tickets-rail {
                        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                        border: 1px solid #dbeafe;
                        border-radius: 20px;
                        padding: 16px;
                        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
                    }
                    .info-card h3, .checkout-card h3, .tickets-head h3 { margin: 0 0 10px; color: #0f172a; font-family: 'Barlow Condensed', sans-serif; font-size: 1.8rem; text-transform: uppercase; letter-spacing: 0.03em; }
                    .insight-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
                    .insight-item { border: 1px solid #e2e8f0; border-radius: 14px; background: white; padding: 10px; }
                    .insight-item span { display: block; color: #64748b; font-size: 0.74rem; text-transform: uppercase; margin-bottom: 4px; }
                    .insight-item strong { color: #0f172a; font-size: 0.92rem; }
                    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; word-break: break-all; font-size: 0.78rem !important; }
                    .checkout-note { color: #334155; margin: 0 0 10px; font-size: 0.88rem; }
                    .cart-row { margin: 10px 0; color: #334155; }
                    :global(.tm-btn.ui.button) { border-radius: 14px !important; font-weight: 800 !important; letter-spacing: 0.04em; text-transform: uppercase; margin-top: 8px; }
                    :global(.checkout-btn.ui.button) { background: linear-gradient(90deg, #002060 0%, #026cdf 100%) !important; }
                    .tickets-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
                    .qr-card { border: 1px solid #dbe4f0; border-radius: 16px; background: white; padding: 12px; }
                    .qr-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
                    .qr-card-head h4 { margin: 0; color: #0f172a; font-family: 'Barlow Condensed', sans-serif; font-size: 1.4rem; }
                    .ticket-pill { border-radius: 999px; padding: 4px 9px; background: #dcfce7; color: #166534; font-size: 0.7rem; font-weight: 800; }
                    .owner-row { margin: 0 0 8px; color: #334155; font-size: 0.84rem; word-break: break-all; }
                    .qr-wrap { margin-bottom: 8px; }
                    .payload-copy { margin: 0 0 8px; color: #64748b; font-size: 0.76rem; line-height: 1.45; word-break: break-all; }
                    .copied-pill { margin-left: 8px; color: #059669; font-weight: 700; font-size: 0.8rem; }
                    .empty-tickets { margin: 0; color: #64748b; padding: 8px; }
                    @media (max-width: 980px) { .hero-panel, .checkout-grid, .tickets-grid { grid-template-columns: 1fr; } .insight-grid { grid-template-columns: 1fr; } }
                `}</style>
            </Layout>
        );
    }
}

export default ClientEventShow;
