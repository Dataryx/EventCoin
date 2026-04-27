import React, { Component } from 'react';
import { Button, Form, Message, Segment, Header, Icon, Grid } from 'semantic-ui-react';
import Layout from '../../components/layout';
import web3 from '../../ethereum/web3';
import { Router } from '../../routes';

class AdminLogin extends Component {
    state = {
        loading: false,
        errorMessage: ''
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

            window.localStorage.setItem('adminAccount', accounts[0]);
            Router.pushRoute('/admin/dashboard');
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
                            style={{ borderRadius: '16px', border: '1px solid #dbeafe' }}
                        >
                            <Header as="h2">
                                <Icon name="settings" color="blue" />
                                <Header.Content>Admin Portal Login</Header.Content>
                            </Header>
                            <p>Connect your wallet to access event creation, operations, and ticket validation tools.</p>
                            <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
                                <Button primary fluid size="large" loading={this.state.loading}>
                                    Enter Admin Dashboard
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

export default AdminLogin;
