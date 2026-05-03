import React, { Component } from 'react';
import { Button, Icon } from 'semantic-ui-react';
import Layout from '../../components/layout';
import Event from '../../ethereum/event';
import web3 from '../../ethereum/web3';
import { Link } from '../../routes';
import { getClientSession } from '../../ethereum/clientSession';
import { persistClientTransaction } from '../../ethereum/clientTransactions';
import { createTicketBarcodeValue } from '../../ethereum/ticketBarcode';
import { persistAuditLog } from '../../ethereum/auditLog';
import { upsertStoredClientTickets } from '../../ethereum/clientTickets';
import { fetchEthUsdRate, formatEthFromWei, formatUsdFromWei, multiplyWeiAmount } from '../../utils/ethPricing';
import TopAlertStack from '../../components/topAlertStack';

class EventCheckoutPage extends Component {
    static async getInitialProps(props) {
        const event = Event(props.query.address);
        const summary = await event.methods.getEventDetails().call();
        const requestedQuantity = parseInt(props.query.quantity, 10) || 0;

        return {
            name: summary[0],
            ticketPrice: summary[1].toString(),
            ticketSupply: summary[2].toString(),
            ticketsSold: summary[3].toString(),
            description: summary[4] || '',
            eventDate: summary[5] || '',
            contractAddress: props.query.address,
            requestedQuantity
        };
    }

    state = {
        loading: false,
        errorMessage: '',
        successMessage: '',
        statusMessage: '',
        statusHeader: '',
        clientAccount: '',
        clientWallet: '',
        ethUsdRate: null,
        completedTicketIds: []
    };

    async componentDidMount() {
        const session = getClientSession();
        const ethUsdRate = await fetchEthUsdRate();
        this.setState({
            clientAccount: session.clientAccount,
            clientWallet: session.clientWallet,
            ethUsdRate
        });
    }

    formatCheckoutError = (error) => {
        const rawMessage = error?.message || 'Unable to complete checkout right now.';

        if (rawMessage.includes('User denied')) {
            return 'The payment was cancelled in MetaMask before it was confirmed.';
        }

        if (rawMessage.toLowerCase().includes('insufficient funds')) {
            return 'The connected wallet does not have enough ETH to cover this purchase and gas fees.';
        }

        if (rawMessage.includes('Internal JSON-RPC error')) {
            return 'Wallet or local blockchain returned a generic RPC error. Verify MetaMask is connected to the expected local network and try again.';
        }

        return rawMessage;
    };

    logClientAudit = ({ action, status, details = {} }) => {
        const session = getClientSession();
        const profile = session.clientProfile || {};

        persistAuditLog({
            actorName: profile.name || profile.username || profile.email || session.clientAccount || 'Client',
            actorRole: 'client',
            actorId: session.clientId || session.clientIdentity || session.clientAccount || '',
            walletAddress: session.clientWallet || '',
            action,
            status,
            entityType: 'event',
            entityId: this.props.contractAddress,
            route: `/events/${this.props.contractAddress}/checkout`,
            details
        });
    };

    handlePay = async () => {
        const cartQuantity = parseInt(this.props.requestedQuantity, 10) || 0;

        this.setState({
            loading: true,
            errorMessage: '',
            successMessage: '',
            statusHeader: 'Payment status',
            statusMessage: 'Preparing checkout and checking your wallet connection.'
        });

        const event = Event(this.props.contractAddress);

        try {
            if (!window.ethereum) {
                throw new Error('Install MetaMask to complete checkout.');
            }

            const session = getClientSession();
            if (!session.clientIdentity) {
                throw new Error('Login as a client before purchasing tickets.');
            }

            if (!cartQuantity) {
                throw new Error('Choose at least one ticket before opening checkout.');
            }

            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const accounts = await web3.eth.getAccounts();
            if (!accounts.length) {
                throw new Error('No wallet account found. Connect MetaMask first.');
            }

            const buyerAddress = accounts[0];
            const profile = session.clientProfile || {};
            const purchaserId = session.clientAccount || '';
            const purchaserClientId = session.clientIdentity;
            const available = parseInt(this.props.ticketSupply, 10) - parseInt(this.props.ticketsSold, 10);

            if (cartQuantity > available) {
                throw new Error('Requested quantity exceeds available tickets.');
            }

            this.setState({
                statusMessage: `Wallet connected. Confirm ${cartQuantity} ticket payment${cartQuantity > 1 ? 's' : ''} in MetaMask to finish checkout.`
            });

            const newTickets = [];
            const purchaseTimestamp = new Date().toISOString();

            for (let i = 0; i < cartQuantity; i += 1) {
                this.setState({
                    statusMessage: `Processing payment ${i + 1} of ${cartQuantity}. MetaMask may prompt for confirmation.`
                });

                const result = await event.methods.buyTicket().send({
                    from: buyerAddress,
                    value: this.props.ticketPrice
                });

                const ticketId = result.events.TicketPurchased.returnValues.ticketId;
                const barcodeValue = createTicketBarcodeValue(ticketId);

                newTickets.push({
                    ticketId: ticketId.toString(),
                    barcodeValue,
                    buyerAddress,
                    eventAddress: this.props.contractAddress,
                    issuedAt: purchaseTimestamp,
                    purchaserClientId,
                    purchaserId,
                    purchaserName: profile.name || purchaserId
                });

                persistClientTransaction({
                    eventAddress: this.props.contractAddress,
                    eventName: this.props.name || 'Unnamed Event',
                    qty: 1,
                    ethPaidWei: this.props.ticketPrice.toString(),
                    txHash: result.transactionHash || '',
                    purchasedAt: purchaseTimestamp,
                    purchaserClientId,
                    purchaserId
                });

                this.setState({
                    statusMessage: `Payment ${i + 1} of ${cartQuantity} confirmed. Ticket #${ticketId} has been issued.`
                });
            }

            upsertStoredClientTickets(this.props.contractAddress, newTickets, session);
            window.localStorage.setItem('clientWallet', buyerAddress);

            this.logClientAudit({
                action: 'Ticket purchase',
                status: 'success',
                details: {
                    eventName: this.props.name,
                    quantity: cartQuantity,
                    ticketIds: newTickets.map((ticket) => ticket.ticketId).join(', '),
                    walletAddress: buyerAddress
                }
            });

            this.setState({
                loading: false,
                successMessage: `Payment successful. Purchased ${cartQuantity} ticket(s).`,
                statusHeader: 'Purchase complete',
                statusMessage: `Your barcode ticket${cartQuantity > 1 ? 's are' : ' is'} now saved in this browser wallet and ready for entry.`,
                clientWallet: buyerAddress,
                completedTicketIds: newTickets.map((ticket) => ticket.ticketId.toString())
            });
        } catch (error) {
            const friendlyError = this.formatCheckoutError(error);

            this.logClientAudit({
                action: 'Ticket purchase',
                status: 'failed',
                details: {
                    eventName: this.props.name,
                    quantity: cartQuantity,
                    reason: friendlyError
                }
            });

            this.setState({
                loading: false,
                errorMessage: friendlyError,
                statusMessage: '',
                statusHeader: ''
            });
        }
    };

    render() {
        const availableTickets = Math.max(parseInt(this.props.ticketSupply, 10) - parseInt(this.props.ticketsSold, 10), 0);
        const totalCostWei = multiplyWeiAmount(this.props.ticketPrice, this.props.requestedQuantity);
        const ticketPriceEth = formatEthFromWei(this.props.ticketPrice);
        const ticketPriceUsd = formatUsdFromWei(this.props.ticketPrice, this.state.ethUsdRate);
        const totalCostEth = formatEthFromWei(totalCostWei);
        const totalCostUsd = formatUsdFromWei(totalCostWei, this.state.ethUsdRate);

        return (
            <Layout>
                <div className="tm-checkout-page">
                    <TopAlertStack
                        alerts={[
                            this.state.errorMessage ? {
                                id: 'checkout-error',
                                type: 'error',
                                header: 'Payment failed',
                                content: this.state.errorMessage,
                                onDismiss: () => this.setState({ errorMessage: '' })
                            } : null,
                            this.state.statusMessage ? {
                                id: 'checkout-status',
                                type: 'info',
                                header: this.state.statusHeader || 'Status',
                                content: this.state.statusMessage,
                                autoDismissMs: 0
                            } : null,
                            this.state.successMessage ? {
                                id: 'checkout-success',
                                type: 'success',
                                header: 'Purchase update',
                                content: this.state.successMessage,
                                onDismiss: () => this.setState({ successMessage: '' })
                            } : null
                        ]}
                    />
                    <section className="hero-panel">
                        <div className="hero-copy">
                            <span className="kicker">Secure Checkout</span>
                            <h1>{this.props.name || 'Unnamed Event'}</h1>
                            <p>{this.props.description || 'Review your event order and complete payment from one dedicated checkout page.'}</p>
                            <div className="hero-tags">
                                <span className="tag">{this.props.eventDate || 'Date TBD'}</span>
                                <span className="tag">{availableTickets} LEFT</span>
                                <span className="tag">{this.props.requestedQuantity} IN CART</span>
                            </div>
                        </div>
                        <div className="hero-side">
                            <p className="side-label">Client Session</p>
                            <h2>{ticketPriceEth}</h2>
                            <p className="side-copy">{ticketPriceUsd} per ticket</p>
                            <p className="wallet-copy">{this.state.clientAccount || 'No active client profile'}</p>
                            <p className="wallet-copy">{this.state.clientWallet || 'Wallet not connected yet'}</p>
                        </div>
                    </section>

                    <section className="checkout-grid">
                        <article className="summary-card">
                            <span className="section-kicker">Order Summary</span>
                            <h3>Checkout Details</h3>
                            <div className="summary-grid">
                                <div className="summary-item">
                                    <span>Quantity</span>
                                    <strong>{this.props.requestedQuantity || 0}</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Price Each</span>
                                    <strong>{ticketPriceEth}</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Total Value</span>
                                    <strong>{totalCostEth}</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Contract</span>
                                    <strong className="mono">{this.props.contractAddress}</strong>
                                </div>
                            </div>
                            <p className="ticket-summary">{ticketPriceUsd} each • {totalCostUsd} total</p>
                            {this.state.completedTicketIds.length ? (
                                <p className="ticket-summary">Issued tickets: {this.state.completedTicketIds.join(', ')}</p>
                            ) : null}
                        </article>

                        <article className="payment-card">
                            <span className="section-kicker">Payment</span>
                            <h3>Complete Purchase</h3>
                            <p className="payment-note">
                                <Icon name="credit card outline" /> Pay with MetaMask to buy your selected ticket quantity.
                            </p>
                            <Button
                                loading={this.state.loading}
                                onClick={this.handlePay}
                                primary
                                fluid
                                className="tm-btn pay-btn"
                                disabled={!this.props.requestedQuantity}
                            >
                                Pay
                            </Button>
                            <div className="action-row">
                                <Link route={`/events/${this.props.contractAddress}/client`} legacyBehavior>
                                    <a><Button basic color="blue" fluid className="tm-btn secondary-btn">Back to Event</Button></a>
                                </Link>
                                <Link route="/client/tickets" legacyBehavior>
                                    <a><Button basic color="teal" fluid className="tm-btn secondary-btn">My Tickets</Button></a>
                                </Link>
                            </div>
                        </article>
                    </section>
                </div>

                <style jsx>{`
                    .tm-checkout-page { display: flex; flex-direction: column; gap: 14px; font-family: 'Nunito Sans', sans-serif; }
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
                    .checkout-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 12px; }
                    .summary-card, .payment-card {
                        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                        border: 1px solid #dbeafe;
                        border-radius: 20px;
                        padding: 16px;
                        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
                    }
                    .summary-card h3, .payment-card h3 { margin: 0 0 10px; color: #0f172a; font-family: 'Barlow Condensed', sans-serif; font-size: 1.8rem; text-transform: uppercase; letter-spacing: 0.03em; }
                    .summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
                    .summary-item { border: 1px solid #e2e8f0; border-radius: 14px; background: white; padding: 10px; }
                    .summary-item span { display: block; color: #64748b; font-size: 0.74rem; text-transform: uppercase; margin-bottom: 4px; }
                    .summary-item strong { color: #0f172a; font-size: 0.92rem; }
                    .ticket-summary { margin: 12px 0 0; color: #334155; font-size: 0.88rem; }
                    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; word-break: break-all; font-size: 0.78rem !important; }
                    .payment-note { color: #334155; margin: 0 0 10px; font-size: 0.88rem; }
                    .action-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
                    :global(.tm-btn.ui.button) { border-radius: 14px !important; font-weight: 800 !important; letter-spacing: 0.04em; text-transform: uppercase; margin-top: 8px; }
                    :global(.pay-btn.ui.button) { background: linear-gradient(90deg, #002060 0%, #026cdf 100%) !important; }
                    @media (max-width: 980px) { .hero-panel, .checkout-grid { grid-template-columns: 1fr; } .summary-grid, .action-row { grid-template-columns: 1fr; } }
                `}</style>
            </Layout>
        );
    }
}

export default EventCheckoutPage;
