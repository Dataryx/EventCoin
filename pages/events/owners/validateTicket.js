import React, { Component } from 'react';
import { ChevronLeft, AlertCircle, Check, QrCode, Hash, Upload, ShieldCheck } from 'lucide-react';
import Layout from '../../../components/layout';
import Event from '../../../ethereum/event';
import web3 from '../../../ethereum/web3';
import { Link } from '../../../routes';
import {
    Container, Section, Reveal, Card, Button, Input, Textarea, Field, Badge, Divider
} from '../../../components/ui';

class ValidateTicket extends Component {
    static async getInitialProps(props) {
        const eventInstance = Event(props.query.address);
        const summary = await eventInstance.methods.getEventDetails().call();
        return {
            contractAddress: props.query.address,
            eventName: summary[0]
        };
    }

    state = {
        qrPayload: '',
        ticketId: '',
        loading: false,
        errorMessage: '',
        successMessage: '',
        decodedQrText: ''
    };

    assertAdminAccess = async (eventInstance) => {
        const [activeAccount] = await web3.eth.getAccounts();
        const eventOwner = await eventInstance.methods.manager().call();
        if (!activeAccount || activeAccount.toLowerCase() !== eventOwner.toLowerCase()) {
            throw new Error('Only the event owner can validate tickets from admin dashboard.');
        }
    };

    validateWithContract = async (payload) => {
        const eventInstance = Event(this.props.contractAddress);
        await this.assertAdminAccess(eventInstance);

        if (payload.eventAddress.toLowerCase() !== this.props.contractAddress.toLowerCase()) {
            throw new Error('This QR belongs to another event contract.');
        }

        const ticketDetails = await eventInstance.methods.tickets(payload.ticketId).call();
        const onChainOwner = ticketDetails.owner || ticketDetails[0];
        const isUsed = ticketDetails.isUsed || ticketDetails[1];

        if (onChainOwner.toLowerCase() !== payload.buyerAddress.toLowerCase()) {
            throw new Error('Ticket owner does not match QR owner data.');
        }

        if (isUsed) {
            throw new Error('Ticket is already used.');
        }

        return `Ticket #${payload.ticketId} is valid and unused.`;
    };

    validateByTicketId = async () => {
        const eventInstance = Event(this.props.contractAddress);
        await this.assertAdminAccess(eventInstance);
        if (!this.state.ticketId.trim()) {
            throw new Error('Ticket ID is required.');
        }

        const ticketDetails = await eventInstance.methods.tickets(this.state.ticketId).call();
        const owner = ticketDetails.owner || ticketDetails[0];
        const isUsed = ticketDetails.isUsed || ticketDetails[1];

        if (!owner || owner === '0x0000000000000000000000000000000000000000') {
            throw new Error('Ticket not found or never sold.');
        }
        if (isUsed) {
            throw new Error(`Ticket #${this.state.ticketId} is already used.`);
        }

        return `Ticket #${this.state.ticketId} is valid and unused. Owner: ${owner}`;
    };

    decodeQrFromImage = async (file) => {
        if (typeof window === 'undefined' || !window.BarcodeDetector) {
            throw new Error('QR image decoding is not supported in this browser. Use Ticket ID validation.');
        }

        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const bitmap = await createImageBitmap(file);
        const results = await detector.detect(bitmap);
        if (!results.length || !results[0].rawValue) {
            throw new Error('No QR code found in the uploaded image.');
        }
        return results[0].rawValue;
    };

    onValidateByQrPayload = async (event) => {
        event.preventDefault();
        this.setState({ loading: true, errorMessage: '', successMessage: '' });

        try {
            const payload = JSON.parse(this.state.qrPayload);
            if (!payload.ticketId || !payload.buyerAddress || !payload.eventAddress) {
                throw new Error('QR payload is incomplete.');
            }
            const successMessage = await this.validateWithContract(payload);
            this.setState({ successMessage });
        } catch (err) {
            this.setState({ errorMessage: err.message });
        }
        this.setState({ loading: false });
    };

    onValidateByTicketId = async (event) => {
        event.preventDefault();
        this.setState({ loading: true, errorMessage: '', successMessage: '' });
        try {
            const successMessage = await this.validateByTicketId();
            this.setState({ successMessage });
        } catch (err) {
            this.setState({ errorMessage: err.message });
        }
        this.setState({ loading: false });
    };

    onUploadQrImage = async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        this.setState({ loading: true, errorMessage: '', successMessage: '' });
        try {
            const decodedQrText = await this.decodeQrFromImage(file);
            this.setState({ decodedQrText, qrPayload: decodedQrText });
            const payload = JSON.parse(decodedQrText);
            if (!payload.ticketId || !payload.buyerAddress || !payload.eventAddress) {
                throw new Error('Decoded QR payload is incomplete.');
            }
            const successMessage = await this.validateWithContract(payload);
            this.setState({ successMessage });
        } catch (err) {
            this.setState({ errorMessage: err.message });
        }
        this.setState({ loading: false });
    };

    render() {
        return (
            <Layout title="Validate ticket">
                <Section className="pt-10 pb-6">
                    <Container className="max-w-3xl">
                        <Reveal>
                            <Link route={`/events/${this.props.contractAddress}`} legacyBehavior>
                                <a className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors group">
                                    <ChevronLeft size={14} strokeWidth={1.75} className="transition-transform group-hover:-translate-x-0.5" />
                                    Back to event
                                </a>
                            </Link>
                        </Reveal>
                        <Reveal delay={0.05}>
                            <Badge tone="accent" className="mt-5"><ShieldCheck size={11} /> Admin only</Badge>
                        </Reveal>
                        <Reveal delay={0.08}>
                            <h1 className="font-serif text-display-md text-fg mt-3 tracking-tight">
                                Validate ticket
                            </h1>
                        </Reveal>
                        <Reveal delay={0.12}>
                            <p className="mt-3 text-[15px] text-muted">
                                <span className="text-fg/80">{this.props.eventName || 'Unnamed Event'}</span> · <span className="font-mono text-xs">{this.props.contractAddress}</span>
                            </p>
                        </Reveal>
                    </Container>
                </Section>

                <Section className="pt-2 pb-20">
                    <Container className="max-w-3xl">
                        <div className="grid gap-4">
                            <Reveal>
                                <Card className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Hash size={14} className="text-accent" />
                                        <h2 className="font-medium text-fg">Validate by Ticket ID</h2>
                                    </div>
                                    <form onSubmit={this.onValidateByTicketId} className="flex flex-col sm:flex-row gap-3">
                                        <Input
                                            className="font-mono flex-1"
                                            value={this.state.ticketId}
                                            onChange={(e) => this.setState({ ticketId: e.target.value })}
                                            placeholder="Enter ticket id"
                                        />
                                        <Button as="button" type="submit" loading={this.state.loading}>
                                            Validate
                                        </Button>
                                    </form>
                                </Card>
                            </Reveal>

                            <Reveal delay={0.05}>
                                <Card className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Upload size={14} className="text-accent" />
                                        <h2 className="font-medium text-fg">Upload QR image</h2>
                                    </div>
                                    <Field hint="Uses the browser's BarcodeDetector when available.">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={this.onUploadQrImage}
                                            className="cursor-pointer file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:bg-accent file:text-accent-fg file:text-xs file:font-medium hover:file:bg-accent-hover"
                                        />
                                    </Field>
                                    {this.state.decodedQrText ? (
                                        <p className="mt-3 text-xs font-mono text-muted break-all">
                                            <span className="text-fg/80">Decoded:</span> {this.state.decodedQrText}
                                        </p>
                                    ) : null}
                                </Card>
                            </Reveal>

                            <Reveal delay={0.1}>
                                <Card className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <QrCode size={14} className="text-accent" />
                                        <h2 className="font-medium text-fg">Paste QR payload</h2>
                                    </div>
                                    <form onSubmit={this.onValidateByQrPayload} className="flex flex-col gap-3">
                                        <Textarea
                                            rows={6}
                                            value={this.state.qrPayload}
                                            onChange={(e) => this.setState({ qrPayload: e.target.value })}
                                            placeholder="Paste QR JSON payload here"
                                            className="font-mono text-xs"
                                        />
                                        <Button as="button" type="submit" loading={this.state.loading} className="self-start">
                                            Validate payload
                                        </Button>
                                    </form>
                                </Card>
                            </Reveal>

                            {this.state.errorMessage ? (
                                <Card className="p-4 border-danger/30 bg-danger/5">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle size={15} className="text-danger mt-0.5" strokeWidth={1.75} />
                                        <p className="text-sm text-fg"><span className="font-medium">Validation failed. </span>{this.state.errorMessage}</p>
                                    </div>
                                </Card>
                            ) : null}

                            {this.state.successMessage ? (
                                <Card className="p-4 border-accent/30 bg-accent/5">
                                    <div className="flex items-start gap-2">
                                        <Check size={15} className="text-accent mt-0.5" strokeWidth={1.75} />
                                        <p className="text-sm text-fg">{this.state.successMessage}</p>
                                    </div>
                                </Card>
                            ) : null}
                        </div>
                    </Container>
                </Section>
            </Layout>
        );
    }
}

export default ValidateTicket;
