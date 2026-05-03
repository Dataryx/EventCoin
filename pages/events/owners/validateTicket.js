import React, { Component } from 'react';
import { Form, Button } from 'semantic-ui-react';
import Layout from '../../../components/layout';
import Event from '../../../ethereum/event';
import web3 from '../../../ethereum/web3';
import { parseTicketBarcodeValue } from '../../../ethereum/ticketBarcode';
import { persistAuditLog } from '../../../ethereum/auditLog';
import TopAlertStack from '../../../components/topAlertStack';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

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
        barcodeValueInput: '',
        ticketId: '',
        decodedBarcodeText: '',
        loadingAction: '',
        errorMessage: '',
        successMessage: '',
        statusMessage: '',
        statusHeader: ''
    };

    getAdminAuditActor = () => {
        const adminAccount = typeof window !== 'undefined'
            ? (window.localStorage.getItem('adminAccount') || 'Admin')
            : 'Admin';

        return {
            actorName: adminAccount,
            actorRole: 'admin',
            actorId: adminAccount
        };
    };

    logAdminAudit = ({ action, status, entityId = '', details = {} }) => {
        const actor = this.getAdminAuditActor();

        persistAuditLog({
            ...actor,
            action,
            status,
            entityType: 'ticket',
            entityId: entityId ? entityId.toString() : '',
            route: `/events/${this.props.contractAddress}/owners/validateTicket`,
            details: {
                eventName: this.props.eventName,
                eventAddress: this.props.contractAddress,
                ...details
            }
        });
    };

    getEventInstance() {
        return Event(this.props.contractAddress);
    }

    extractRpcErrorMessage = (error) => {
        const candidates = [
            error?.cause?.message,
            error?.data?.message,
            error?.data?.originalError?.message,
            error?.innerError?.message,
            error?.error?.message,
            error?.message
        ].filter(Boolean);

        const detailedMessage = candidates.find((message) =>
            message && !message.includes('Internal JSON-RPC error')
        );

        return detailedMessage || candidates[0] || 'Unknown blockchain error.';
    };

    formatUseTicketError = (error, managerAddress) => {
        const rpcMessage = this.extractRpcErrorMessage(error);

        if (rpcMessage.includes('You do not own this ticket')) {
            return (
                `This event contract is still using the legacy owner-only ticket rule. ` +
                `Manager wallet ${managerAddress} cannot mark tickets used on this deployment. ` +
                `Recreate the event after redeploying the updated contracts to allow admin/event-manager use.`
            );
        }

        if (rpcMessage.includes('Ticket already used')) {
            return 'This ticket is already marked as used.';
        }

        if (rpcMessage.includes('Invalid ticket ID')) {
            return 'This ticket ID does not exist for the selected event.';
        }

        if (rpcMessage.includes('User denied')) {
            return 'The wallet transaction was cancelled.';
        }

        if (rpcMessage.includes('Internal JSON-RPC error')) {
            return 'Wallet or Ganache returned a generic RPC error. Check that MetaMask is connected to the event manager wallet on the same local network.';
        }

        return rpcMessage;
    };

    assertAdminAccess = async () => {
        if (typeof window === 'undefined') {
            throw new Error('Admin session unavailable.');
        }

        const isAdminAuthenticated = window.localStorage.getItem('adminAuthenticated') === 'true';
        const adminAccount = window.localStorage.getItem('adminAccount') || '';

        if (!isAdminAuthenticated || !adminAccount) {
            throw new Error('Please log in to the admin dashboard before validating or using tickets.');
        }
    };

    parseBarcodeValue = (rawValue) => {
        return parseTicketBarcodeValue(rawValue);
    };

    getTicketIdFromBarcodeText = (rawValue) => {
        try {
            return this.parseBarcodeValue(rawValue).ticketId?.toString() || '';
        } catch (error) {
            return '';
        }
    };

    getAuditContextForAction = (loadingAction) => {
        switch (loadingAction) {
        case 'validate-barcode-value':
            return {
                action: 'Ticket validation',
                source: 'barcode value',
                entityId: this.getTicketIdFromBarcodeText(this.state.barcodeValueInput)
            };
        case 'use-barcode-value':
            return {
                action: 'Ticket use',
                source: 'barcode value',
                entityId: this.getTicketIdFromBarcodeText(this.state.barcodeValueInput)
            };
        case 'validate-ticket-id':
            return {
                action: 'Ticket validation',
                source: 'ticket id',
                entityId: this.state.ticketId.trim()
            };
        case 'use-ticket-id':
            return {
                action: 'Ticket use',
                source: 'ticket id',
                entityId: this.state.ticketId.trim()
            };
        case 'validate-uploaded-barcode':
            return {
                action: 'Ticket validation',
                source: 'uploaded barcode',
                entityId: this.getTicketIdFromBarcodeText(this.state.decodedBarcodeText)
            };
        case 'use-uploaded-barcode':
            return {
                action: 'Ticket use',
                source: 'uploaded barcode',
                entityId: this.getTicketIdFromBarcodeText(this.state.decodedBarcodeText)
            };
        default:
            return null;
        }
    };

    logActionFailure = (loadingAction, error) => {
        const auditContext = this.getAuditContextForAction(loadingAction);

        if (!auditContext) {
            return;
        }

        this.logAdminAudit({
            action: auditContext.action,
            status: 'failed',
            entityId: auditContext.entityId,
            details: {
                source: auditContext.source,
                reason: this.extractRpcErrorMessage(error)
            }
        });
    };

    getTicketSnapshot = async (ticketId) => {
        const eventInstance = this.getEventInstance();
        const ticketDetails = await eventInstance.methods.tickets(ticketId).call();
        const owner = ticketDetails.owner || ticketDetails[0] || '';
        const isUsed = Boolean(ticketDetails.isUsed || ticketDetails[1]);

        return {
            eventInstance,
            ticketId,
            owner,
            isUsed
        };
    };

    assertTicketIsSoldAndUnused = async (ticketId) => {
        await this.assertAdminAccess();

        if (ticketId === '' || ticketId === null || ticketId === undefined) {
            throw new Error('Ticket ID is required.');
        }

        const snapshot = await this.getTicketSnapshot(ticketId);

        if (!snapshot.owner || snapshot.owner.toLowerCase() === ZERO_ADDRESS) {
            throw new Error('Ticket not found or never sold.');
        }

        if (snapshot.isUsed) {
            throw new Error(`Ticket #${ticketId} is already used.`);
        }

        return snapshot;
    };

    validateWithContract = async (barcodeData, source = 'barcode value', shouldLog = true) => {
        const snapshot = await this.assertTicketIsSoldAndUnused(barcodeData.ticketId);
        if (shouldLog) {
            this.logAdminAudit({
                action: 'Ticket validation',
                status: 'success',
                entityId: barcodeData.ticketId,
                details: {
                    source,
                    owner: snapshot.owner
                }
            });
        }
        return `Ticket #${barcodeData.ticketId} is valid and unused. Current owner: ${snapshot.owner}`;
    };

    validateByTicketId = async () => {
        const snapshot = await this.assertTicketIsSoldAndUnused(this.state.ticketId.trim());
        this.logAdminAudit({
            action: 'Ticket validation',
            status: 'success',
            entityId: snapshot.ticketId,
            details: {
                source: 'ticket id',
                owner: snapshot.owner
            }
        });
        return `Ticket #${snapshot.ticketId} is valid and unused. Owner: ${snapshot.owner}`;
    };

    assertManagerWallet = async () => {
        if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
            throw new Error('Install MetaMask to mark tickets as used.');
        }

        const eventInstance = this.getEventInstance();
        const managerAddress = await eventInstance.methods.manager().call();

        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3.eth.getAccounts();
        const activeAccount = accounts[0];

        if (!activeAccount) {
            throw new Error('No wallet account found. Connect the event manager wallet first.');
        }

        if (activeAccount.toLowerCase() !== managerAddress.toLowerCase()) {
            throw new Error(`Connect the event manager wallet in MetaMask before using tickets. Required manager: ${managerAddress}`);
        }

        return {
            eventInstance,
            activeAccount,
            managerAddress
        };
    };

    markTicketAsUsed = async (ticketId, source = 'ticket id') => {
        await this.assertTicketIsSoldAndUnused(ticketId);
        this.setState({
            statusHeader: 'Entry status',
            statusMessage: `Checking manager wallet access for ticket #${ticketId}.`
        });
        const { eventInstance, activeAccount, managerAddress } = await this.assertManagerWallet();

        try {
            this.setState({
                statusHeader: 'Entry status',
                statusMessage: `Manager wallet verified. Confirm the on-chain use transaction for ticket #${ticketId} in MetaMask.`
            });
            await web3.eth.call({
                to: this.props.contractAddress,
                from: activeAccount,
                data: eventInstance.methods.useTicket(ticketId).encodeABI()
            });

            await eventInstance.methods.useTicket(ticketId).estimateGas({
                from: activeAccount
            });

            const result = await eventInstance.methods.useTicket(ticketId).send({
                from: activeAccount,
                gas: 300000
            });
            const usedTicketId = result.events?.TicketUsed?.returnValues?.ticketId ?? ticketId;
            this.logAdminAudit({
                action: 'Ticket use',
                status: 'success',
                entityId: usedTicketId,
                details: {
                    source,
                    managerWallet: managerAddress,
                    walletUsed: activeAccount
                }
            });
            return `Ticket #${usedTicketId} was marked as used successfully. Entry is now locked to prevent ticket reuse.`;
        } catch (error) {
            throw new Error(this.formatUseTicketError(error, managerAddress));
        }
    };

    useByTicketId = async () => {
        const ticketId = this.state.ticketId.trim();
        return this.markTicketAsUsed(ticketId, 'ticket id');
    };

    useByBarcodeValue = async (barcodeData, source = 'barcode value') => {
        await this.validateWithContract(barcodeData, source, false);
        return this.markTicketAsUsed(barcodeData.ticketId, source);
    };

    decodeBarcodeWithZxing = async (file) => {
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
            import('@zxing/browser'),
            import('@zxing/library')
        ]);

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);

        const reader = new BrowserMultiFormatReader(hints);
        const objectUrl = URL.createObjectURL(file);
        const image = new window.Image();

        try {
            await new Promise((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = () => reject(new Error('Unable to load the uploaded barcode image.'));
                image.src = objectUrl;
            });

            const result = await reader.decodeFromImageElement(image);
            if (!result?.getText) {
                throw new Error('No barcode found in the uploaded image.');
            }

            return result.getText();
        } catch (error) {
            throw new Error('No barcode found in the uploaded image. Try a sharper screenshot or use the barcode value text field.');
        } finally {
            image.src = '';
            URL.revokeObjectURL(objectUrl);
        }
    };

    decodeBarcodeFromImage = async (file) => {
        if (typeof window === 'undefined') {
            throw new Error('Barcode image decoding is only available in the browser.');
        }

        if (window.BarcodeDetector) {
            const detector = new window.BarcodeDetector({ formats: ['code_128'] });
            const bitmap = await createImageBitmap(file);

            try {
                const results = await detector.detect(bitmap);
                if (results.length && results[0].rawValue) {
                    return results[0].rawValue;
                }
            } finally {
                if (bitmap?.close) {
                    bitmap.close();
                }
            }
        }

        return this.decodeBarcodeWithZxing(file);
    };

    getActionStatus = (loadingAction) => {
        const actionCopy = {
            'validate-barcode-value': {
                header: 'Validation status',
                message: 'Checking the barcode value against the selected event contract and current ticket state.'
            },
            'use-barcode-value': {
                header: 'Entry status',
                message: 'Validating the barcode value and preparing the on-chain ticket-use transaction.'
            },
            'validate-ticket-id': {
                header: 'Validation status',
                message: 'Checking whether the entered ticket ID exists, is sold, and is still unused.'
            },
            'use-ticket-id': {
                header: 'Entry status',
                message: 'Checking the ticket ID and preparing the wallet confirmation needed to mark it used.'
            },
            'validate-uploaded-barcode': {
                header: 'Validation status',
                message: 'Reviewing the decoded barcode value and checking ticket ownership and usage state.'
            },
            'use-uploaded-barcode': {
                header: 'Entry status',
                message: 'Reviewing the uploaded barcode value and preparing the use-ticket transaction.'
            },
            'decode-barcode': {
                header: 'Barcode scan status',
                message: 'Scanning the uploaded image for a ticket barcode value.'
            }
        };

        return actionCopy[loadingAction] || {
            header: 'Status',
            message: 'Processing your request.'
        };
    };

    runAction = async (loadingAction, callback) => {
        const actionStatus = this.getActionStatus(loadingAction);

        this.setState({
            loadingAction,
            errorMessage: '',
            successMessage: '',
            statusHeader: actionStatus.header,
            statusMessage: actionStatus.message
        });

        try {
            const successMessage = await callback();
            this.setState({ successMessage, loadingAction: '' });
        } catch (error) {
            this.logActionFailure(loadingAction, error);
            this.setState({
                errorMessage: this.extractRpcErrorMessage(error),
                loadingAction: '',
                statusHeader: '',
                statusMessage: ''
            });
            return;
        }

        this.setState({ loadingAction: '', statusHeader: '', statusMessage: '' });
    };

    onValidateByBarcodeValue = async (event) => {
        event.preventDefault();
        await this.runAction('validate-barcode-value', async () => {
            const barcodeData = this.parseBarcodeValue(this.state.barcodeValueInput);
            return this.validateWithContract(barcodeData, 'barcode value');
        });
    };

    onUseByBarcodeValue = async () => {
        await this.runAction('use-barcode-value', async () => {
            const barcodeData = this.parseBarcodeValue(this.state.barcodeValueInput);
            return this.useByBarcodeValue(barcodeData, 'barcode value');
        });
    };

    onValidateByTicketId = async (event) => {
        event.preventDefault();
        await this.runAction('validate-ticket-id', this.validateByTicketId);
    };

    onUseByTicketId = async () => {
        await this.runAction('use-ticket-id', this.useByTicketId);
    };

    onUploadBarcodeImage = async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }

        const decodeStatus = this.getActionStatus('decode-barcode');
        this.setState({
            loadingAction: 'decode-barcode',
            errorMessage: '',
            successMessage: '',
            statusHeader: decodeStatus.header,
            statusMessage: decodeStatus.message
        });

        try {
            const decodedBarcodeText = await this.decodeBarcodeFromImage(file);
            this.setState({
                decodedBarcodeText,
                barcodeValueInput: decodedBarcodeText,
                successMessage: 'Barcode image decoded successfully. Review the value below, then validate it or mark the ticket used.',
                statusHeader: '',
                statusMessage: ''
            });
        } catch (error) {
            this.setState({ errorMessage: error.message, statusHeader: '', statusMessage: '' });
        }

        this.setState({ loadingAction: '' });
    };

    onValidateUploadedBarcode = async () => {
        await this.runAction('validate-uploaded-barcode', async () => {
            if (!this.state.decodedBarcodeText) {
                throw new Error('Upload a barcode image first.');
            }

            const barcodeData = this.parseBarcodeValue(this.state.decodedBarcodeText);
            return this.validateWithContract(barcodeData, 'uploaded barcode');
        });
    };

    onUseUploadedBarcode = async () => {
        await this.runAction('use-uploaded-barcode', async () => {
            if (!this.state.decodedBarcodeText) {
                throw new Error('Upload a barcode image first.');
            }

            const barcodeData = this.parseBarcodeValue(this.state.decodedBarcodeText);
            return this.useByBarcodeValue(barcodeData, 'uploaded barcode');
        });
    };

    render() {
        return (
            <Layout>
                <div className="tm-validate-page">
                    <TopAlertStack
                        alerts={[
                            this.state.statusMessage ? {
                                id: 'validate-ticket-status',
                                type: 'info',
                                header: this.state.statusHeader || 'Status',
                                content: this.state.statusMessage,
                                autoDismissMs: 0
                            } : null,
                            this.state.errorMessage ? {
                                id: 'validate-ticket-error',
                                type: 'error',
                                header: 'Action failed',
                                content: this.state.errorMessage,
                                onDismiss: () => this.setState({ errorMessage: '' })
                            } : null,
                            this.state.successMessage ? {
                                id: 'validate-ticket-success',
                                type: 'success',
                                header: 'Action complete',
                                content: this.state.successMessage,
                                onDismiss: () => this.setState({ successMessage: '' })
                            } : null
                        ]}
                    />
                    <section className="hero-panel">
                        <div className="hero-copy">
                            <span className="hero-kicker">Ticketmaster-style Admin</span>
                            <h1>Admin Ticket Validation and Use</h1>
                            <p className="hero-subtitle">Validate tickets or mark them used from the same event-specific screen using ticket ID, barcode image scan, or barcode value text.</p>
                            <div className="hero-meta">
                                <span className="meta-pill">{this.props.eventName || 'Unnamed Event'}</span>
                                <span className="meta-pill">{this.props.eventDate || 'Date TBD'}</span>
                                <span className="meta-pill mono">{this.props.contractAddress}</span>
                            </div>
                        </div>
                        <div className="hero-side">
                            <p className="side-label">Gate Workflow</p>
                            <h2>Validate Then Use</h2>
                            <p className="side-copy">{this.props.eventDescription || 'This event is ready for ticket validation and entry check-in.'}</p>
                            <p className="side-note">Using a ticket sends an on-chain transaction and requires the event manager wallet in MetaMask.</p>
                        </div>
                    </section>

                    <section className="workflow-grid">
                        <article className="workflow-card">
                            <span className="section-kicker">Method 1</span>
                            <h3>Ticket ID</h3>
                            <Form onSubmit={this.onValidateByTicketId}>
                                <Form.Input
                                    label="Ticket ID"
                                    value={this.state.ticketId}
                                    onChange={(event) => this.setState({ ticketId: event.target.value })}
                                    placeholder="Enter ticket id"
                                />
                                <div className="action-row">
                                    <Button
                                        primary
                                        loading={this.state.loadingAction === 'validate-ticket-id'}
                                        disabled={Boolean(this.state.loadingAction && this.state.loadingAction !== 'validate-ticket-id')}
                                        className="tm-btn"
                                        type="submit"
                                    >
                                        Validate Ticket ID
                                    </Button>
                                    <Button
                                        secondary
                                        loading={this.state.loadingAction === 'use-ticket-id'}
                                        disabled={Boolean(this.state.loadingAction && this.state.loadingAction !== 'use-ticket-id')}
                                        className="tm-btn tm-btn-secondary"
                                        type="button"
                                        onClick={this.onUseByTicketId}
                                    >
                                        Use Ticket ID
                                    </Button>
                                </div>
                            </Form>
                        </article>

                        <article className="workflow-card">
                            <span className="section-kicker">Method 2</span>
                            <h3>Barcode Image Upload</h3>
                            <Form>
                                <Form.Input
                                    type="file"
                                    accept="image/*"
                                    onChange={this.onUploadBarcodeImage}
                                    label="Upload barcode image"
                                />
                            </Form>
                            {this.state.decodedBarcodeText ? (
                                <p className="decoded-copy">Decoded barcode value: {this.state.decodedBarcodeText}</p>
                            ) : (
                                <p className="decoded-copy muted">Upload a barcode image to decode it, then validate it or mark it used.</p>
                            )}
                            <div className="action-row">
                                <Button
                                    primary
                                    loading={this.state.loadingAction === 'validate-uploaded-barcode'}
                                    disabled={Boolean(this.state.loadingAction && this.state.loadingAction !== 'validate-uploaded-barcode')}
                                    className="tm-btn"
                                    type="button"
                                    onClick={this.onValidateUploadedBarcode}
                                >
                                    Validate Uploaded Barcode
                                </Button>
                                <Button
                                    secondary
                                    loading={this.state.loadingAction === 'use-uploaded-barcode'}
                                    disabled={Boolean(this.state.loadingAction && this.state.loadingAction !== 'use-uploaded-barcode')}
                                    className="tm-btn tm-btn-secondary"
                                    type="button"
                                    onClick={this.onUseUploadedBarcode}
                                >
                                    Use Uploaded Barcode
                                </Button>
                            </div>
                        </article>

                        <article className="workflow-card workflow-card-wide">
                            <span className="section-kicker">Method 3</span>
                            <h3>Barcode Value Text</h3>
                            <Form onSubmit={this.onValidateByBarcodeValue}>
                                <Form.TextArea
                                    rows={8}
                                    value={this.state.barcodeValueInput}
                                    onChange={(event) => this.setState({ barcodeValueInput: event.target.value })}
                                    placeholder="Paste barcode value here"
                                />
                                <div className="action-row">
                                    <Button
                                        primary
                                        loading={this.state.loadingAction === 'validate-barcode-value'}
                                        disabled={Boolean(this.state.loadingAction && this.state.loadingAction !== 'validate-barcode-value')}
                                        className="tm-btn"
                                        type="submit"
                                    >
                                        Validate Barcode Value
                                    </Button>
                                    <Button
                                        secondary
                                        loading={this.state.loadingAction === 'use-barcode-value'}
                                        disabled={Boolean(this.state.loadingAction && this.state.loadingAction !== 'use-barcode-value')}
                                        className="tm-btn tm-btn-secondary"
                                        type="button"
                                        onClick={this.onUseByBarcodeValue}
                                    >
                                        Use Barcode Value
                                    </Button>
                                </div>
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
                    .side-copy,
                    .side-note {
                        margin: 0;
                        color: #dbeafe;
                        line-height: 1.5;
                        font-size: 0.9rem;
                    }
                    .side-note {
                        margin-top: 10px;
                        color: #bfdbfe;
                        font-size: 0.8rem;
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
                    .action-row {
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                        margin-top: 8px;
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
                    :global(.tm-btn-secondary.ui.button) {
                        background: #0f172a !important;
                    }
                    .decoded-copy {
                        margin: 10px 0 0;
                        color: #334155;
                        font-size: 0.82rem;
                        line-height: 1.45;
                        word-break: break-word;
                    }
                    .decoded-copy.muted {
                        color: #64748b;
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
