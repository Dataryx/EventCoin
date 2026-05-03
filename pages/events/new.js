import React, { Component } from 'react' ;
import {Form,Button,Input} from 'semantic-ui-react';
import Layout from '../../components/layout';
import { contractAddress, createEventInstance } from '../../ethereum/factory';
import web3 from '../../ethereum/web3';
import { Router } from '../../routes';
import { persistAuditLog } from '../../ethereum/auditLog';
import { convertEthToWei, fetchEthUsdRate, formatUsdValue } from '../../utils/ethPricing';
import TopAlertStack from '../../components/topAlertStack';

class EventNew extends Component {
    state = {
        eventName: '',
        eventDescription: '',
        eventDate: '',
        ticketPrice: '',
        ticketSupply: '',
        ethUsdRate: null,
        errorMessage: '',
        successMessage: '',
        statusMessage: '',
        loading: false
    };

    async componentDidMount() {
        const ethUsdRate = await fetchEthUsdRate();
        this.setState({ ethUsdRate });
    }

    formatCreateEventError = (error) => {
        const message = error?.message || 'Unable to create the event right now.';

        if (message.includes('User denied')) {
            return 'The event creation transaction was cancelled in MetaMask.';
        }

        if (message.toLowerCase().includes('insufficient funds')) {
            return 'The connected wallet does not have enough ETH to pay for the create-event transaction gas.';
        }

        return message;
    };

    logEventAudit = ({ status, details = {}, entityId = '' }) => {
        const adminAccount = typeof window !== 'undefined'
            ? (window.localStorage.getItem('adminAccount') || 'Admin')
            : 'Admin';

        persistAuditLog({
            actorName: adminAccount,
            actorRole: 'admin',
            actorId: adminAccount,
            action: 'Event creation',
            status,
            entityType: 'event',
            entityId,
            route: '/events/new',
            details
        });
    };

    onSubmit = async (event) =>  {
        event.preventDefault();
        this.setState({
            loading: true,
            errorMessage: '',
            successMessage: '',
            statusMessage: 'Checking the event form, wallet, and deployed contract configuration.'
        });
        try {
            if (!contractAddress || !createEventInstance) {
                throw new Error('Set NEXT_PUBLIC_DIAMOND_ADDRESS in .env before creating events.');
            }

            const ticketPrice = Number(this.state.ticketPrice);
            const ticketSupply = Number(this.state.ticketSupply);

            if (!this.state.eventName.trim()) {
                throw new Error('Event name is required.');
            }
            if (!Number.isFinite(ticketPrice) || ticketPrice <= 0) {
                throw new Error('Ticket price must be a positive ETH amount.');
            }
            if (!Number.isInteger(ticketSupply) || ticketSupply <= 0) {
                throw new Error('Ticket supply must be a positive integer.');
            }
            // Event constructor initializes each ticket in a loop; very large supply can exceed gas.
            if (ticketSupply > 1000) {
                throw new Error('Ticket supply is too large for one transaction. Use 1000 or less.');
            }

            const ticketPriceWei = convertEthToWei(this.state.ticketPrice);

            const accounts = await web3.eth.getAccounts();
            if (!accounts.length) {
                throw new Error('Connect a wallet in MetaMask before creating an event.');
            }
            const chainId = await web3.eth.getChainId();
            const codeAtAddress = await web3.eth.getCode(contractAddress);
            if (!codeAtAddress || codeAtAddress === '0x') {
                throw new Error(`No contract found at NEXT_PUBLIC_DIAMOND_ADDRESS on chain ${chainId}. Check your .env address and MetaMask network.`);
            }

            const legacyCreateEvent = new web3.eth.Contract(
                [
                    {
                        inputs: [
                            { internalType: 'string', name: 'name', type: 'string' },
                            { internalType: 'uint256', name: 'ticketPrice', type: 'uint256' },
                            { internalType: 'uint256', name: 'ticketSupply', type: 'uint256' }
                        ],
                        name: 'createEvent',
                        outputs: [],
                        stateMutability: 'nonpayable',
                        type: 'function'
                    }
                ],
                contractAddress
            );

            // Determine which signature is actually available on the deployed contract by estimating gas first.
            let methodToSend = null;
            let estimatedGas = null;

            this.setState({
                statusMessage: 'Connected contract found. Estimating gas and checking the available create-event method.'
            });

            try {
                const modernMethod = createEventInstance.methods
                .createEvent(
                    this.state.eventName,
                    this.state.eventDescription,
                    this.state.eventDate,
                    ticketPriceWei,
                    ticketSupply.toString()
                );
                estimatedGas = await modernMethod.estimateGas({ from: accounts[0] });
                methodToSend = modernMethod;
            } catch (modernEstimateError) {
                try {
                    const legacyMethod = legacyCreateEvent.methods
                        .createEvent(this.state.eventName, ticketPriceWei, ticketSupply.toString());
                    estimatedGas = await legacyMethod.estimateGas({ from: accounts[0] });
                    methodToSend = legacyMethod;
                } catch (legacyEstimateError) {
                    throw new Error(
                        `CreateEvent failed on both ABI versions on chain ${chainId}. ` +
                        `This usually means the connected network does not match your deployed diamond address, ` +
                        `or the CreateEvent facet is not deployed/upgraded on this contract.`
                    );
                }
            }

            const latestBlock = await web3.eth.getBlock('latest');
            const blockGasLimit = Number(latestBlock.gasLimit || 0);
            const gasWithBuffer = Math.ceil(Number(estimatedGas) * 1.2);
            const safeGas = Math.min(gasWithBuffer, Math.max(blockGasLimit - 100000, 0));

            if (!safeGas || safeGas <= 21000) {
                throw new Error('Unable to compute safe gas for createEvent transaction.');
            }

            this.setState({
                statusMessage: 'Submitting the event creation transaction. Confirm it in MetaMask to deploy the event contract.'
            });

            const result = await methodToSend.send({ from: accounts[0], gas: safeGas });
            const createdEventAddress = result?.events?.EventCreated?.returnValues?.eventAddress;
            const successMessage = createdEventAddress
                ? `Event "${this.state.eventName}" created successfully. Contract: ${createdEventAddress}`
                : `Event "${this.state.eventName}" created successfully.`;

            this.setState({
                successMessage,
                statusMessage: 'Event created successfully. Redirecting to the admin events board.'
            });
            this.logEventAudit({
                status: 'success',
                entityId: createdEventAddress || this.state.eventName,
                details: {
                    eventName: this.state.eventName,
                    eventDate: this.state.eventDate,
                    ticketPriceEth: this.state.ticketPrice,
                    ticketPriceWei,
                    ticketSupply,
                    managerWallet: accounts[0],
                    eventAddress: createdEventAddress || ''
                }
            });
            Router.pushRoute(`/admin/events?successMessage=${encodeURIComponent(successMessage)}`);
        } catch (err) {
            let friendlyError = this.formatCreateEventError(err);
            if (friendlyError.includes('VM Exception while processing transaction: revert')) {
                friendlyError = 'Transaction reverted. Common causes: ticket supply too high, invalid price/supply, or contract version mismatch. Try smaller supply (<=1000) and retry.';
            }
            if (friendlyError.toLowerCase().includes('exceeds block gas limit')) {
                friendlyError = 'Transaction gas exceeds current network block limit. Reduce ticket supply and retry (try 50-200 first), or increase Ganache block gas limit.';
            }
            this.logEventAudit({
                status: 'failed',
                entityId: this.state.eventName || 'draft-event',
                details: {
                    eventName: this.state.eventName,
                    eventDate: this.state.eventDate,
                    ticketPriceEth: this.state.ticketPrice,
                    ticketSupply: this.state.ticketSupply,
                    reason: friendlyError
                }
            });
            this.setState({ errorMessage: friendlyError, statusMessage: '' });
        }
        this.setState({loading:false});
    };

    render() {
        return (
            <Layout>
                <TopAlertStack
                    alerts={[
                        this.state.statusMessage ? {
                            id: 'event-create-status',
                            type: 'info',
                            header: 'Creation status',
                            content: this.state.statusMessage,
                            autoDismissMs: 0
                        } : null,
                        this.state.successMessage ? {
                            id: 'event-create-success',
                            type: 'success',
                            header: 'Event created',
                            content: this.state.successMessage,
                            onDismiss: () => this.setState({ successMessage: '' })
                        } : null,
                        this.state.errorMessage ? {
                            id: 'event-create-error',
                            type: 'error',
                            header: 'Event creation failed',
                            content: this.state.errorMessage,
                            onDismiss: () => this.setState({ errorMessage: '' })
                        } : null
                    ]}
                />
                <h3>Create an Event</h3>

                <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
                    <Form.Field>
                        <label>Event Name</label>
                        <Input
                            value={this.state.eventName}
                            onChange={event => this.setState({ eventName: event.target.value})}
                        />
                    </Form.Field>
                    <Form.Field>
                        <label>Description</label>
                        <Input
                            value={this.state.eventDescription}
                            onChange={event => this.setState({ eventDescription: event.target.value})}
                        />
                    </Form.Field>
                    <Form.Field>
                        <label>Event Date</label>
                        <Input
                            type="date"
                            value={this.state.eventDate}
                            onChange={event => this.setState({ eventDate: event.target.value})}
                        />
                    </Form.Field>
                    <Form.Field>
                        <label>Ticket Price</label>
                        <Input 
                            label="ETH" 
                            labelPosition="right"
                            value={this.state.ticketPrice}
                            onChange={event => this.setState({ ticketPrice: event.target.value})}
                        />
                        <div style={{ marginTop: '6px', color: '#64748b', fontSize: '0.86rem' }}>
                            Approx. {this.state.ticketPrice && this.state.ethUsdRate ? formatUsdValue(Number(this.state.ticketPrice) * this.state.ethUsdRate) : 'USD preview unavailable'}
                        </div>
                    </Form.Field>
                    <Form.Field>
                        <label>Ticket Supply</label>
                        <Input
                            value={this.state.ticketSupply}
                            onChange={event => this.setState({ ticketSupply: event.target.value})}
                        />
                    </Form.Field>
                    <Button loading={this.state.loading} primary>Create!</Button>
                </Form>
            </Layout>
        );
    }
}

export default EventNew
