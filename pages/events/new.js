import React, { Component } from 'react';
import { ChevronLeft, Calendar, AlertCircle, Plus } from 'lucide-react';
import Layout from '../../components/layout';
import { contractAddress, createEventInstance } from '../../ethereum/factory';
import web3 from '../../ethereum/web3';
import { Link, Router } from '../../routes';
import {
    Container, Section, Reveal, Card, Button, Input, Field, Textarea
} from '../../components/ui';

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

    onSubmit = async (event) => {
        event.preventDefault();
        this.setState({ loading: true, errorMessage: '' });
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
        this.setState({ loading: false });
    };

    set = (key) => (e) => this.setState({ [key]: e.target.value });

    render() {
        return (
            <Layout title="Create event">
                <Section className="pt-10 pb-20">
                    <Container className="max-w-2xl">
                        <Reveal>
                            <Link route="/admin/dashboard" legacyBehavior>
                                <a className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors group">
                                    <ChevronLeft size={14} strokeWidth={1.75} className="transition-transform group-hover:-translate-x-0.5" />
                                    Back to dashboard
                                </a>
                            </Link>
                        </Reveal>
                        <Reveal delay={0.05}>
                            <h1 className="font-serif text-display-md text-fg mt-5 tracking-tight">
                                Create an event
                            </h1>
                        </Reveal>
                        <Reveal delay={0.1}>
                            <p className="mt-3 text-[15px] text-muted">
                                Mints a new event contract. Tickets become available immediately after the transaction confirms.
                            </p>
                        </Reveal>

                        <Reveal delay={0.15}>
                            <Card className="mt-8 p-6 sm:p-8">
                                <form onSubmit={this.onSubmit} className="flex flex-col gap-5">
                                    <Field label="Event name">
                                        <Input
                                            value={this.state.eventName}
                                            onChange={this.set('eventName')}
                                            placeholder="e.g. Midnight Garden, Vol. III"
                                            required
                                        />
                                    </Field>

                                    <Field label="Description" hint="Shown to attendees on the storefront">
                                        <Textarea
                                            value={this.state.eventDescription}
                                            onChange={this.set('eventDescription')}
                                            placeholder="Set the tone, name the venue, drop the dress code…"
                                            rows={4}
                                        />
                                    </Field>

                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <Field label="Date">
                                            <div className="relative">
                                                <Input
                                                    type="date"
                                                    value={this.state.eventDate}
                                                    onChange={this.set('eventDate')}
                                                />
                                                <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                                            </div>
                                        </Field>
                                        <Field label="Ticket price (wei)">
                                            <Input
                                                value={this.state.ticketPrice}
                                                onChange={this.set('ticketPrice')}
                                                placeholder="100000000000000000"
                                                inputMode="numeric"
                                                className="font-mono"
                                            />
                                        </Field>
                                    </div>

                                    <Field label="Ticket supply" hint="Cap at 1,000 to stay within block gas limits">
                                        <Input
                                            value={this.state.ticketSupply}
                                            onChange={this.set('ticketSupply')}
                                            placeholder="200"
                                            inputMode="numeric"
                                            className="font-mono"
                                        />
                                    </Field>

                                    {this.state.errorMessage ? (
                                        <div className="rounded-md border border-danger/30 bg-danger/5 p-3 flex items-start gap-2">
                                            <AlertCircle size={14} className="text-danger mt-0.5 shrink-0" strokeWidth={1.75} />
                                            <p className="text-sm text-fg">{this.state.errorMessage}</p>
                                        </div>
                                    ) : null}

                                    <Button
                                        as="button"
                                        type="submit"
                                        size="lg"
                                        loading={this.state.loading}
                                        leftIcon={<Plus size={15} strokeWidth={2} />}
                                        className="self-start"
                                    >
                                        Create event
                                    </Button>
                                </form>
                            </Card>
                        </Reveal>
                    </Container>
                </Section>
            </Layout>
        );
    }
}

export default EventNew;
