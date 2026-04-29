import React, { Component } from 'react';
import { Search, Plus, ArrowRight, AlertCircle, Calendar } from 'lucide-react';
import { contractAddress, getDeployedEventsInstance } from '../../ethereum/factory';
import AdminShell from '../../components/adminShell';
import { Link } from '../../routes';
import {
    Card, Button, Badge, Reveal, Input, EmptyState
} from '../../components/ui';

class AdminEvents extends Component {
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

    state = { adminAccount: '', searchTerm: '', sortOrder: 'latest' };

    componentDidMount() {
        this.setState({ adminAccount: window.localStorage.getItem('adminAccount') || '' });
    }

    getFilteredEvents() {
        const { searchTerm, sortOrder } = this.state;
        let events = [...this.props.events];

        if (searchTerm.trim()) {
            const key = searchTerm.trim().toLowerCase();
            events = events.filter((address) => address.toLowerCase().includes(key));
        }
        events.sort((a, b) => (sortOrder === 'latest' ? b.localeCompare(a) : a.localeCompare(b)));
        return events;
    }

    render() {
        const events = this.getFilteredEvents();

        return (
            <AdminShell
                activeRoute="/admin/events"
                title="Events"
                subtitle="Every event contract discovered on-chain."
                walletAddress={this.state.adminAccount}
                topActions={
                    <Link route="/events/new" legacyBehavior>
                        <a>
                            <Button leftIcon={<Plus size={14} strokeWidth={2} />}>Create event</Button>
                        </a>
                    </Link>
                }
                heroTitle="Live event contracts"
                heroDescription={`${this.props.events.length} contract${this.props.events.length === 1 ? '' : 's'} discovered.`}
            >
                <Reveal>
                    <Card className="p-5 sm:p-6">
                        <div className="flex items-center gap-2 flex-wrap mb-5">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                                <Input
                                    placeholder="Search contract address"
                                    value={this.state.searchTerm}
                                    onChange={(e) => this.setState({ searchTerm: e.target.value })}
                                    className="pl-9 h-10 text-sm font-mono"
                                />
                            </div>
                            <select
                                value={this.state.sortOrder}
                                onChange={(e) => this.setState({ sortOrder: e.target.value })}
                                className="h-10 rounded-sm border border-border bg-surface px-3 text-sm text-fg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                            >
                                <option value="latest">Latest first</option>
                                <option value="oldest">Oldest first</option>
                            </select>
                        </div>

                        {events.length === 0 ? (
                            <EmptyState
                                icon={Calendar}
                                title="No event contracts"
                                description="Create your first event to populate this list."
                            />
                        ) : (
                            <div className="divide-y divide-border -mx-1">
                                {events.map((address, i) => (
                                    <Reveal key={address} delay={Math.min(i * 0.02, 0.16)}>
                                        <div className="flex items-center justify-between gap-3 py-3 px-1">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-mono">
                                                    {String(i + 1).padStart(2, '0')}
                                                </span>
                                                <span className="font-mono text-[12px] text-fg truncate">{address}</span>
                                                <Badge tone={i % 2 ? 'accent' : 'outline'}>{i % 2 ? 'Live' : 'Draft'}</Badge>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Link route={`/events/${address}`} legacyBehavior>
                                                    <a>
                                                        <Button size="sm" variant="outline" rightIcon={<ArrowRight size={13} strokeWidth={2} />}>Open</Button>
                                                    </a>
                                                </Link>
                                                <Link route={`/events/${address}/validate`} legacyBehavior>
                                                    <a>
                                                        <Button size="sm" variant="ghost">Validate</Button>
                                                    </a>
                                                </Link>
                                            </div>
                                        </div>
                                    </Reveal>
                                ))}
                            </div>
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

export default AdminEvents;
