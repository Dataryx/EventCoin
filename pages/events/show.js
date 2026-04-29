import React, { Component } from 'react';
import {
    Calendar, MapPin, Users, Wallet, Ticket as TicketIcon, ShieldCheck,
    QrCode, RefreshCw, ArrowRightLeft, ExternalLink, AlertCircle, Check, ChevronLeft
} from 'lucide-react';
import Layout from '../../components/layout';
import Event from '../../ethereum/event';
import { Link } from '../../routes';
import {
    Container, Section, Reveal, Card, Button, Badge, Divider
} from '../../components/ui';

const truncate = (a) => a && typeof a === 'string' ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;

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

    render() {
        const {
            name, ticketPrice, ticketSupply, ticketsSold, description,
            eventDate, owner, contractAddress
        } = this.props;
        const { errorMessage, successMessage } = this.state;

        const remaining = parseInt(ticketSupply, 10) - parseInt(ticketsSold, 10);

        const stats = [
            { label: 'Ticket price', value: ticketPrice, suffix: 'wei', mono: true },
            { label: 'Tickets remaining', value: remaining },
            { label: 'Tickets sold', value: ticketsSold }
        ];

        const actions = [
            { route: `/events/${contractAddress}/owners`, label: 'View owners', icon: Users },
            { route: `/events/${contractAddress}/validate`, label: 'Validate ticket QR', icon: QrCode },
            { route: `/events/${contractAddress}/useTicket`, label: 'Use a ticket', icon: TicketIcon },
            { route: `/events/${contractAddress}/refundTicket`, label: 'Request refund', icon: RefreshCw },
            { route: `/events/${contractAddress}/transferTicket`, label: 'Transfer ticket', icon: ArrowRightLeft },
            { route: `/events/${contractAddress}/client`, label: 'Open client view', icon: ExternalLink, variant: 'outline' }
        ];

        return (
            <Layout title={`${name || 'Event'} · Admin`}>
                <Section className="pt-10 pb-6">
                    <Container>
                        <Reveal>
                            <Link route="/admin/dashboard" legacyBehavior>
                                <a className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors group">
                                    <ChevronLeft size={14} strokeWidth={1.75} className="transition-transform group-hover:-translate-x-0.5" />
                                    Back to dashboard
                                </a>
                            </Link>
                        </Reveal>

                        <Reveal delay={0.05}>
                            <div className="mt-5 flex items-center gap-2">
                                <Badge tone="accent"><ShieldCheck size={11} /> Admin</Badge>
                                <Badge tone="outline">Event command center</Badge>
                            </div>
                        </Reveal>

                        <Reveal delay={0.08}>
                            <h1 className="font-serif text-display-lg text-fg mt-4 text-balance max-w-3xl tracking-tight">
                                {name || 'Untitled event'}
                            </h1>
                        </Reveal>

                        {description ? (
                            <Reveal delay={0.12}>
                                <p className="mt-4 text-[16px] text-muted max-w-2xl leading-relaxed">{description}</p>
                            </Reveal>
                        ) : null}

                        <Reveal delay={0.15}>
                            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-fg/80">
                                <span className="inline-flex items-center gap-1.5">
                                    <Calendar size={14} className="text-muted" />
                                    {eventDate || 'Not set'}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Wallet size={14} className="text-muted" />
                                    <span className="font-mono text-[12px]" title={owner}>{truncate(owner)}</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin size={13} className="text-muted shrink-0" />
                                    <span className="font-mono text-[12px] text-muted">{contractAddress}</span>
                                </span>
                            </div>
                        </Reveal>
                    </Container>
                </Section>

                <Section className="py-4">
                    <Container>
                        <div className="grid sm:grid-cols-3 gap-3">
                            {stats.map((s, i) => (
                                <Reveal key={s.label} delay={i * 0.05}>
                                    <Card className="p-5">
                                        <span className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">{s.label}</span>
                                        <div className="font-serif text-3xl text-fg mt-2 inline-flex items-baseline gap-2">
                                            <span className={s.mono ? 'font-mono text-2xl' : ''}>{s.value}</span>
                                            {s.suffix ? <span className="text-xs uppercase tracking-[0.18em] text-muted font-sans">{s.suffix}</span> : null}
                                        </div>
                                    </Card>
                                </Reveal>
                            ))}
                        </div>
                    </Container>
                </Section>

                <Section className="pt-2 pb-20">
                    <Container>
                        <Reveal>
                            <div className="mb-5">
                                <span className="text-[10px] tracking-[0.18em] uppercase text-muted font-medium">Operations</span>
                                <h2 className="font-serif text-2xl text-fg mt-1">Manage this event</h2>
                            </div>
                        </Reveal>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {actions.map((a, i) => {
                                const Icon = a.icon;
                                return (
                                    <Reveal key={a.label} delay={Math.min(i * 0.04, 0.18)}>
                                        <Link route={a.route} legacyBehavior>
                                            <a className="block group focus-ring rounded-lg">
                                                <Card interactive className="p-5">
                                                    <div className="flex items-start justify-between">
                                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                                                            <Icon size={16} strokeWidth={1.75} />
                                                        </span>
                                                        <span className="text-muted group-hover:text-accent transition-colors">→</span>
                                                    </div>
                                                    <h3 className="font-serif text-xl text-fg mt-5">{a.label}</h3>
                                                </Card>
                                            </a>
                                        </Link>
                                    </Reveal>
                                );
                            })}
                        </div>

                        {errorMessage ? (
                            <Card className="mt-6 p-4 border-danger/30 bg-danger/5">
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={15} className="text-danger mt-0.5" strokeWidth={1.75} />
                                    <p className="text-sm text-fg"><span className="font-medium">Oops! </span>{errorMessage}</p>
                                </div>
                            </Card>
                        ) : null}

                        {successMessage ? (
                            <Card className="mt-6 p-4 border-accent/30 bg-accent/5">
                                <div className="flex items-start gap-2">
                                    <Check size={15} className="text-accent mt-0.5" strokeWidth={1.75} />
                                    <p className="text-sm text-fg"><span className="font-medium">Success! </span>{successMessage}</p>
                                </div>
                            </Card>
                        ) : null}
                    </Container>
                </Section>
            </Layout>
        );
    }
}

export default EventShow;
