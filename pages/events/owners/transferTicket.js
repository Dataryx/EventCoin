import React, { Component } from 'react';
import { ChevronLeft, AlertCircle, ArrowRightLeft } from 'lucide-react';
import Layout from '../../../components/layout';
import Event from '../../../ethereum/event';
import web3 from '../../../ethereum/web3';
import { Link, Router } from '../../../routes';
import {
    Container, Section, Reveal, Card, Button, Input, Field
} from '../../../components/ui';

class TransferTicket extends Component {
    static async getInitialProps(props) {
        return { contractAddress: props.query.address };
    }

    state = { ticketId: '', newOwner: '', errorMessage: '', loading: false };

    onSubmit = async (event) => {
        event.preventDefault();
        this.setState({ loading: true, errorMessage: '' });
        const eventInstance = Event(this.props.contractAddress);

        try {
            const accounts = await web3.eth.getAccounts();
            const result = await eventInstance.methods
                .transferTicket(this.state.ticketId, this.state.newOwner)
                .send({ from: accounts[0], gas: 300000 });

            const transferEvent = result.events.TicketTransferred;
            const successMessage = `Ticket transferred successfully! Ticket ID: ${transferEvent.returnValues.ticketId} transferred from : ${transferEvent.returnValues.from} to ${transferEvent.returnValues.to}`;
            Router.pushRoute(`/events/${this.props.contractAddress}?successMessage=${encodeURIComponent(successMessage)}`);
        } catch (err) {
            const errorMessage = err.message.includes('revert') ? 'You do not own this ticket' : err.message;
            this.setState({ errorMessage });
        }
        this.setState({ loading: false });
    };

    render() {
        return (
            <Layout title="Transfer ticket">
                <Section className="pt-10 pb-20">
                    <Container className="max-w-xl">
                        <Reveal>
                            <Link route={`/events/${this.props.contractAddress}`} legacyBehavior>
                                <a className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors group">
                                    <ChevronLeft size={14} strokeWidth={1.75} className="transition-transform group-hover:-translate-x-0.5" />
                                    Back to event
                                </a>
                            </Link>
                        </Reveal>
                        <Reveal delay={0.05}>
                            <h1 className="font-serif text-display-md text-fg mt-5 tracking-tight">Transfer a ticket</h1>
                        </Reveal>
                        <Reveal delay={0.1}>
                            <p className="mt-3 text-[15px] text-muted">Reassign ticket ownership to another wallet.</p>
                        </Reveal>
                        <Reveal delay={0.15}>
                            <Card className="mt-8 p-6">
                                <form onSubmit={this.onSubmit} className="flex flex-col gap-5">
                                    <Field label="Ticket ID">
                                        <Input
                                            className="font-mono"
                                            value={this.state.ticketId}
                                            onChange={(e) => this.setState({ ticketId: e.target.value })}
                                            placeholder="e.g. 42"
                                            required
                                        />
                                    </Field>
                                    <Field label="New owner address">
                                        <Input
                                            className="font-mono"
                                            value={this.state.newOwner}
                                            onChange={(e) => this.setState({ newOwner: e.target.value })}
                                            placeholder="0x…"
                                            required
                                        />
                                    </Field>
                                    {this.state.errorMessage ? (
                                        <div className="rounded-md border border-danger/30 bg-danger/5 p-3 flex items-start gap-2">
                                            <AlertCircle size={14} className="text-danger mt-0.5" strokeWidth={1.75} />
                                            <p className="text-sm text-fg">{this.state.errorMessage}</p>
                                        </div>
                                    ) : null}
                                    <Button
                                        as="button"
                                        type="submit"
                                        loading={this.state.loading}
                                        leftIcon={<ArrowRightLeft size={15} strokeWidth={1.75} />}
                                        className="self-start"
                                    >
                                        Transfer ticket
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

export default TransferTicket;
