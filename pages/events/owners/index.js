import React, { Component } from 'react';
import { ChevronLeft, Wallet, Users } from 'lucide-react';
import Layout from '../../../components/layout';
import Event from '../../../ethereum/event';
import { Link } from '../../../routes';
import {
    Container, Section, Reveal, Card, Badge, EmptyState
} from '../../../components/ui';

class OwnersIndex extends Component {
    static async getInitialProps(props) {
        const event = Event(props.query.address);
        const owners = await event.methods.getTicketOwners().call();
        return { owners, contractAddress: props.query.address };
    }

    render() {
        const { owners, contractAddress } = this.props;
        return (
            <Layout title="Ticket owners">
                <Section className="pt-10 pb-6">
                    <Container>
                        <Reveal>
                            <Link route={`/events/${contractAddress}`} legacyBehavior>
                                <a className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors group">
                                    <ChevronLeft size={14} strokeWidth={1.75} className="transition-transform group-hover:-translate-x-0.5" />
                                    Back to event
                                </a>
                            </Link>
                        </Reveal>
                        <Reveal delay={0.05}>
                            <Badge tone="outline" className="mt-5"><Users size={11} /> Ticket holders</Badge>
                        </Reveal>
                        <Reveal delay={0.1}>
                            <h1 className="font-serif text-display-md text-fg mt-3 tracking-tight">
                                Owners
                            </h1>
                        </Reveal>
                        <Reveal delay={0.15}>
                            <p className="mt-3 text-[15px] text-muted max-w-xl">
                                {owners.length} address{owners.length === 1 ? '' : 'es'} currently hold tickets for this event.
                            </p>
                        </Reveal>
                    </Container>
                </Section>

                <Section className="pt-2 pb-20">
                    <Container>
                        {owners.length === 0 ? (
                            <EmptyState icon={Wallet} title="No owners yet" description="No tickets sold for this event." />
                        ) : (
                            <Card className="overflow-hidden">
                                <ul>
                                    {owners.map((address, i) => (
                                        <Reveal key={`${address}-${i}`} delay={Math.min(i * 0.02, 0.18)}>
                                            <li className={`flex items-center justify-between gap-4 px-5 py-4 ${i !== 0 ? 'border-t border-border' : ''}`}>
                                                <span className="inline-flex items-center gap-3">
                                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-medium">
                                                        {String(i + 1).padStart(2, '0')}
                                                    </span>
                                                    <span className="font-mono text-sm text-fg break-all">{address}</span>
                                                </span>
                                                <Badge tone="outline">Holder</Badge>
                                            </li>
                                        </Reveal>
                                    ))}
                                </ul>
                            </Card>
                        )}
                    </Container>
                </Section>
            </Layout>
        );
    }
}

export default OwnersIndex;
