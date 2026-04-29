import React, { Component } from 'react';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import Layout from '../../components/layout';
import web3 from '../../ethereum/web3';
import { Router } from '../../routes';
import {
    Container, Section, Reveal, Card, Button, Badge
} from '../../components/ui';

class ClientLogin extends Component {
    state = { loading: false, errorMessage: '', account: '' };

    onSubmit = async (event) => {
        event.preventDefault();
        this.setState({ loading: true, errorMessage: '' });

        try {
            if (!window.ethereum) {
                throw new Error('Please install MetaMask to continue.');
            }

            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const accounts = await web3.eth.getAccounts();

            if (!accounts.length) {
                throw new Error('No wallet account available.');
            }

            const account = accounts[0];
            window.localStorage.setItem('clientAccount', account);
            this.setState({ account });
            Router.pushRoute('/client/dashboard');
        } catch (err) {
            this.setState({ errorMessage: err.message });
        }

        this.setState({ loading: false });
    };

    render() {
        return (
            <Layout title="Client login">
                <Section className="pt-16 pb-20">
                    <Container className="max-w-md">
                        <Reveal>
                            <Badge tone="accent"><ShoppingBag size={11} /> Storefront</Badge>
                        </Reveal>
                        <Reveal delay={0.05}>
                            <h1 className="font-serif text-display-md text-fg mt-4 text-balance">
                                Browse and book.
                            </h1>
                        </Reveal>
                        <Reveal delay={0.1}>
                            <p className="mt-3 text-[15px] text-muted">
                                Connect your wallet to discover events, secure tickets, and carry your QR pass on-chain.
                            </p>
                        </Reveal>
                        <Reveal delay={0.15}>
                            <Card className="mt-8 p-6">
                                <form onSubmit={this.onSubmit}>
                                    <Button
                                        as="button"
                                        type="submit"
                                        size="lg"
                                        loading={this.state.loading}
                                        className="w-full"
                                    >
                                        Connect wallet
                                    </Button>
                                    {this.state.errorMessage ? (
                                        <div className="mt-4 flex items-start gap-2 text-sm text-danger">
                                            <AlertCircle size={14} className="mt-0.5" strokeWidth={1.75} />
                                            <span>{this.state.errorMessage}</span>
                                        </div>
                                    ) : null}
                                </form>
                                <p className="mt-5 text-xs text-muted">
                                    Requires MetaMask · Your wallet stays in your browser.
                                </p>
                            </Card>
                        </Reveal>
                    </Container>
                </Section>
            </Layout>
        );
    }
}

export default ClientLogin;
