import React, { Component } from 'react';
import { Button, Form, Message, Segment, Header, Icon, Grid } from 'semantic-ui-react';
import Layout from '../../components/layout';
import web3 from '../../ethereum/web3';
import { Router } from '../../routes';

class ClientLogin extends Component {
    state = {
        loading: false,
        errorMessage: '',
        account: '',
    };

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
            <Layout>
                <Grid centered>
                    <Grid.Column mobile={16} tablet={12} computer={8}>
                        <Segment
                            padded="very"
                            style={{ borderRadius: '16px', border: '1px solid #ccfbf1' }}
                        >
                            <Header as="h2">
                                <Icon name="shopping cart" color="teal" />
                                <Header.Content>Customer Portal Login</Header.Content>
                            </Header>
                            <p>Connect your wallet to browse events, checkout tickets, and manage your QR passes.</p>
                            <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
                                <Button color="teal" fluid size="large" loading={this.state.loading}>
                                    Enter Customer Storefront
                                </Button>
                                <Message error header="Login failed" content={this.state.errorMessage} />
                            </Form>
                        </Segment>
                    </Grid.Column>
                </Grid>
            </Layout>
        );
    }
}

export default ClientLogin;
