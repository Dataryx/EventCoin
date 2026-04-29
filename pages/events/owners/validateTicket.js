import React, { Component } from 'react';
import { Form, Button, Message } from 'semantic-ui-react';
import Layout from '../../../components/layout';
import Event from '../../../ethereum/event';
import web3 from '../../../ethereum/web3';

class ValidateTicket extends Component {
    static async getInitialProps(props) {
        const eventInstance = Event(props.query.address);
        const summary = await eventInstance.methods.getEventDetails().call();
        return {
            contractAddress: props.query.address,
            eventName: summary[0],
            eventDescription: summary[4] || '',
            eventDate: summary[5] || ''
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
            <Layout>
                <div className="tm-validate-page">
                    <section className="hero-panel">
                        <div className="hero-copy">
                            <span className="hero-kicker">Ticketmaster-style Admin</span>
                            <h1>Admin Ticket QR Validation</h1>
                            <p className="hero-subtitle">Validate tickets for one event contract using ID lookup, QR image scan, or QR payload text.</p>
                            <div className="hero-meta">
                                <span className="meta-pill">{this.props.eventName || 'Unnamed Event'}</span>
                                <span className="meta-pill">{this.props.eventDate || 'Date TBD'}</span>
                                <span className="meta-pill mono">{this.props.contractAddress}</span>
                            </div>
                        </div>
                        <div className="hero-side">
                            <p className="side-label">Validation Scope</p>
                            <h2>Event-Specific</h2>
                            <p className="side-copy">{this.props.eventDescription || 'This event is ready for ticket gate validation.'}</p>
                        </div>
                    </section>

                    {this.state.errorMessage ? (
                        <Message error header="Validation failed" content={this.state.errorMessage} />
                    ) : null}
                    {this.state.successMessage ? (
                        <Message success header="Validation passed" content={this.state.successMessage} />
                    ) : null}

                    <section className="workflow-grid">
                        <article className="workflow-card">
                            <span className="section-kicker">Method 1</span>
                            <h3>Validate by Ticket ID</h3>
                            <Form onSubmit={this.onValidateByTicketId}>
                                <Form.Input
                                    label="Ticket ID"
                                    value={this.state.ticketId}
                                    onChange={(event) => this.setState({ ticketId: event.target.value })}
                                    placeholder="Enter ticket id"
                                />
                                <Button primary loading={this.state.loading} className="tm-btn">
                                    Validate Ticket ID
                                </Button>
                            </Form>
                        </article>

                        <article className="workflow-card">
                            <span className="section-kicker">Method 2</span>
                            <h3>Validate by QR Image Upload</h3>
                            <Form>
                                <Form.Input
                                    type="file"
                                    accept="image/*"
                                    onChange={this.onUploadQrImage}
                                    label="Upload QR image"
                                />
                            </Form>
                            {this.state.decodedQrText ? (
                                <p className="decoded-copy">Decoded QR payload: {this.state.decodedQrText}</p>
                            ) : null}
                        </article>

                        <article className="workflow-card workflow-card-wide">
                            <span className="section-kicker">Method 3</span>
                            <h3>Validate by QR Payload Text</h3>
                            <Form onSubmit={this.onValidateByQrPayload}>
                                <Form.TextArea
                                    rows={8}
                                    value={this.state.qrPayload}
                                    onChange={(event) => this.setState({ qrPayload: event.target.value })}
                                    placeholder="Paste QR JSON payload here"
                                />
                                <Button primary loading={this.state.loading} className="tm-btn">
                                    Validate QR Payload
                                </Button>
                            </Form>
                        </article>
                    </section>
                </div>
                <style jsx>{`
                    .tm-validate-page {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        font-family: 'Nunito Sans', sans-serif;
                    }
                    .hero-panel {
                        display: grid;
                        grid-template-columns: 1.2fr 0.8fr;
                        gap: 16px;
                        padding: 24px;
                        border-radius: 24px;
                        background:
                            radial-gradient(circle at top right, rgba(0, 185, 242, 0.24), transparent 30%),
                            linear-gradient(125deg, #00112c 0%, #002d72 55%, #026cdf 100%);
                        color: white;
                        box-shadow: 0 22px 42px rgba(0, 32, 96, 0.2);
                    }
                    .hero-kicker {
                        display: inline-block;
                        margin-bottom: 8px;
                        font-size: 0.72rem;
                        text-transform: uppercase;
                        letter-spacing: 0.11em;
                        color: #7dd3fc;
                        font-weight: 800;
                    }
                    .hero-copy h1 {
                        margin: 0;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2.1rem;
                        letter-spacing: 0.03em;
                    }
                    .hero-subtitle {
                        margin: 8px 0 0;
                        color: #dbeafe;
                        max-width: 680px;
                        line-height: 1.5;
                    }
                    .hero-meta {
                        margin-top: 14px;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                    }
                    .meta-pill {
                        border-radius: 999px;
                        border: 1px solid rgba(191, 219, 254, 0.45);
                        background: rgba(15, 23, 42, 0.28);
                        padding: 6px 12px;
                        font-size: 0.76rem;
                        font-weight: 700;
                    }
                    .hero-side {
                        border-radius: 18px;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        background: rgba(2, 23, 60, 0.42);
                        padding: 16px;
                    }
                    .side-label {
                        margin: 0;
                        font-size: 0.74rem;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                        color: #bae6fd;
                        font-weight: 700;
                    }
                    .hero-side h2 {
                        margin: 8px 0 6px;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2rem;
                    }
                    .side-copy {
                        margin: 0;
                        color: #dbeafe;
                        line-height: 1.5;
                        font-size: 0.9rem;
                    }
                    .workflow-grid {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 14px;
                    }
                    .workflow-card {
                        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                        border: 1px solid #dbeafe;
                        border-radius: 18px;
                        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
                        padding: 16px;
                    }
                    .workflow-card-wide {
                        grid-column: span 2;
                    }
                    .section-kicker {
                        display: inline-block;
                        margin-bottom: 8px;
                        color: #2563eb;
                        font-size: 0.72rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.11em;
                    }
                    .workflow-card h3 {
                        margin: 0 0 12px;
                        color: #0f172a;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 1.5rem;
                        letter-spacing: 0.03em;
                    }
                    :global(.workflow-card .ui.form .field > label) {
                        color: #334155;
                        font-weight: 700;
                    }
                    :global(.workflow-card .ui.form textarea),
                    :global(.workflow-card .ui.form input[type="text"]),
                    :global(.workflow-card .ui.form input[type="file"]) {
                        border-radius: 12px !important;
                        border: 1px solid #cbd5e1 !important;
                    }
                    :global(.tm-btn.ui.button) {
                        border-radius: 999px !important;
                        background: #026cdf !important;
                        font-weight: 800 !important;
                        letter-spacing: 0.04em;
                        margin-top: 6px;
                    }
                    .decoded-copy {
                        margin: 10px 0 0;
                        color: #334155;
                        font-size: 0.82rem;
                        line-height: 1.45;
                        word-break: break-word;
                    }
                    .mono {
                        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                        word-break: break-all;
                    }
                    @media (max-width: 860px) {
                        .hero-panel {
                            grid-template-columns: 1fr;
                        }
                        .workflow-grid {
                            grid-template-columns: 1fr;
                        }
                        .workflow-card-wide {
                            grid-column: span 1;
                        }
                    }
                `}</style>
            </Layout>
        );
    }
}

export default ValidateTicket;
