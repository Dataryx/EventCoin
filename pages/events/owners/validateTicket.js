import React, { Component } from 'react';
import { Form, Button, Message, Segment, Icon, Divider } from 'semantic-ui-react';
import Layout from '../../../components/layout';
import Event from '../../../ethereum/event';
import web3 from '../../../ethereum/web3';

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
            <Layout>
                <h3>Admin Ticket QR Validation</h3>
                <p><strong>Event:</strong> {this.props.eventName || 'Unnamed Event'}</p>
                <p><strong>Contract:</strong> {this.props.contractAddress}</p>
                <p>This page validates tickets for this event only.</p>

                <Segment>
                    <h4>Validate by Ticket ID</h4>
                    <Form onSubmit={this.onValidateByTicketId} error={!!this.state.errorMessage}>
                        <Form.Input
                            label="Ticket ID"
                            value={this.state.ticketId}
                            onChange={(event) => this.setState({ ticketId: event.target.value })}
                            placeholder="Enter ticket id"
                        />
                        <Button primary loading={this.state.loading}>
                            Validate Ticket ID
                        </Button>
                    </Form>
                </Segment>

                <Divider horizontal>OR</Divider>

                <Segment>
                    <h4>Validate by QR Image Upload</h4>
                    <Form error={!!this.state.errorMessage}>
                        <Form.Input
                            type="file"
                            accept="image/*"
                            onChange={this.onUploadQrImage}
                            label="Upload QR image"
                        />
                    </Form>
                    {this.state.decodedQrText ? (
                        <p style={{ marginTop: '8px', wordBreak: 'break-word' }}>
                            Decoded QR payload: {this.state.decodedQrText}
                        </p>
                    ) : null}
                </Segment>

                <Divider horizontal>OR</Divider>

                <Segment>
                    <h4>Validate by QR Payload Text</h4>
                    <Form onSubmit={this.onValidateByQrPayload} error={!!this.state.errorMessage}>
                    <Form.TextArea
                        rows={8}
                        value={this.state.qrPayload}
                        onChange={(event) => this.setState({ qrPayload: event.target.value })}
                        placeholder="Paste QR JSON payload here"
                    />
                    <Button primary loading={this.state.loading}>
                        Validate QR Payload
                    </Button>
                    <Message error header="Validation failed" content={this.state.errorMessage} />
                </Form>
                </Segment>

                {this.state.successMessage && (
                    <Segment color="green" style={{ marginTop: '12px' }}>
                        <Icon color="green" name="check circle" />
                        {this.state.successMessage}
                    </Segment>
                )}
            </Layout>
        );
    }
}

export default ValidateTicket;
