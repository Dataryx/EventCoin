import React, { Component } from 'react' ;
import {Form,Button,Input,Message} from 'semantic-ui-react';
import Layout from '../../components/layout';
import { contractAddress, createEventInstance } from '../../ethereum/factory';
import web3 from '../../ethereum/web3';
import { Router } from '../../routes';

class EventNew extends Component {
    state = {
        eventName: '',
        eventDescription: '',
        eventDate: '',
        ticketPrice: '',
        ticketSupply: '',
        errorMessage: '',
        loading: false
    };

    onSubmit = async (event) =>  {
        event.preventDefault();
        this.setState({loading:true,errorMessage:''});
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
                throw new Error('Ticket price must be a positive number in wei.');
            }
            if (!Number.isInteger(ticketSupply) || ticketSupply <= 0) {
                throw new Error('Ticket supply must be a positive integer.');
            }
            // Event constructor initializes each ticket in a loop; very large supply can exceed gas.
            if (ticketSupply > 1000) {
                throw new Error('Ticket supply is too large for one transaction. Use 1000 or less.');
            }

            const accounts = await web3.eth.getAccounts();
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

            try {
                const modernMethod = createEventInstance.methods
                .createEvent(
                    this.state.eventName,
                    this.state.eventDescription,
                    this.state.eventDate,
                    ticketPrice.toString(),
                    ticketSupply.toString()
                );
                estimatedGas = await modernMethod.estimateGas({ from: accounts[0] });
                methodToSend = modernMethod;
            } catch (modernEstimateError) {
                try {
                    const legacyMethod = legacyCreateEvent.methods
                        .createEvent(this.state.eventName, ticketPrice.toString(), ticketSupply.toString());
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

            await methodToSend.send({ from: accounts[0], gas: safeGas });
            Router.pushRoute('/admin/dashboard');
        } catch (err) {
            let friendlyError = err.message;
            if (friendlyError.includes('VM Exception while processing transaction: revert')) {
                friendlyError = 'Transaction reverted. Common causes: ticket supply too high, invalid price/supply, or contract version mismatch. Try smaller supply (<=1000) and retry.';
            }
            if (friendlyError.toLowerCase().includes('exceeds block gas limit')) {
                friendlyError = 'Transaction gas exceeds current network block limit. Reduce ticket supply and retry (try 50-200 first), or increase Ganache block gas limit.';
            }
            this.setState({ errorMessage: friendlyError });
        }
        this.setState({loading:false});
    };

    render() {
        return (
            <Layout>
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
                            label="wei" 
                            labelPosition="right"
                            value={this.state.ticketPrice}
                            onChange={event => this.setState({ ticketPrice: event.target.value})}
                        />
                    </Form.Field>
                    <Form.Field>
                        <label>Ticket Supply</label>
                        <Input
                            value={this.state.ticketSupply}
                            onChange={event => this.setState({ ticketSupply: event.target.value})}
                        />
                    </Form.Field>
                    <Message error header="Oops!" content={this.state.errorMessage} />
                    <Button loading={this.state.loading} primary>Create!</Button>
                </Form>
            </Layout>
        );
    }
}

export default EventNew
