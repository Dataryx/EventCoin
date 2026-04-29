import React, { Component } from 'react';
import { ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { contractAddress, getDeployedEventsInstance } from '../../ethereum/factory';
import AdminShell from '../../components/adminShell';
import { Link } from '../../routes';
import {
    Card, Button, Reveal, EmptyState
} from '../../components/ui';

class TicketValidationPage extends Component {
    static async getInitialProps() {
        if (!contractAddress || !getDeployedEventsInstance) {
            return { events: [], loadError: 'Set NEXT_PUBLIC_DIAMOND_ADDRESS in .env to load deployed events.' };
        }
        try {
            const events = await getDeployedEventsInstance.methods.getDeployedEvents().call();
            return { events, loadError: '' };
        } catch (error) {
            return { events: [], loadError: 'Unable to load events from blockchain right now.' };
        }
    }

    state = { adminAccount: '' };

    componentDidMount() {
        this.setState({ adminAccount: window.localStorage.getItem('adminAccount') || '' });
    }

    render() {
        return (
            <AdminShell
                activeRoute="/admin/ticket-validation"
                title="Ticket validation"
                subtitle="Validation is event-specific. Choose one event to begin."
                walletAddress={this.state.adminAccount}
                heroTitle="Validation queue"
                heroDescription="Each link opens a dedicated validation page scoped to one event contract."
            >
                <Reveal>
                    <Card className="p-5 sm:p-6">
                        <h3 className="font-serif text-xl text-fg mb-5">Event validation links</h3>
                        {this.props.events.length === 0 ? (
                            <EmptyState
                                icon={ShieldCheck}
                                title="No events to validate"
                                description="Create an event first to enable validation."
                            />
                        ) : (
                            <ul className="divide-y divide-border -mx-1">
                                {this.props.events.map((address, i) => (
                                    <Reveal key={address} delay={Math.min(i * 0.03, 0.15)}>
                                        <li className="flex items-center justify-between gap-3 py-3 px-1">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent">
                                                    <ShieldCheck size={14} strokeWidth={1.75} />
                                                </span>
                                                <span className="font-mono text-[12px] text-fg truncate">{address}</span>
                                            </div>
                                            <Link route={`/events/${address}/validate`} legacyBehavior>
                                                <a>
                                                    <Button size="sm" rightIcon={<ArrowRight size={13} strokeWidth={2} />}>Validate</Button>
                                                </a>
                                            </Link>
                                        </li>
                                    </Reveal>
                                ))}
                            </ul>
                        )}
                    </Card>
                </Reveal>

                {this.props.loadError ? (
                    <Card className="mt-6 p-4 border-danger/30 bg-danger/5">
                        <div className="flex items-start gap-2">
                            <AlertCircle size={15} className="text-danger mt-0.5" strokeWidth={1.75} />
                            <p className="text-sm text-fg">{this.props.loadError}</p>
                        </div>
                    </Card>
                ) : null}
            </AdminShell>
        );
    }
}

export default TicketValidationPage;
