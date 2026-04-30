import React, { Component } from 'react';
import { Button, Form, Message, Icon } from 'semantic-ui-react';
import Layout from '../../components/layout';
import { Router } from '../../routes';

class ClientLogin extends Component {
    state = {
        loginLoading: false,
        registerLoading: false,
        errorMessage: '',
        successMessage: '',
        showRegister: false,
        loginIdentity: '',
        loginPassword: '',
        registerName: '',
        registerUsername: '',
        registerEmail: '',
        registerPassword: '',
        registerConfirmPassword: ''
    };

    getStoredClients = () => {
        try {
            const raw = window.localStorage.getItem('eventCoinClients');
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            return [];
        }
    };

    persistClients = (clients) => {
        window.localStorage.setItem('eventCoinClients', JSON.stringify(clients));
    };

    normalizeIdentity = (value) => (value || '').trim().toLowerCase();

    onLogin = async (event) => {
        event.preventDefault();
        this.setState({ loginLoading: true, errorMessage: '', successMessage: '' });

        try {
            const identity = this.normalizeIdentity(this.state.loginIdentity);
            const password = this.state.loginPassword;

            if (!identity || !password) {
                throw new Error('Enter email or username and password.');
            }

            const clients = this.getStoredClients();
            const matchedClient = clients.find((client) => (
                this.normalizeIdentity(client.email) === identity ||
                this.normalizeIdentity(client.username) === identity
            ));

            if (!matchedClient || matchedClient.password !== password) {
                throw new Error('Invalid credentials. Please check your email/username and password.');
            }

            const updatedClients = clients.map((client) => (
                client.id === matchedClient.id
                    ? { ...client, isActive: true, lastLoginAt: new Date().toISOString() }
                    : client
            ));
            this.persistClients(updatedClients);
            const currentClient = updatedClients.find((client) => client.id === matchedClient.id) || matchedClient;

            const displayIdentity = currentClient.username || currentClient.email;
            window.localStorage.removeItem('clientWallet');
            window.localStorage.setItem('clientId', currentClient.id);
            window.localStorage.setItem('clientAccount', displayIdentity);
            window.localStorage.setItem('clientProfile', JSON.stringify({
                id: currentClient.id,
                name: currentClient.name,
                username: currentClient.username,
                email: currentClient.email
            }));
            Router.pushRoute('/client/dashboard');
        } catch (err) {
            this.setState({ errorMessage: err.message });
        }

        this.setState({ loginLoading: false });
    };

    onRegister = async (event) => {
        event.preventDefault();
        this.setState({ registerLoading: true, errorMessage: '', successMessage: '' });

        try {
            const name = this.state.registerName.trim();
            const username = this.state.registerUsername.trim();
            const email = this.state.registerEmail.trim();
            const password = this.state.registerPassword;
            const confirmPassword = this.state.registerConfirmPassword;

            if (!name || !username || !email || !password || !confirmPassword) {
                throw new Error('Complete all register fields.');
            }
            if (!email.includes('@')) {
                throw new Error('Enter a valid email address.');
            }
            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters.');
            }
            if (password !== confirmPassword) {
                throw new Error('Passwords do not match.');
            }

            const clients = this.getStoredClients();
            const usernameTaken = clients.some((client) => this.normalizeIdentity(client.username) === this.normalizeIdentity(username));
            const emailTaken = clients.some((client) => this.normalizeIdentity(client.email) === this.normalizeIdentity(email));

            if (usernameTaken) {
                throw new Error('Username already exists. Choose another username.');
            }
            if (emailTaken) {
                throw new Error('Email is already registered. Try login instead.');
            }

            const nextClients = [
                ...clients,
                {
                    id: `client-${Date.now()}`,
                    name,
                    username,
                    email,
                    password,
                    isActive: false,
                    lastLoginAt: ''
                }
            ];
            this.persistClients(nextClients);

            this.setState({
                successMessage: 'Registration successful. You can now login with email or username.',
                loginIdentity: username,
                loginPassword: '',
                registerName: '',
                registerUsername: '',
                registerEmail: '',
                registerPassword: '',
                registerConfirmPassword: ''
            });
        } catch (err) {
            this.setState({ errorMessage: err.message });
        }

        this.setState({ registerLoading: false });
    };

    render() {
        return (
            <Layout>
                <div className="tm-client-login-page">
                    <section className="hero-shell">
                        <div className="hero-copy">
                            <span className="eyebrow">EVENTCOIN CLIENT</span>
                            <h1>Ticketmaster-style Launchpad</h1>
                            <p>
                                Sign in with your email or username to explore events, buy tickets, and manage barcode passes.
                            </p>
                            <div className="feature-list">
                                <span className="feature-chip">CLIENT CHECKOUT</span>
                                <span className="feature-chip">BARCODE TICKETS</span>
                                <span className="feature-chip">EVENT DASHBOARD</span>
                            </div>
                        </div>

                        {!this.state.showRegister ? (
                            <div className="auth-shell">
                                <article className="auth-card">
                                    <div className="panel-badge">
                                        <Icon name="sign in" />
                                        CLIENT LOGIN
                                    </div>
                                    <h2>Login</h2>
                                    <Form onSubmit={this.onLogin}>
                                        <Form.Input
                                            label="Email or Username"
                                            placeholder="you@example.com or username"
                                            value={this.state.loginIdentity}
                                            onChange={(event) => this.setState({ loginIdentity: event.target.value })}
                                        />
                                        <Form.Input
                                            type="password"
                                            label="Password"
                                            placeholder="Enter password"
                                            value={this.state.loginPassword}
                                            onChange={(event) => this.setState({ loginPassword: event.target.value })}
                                        />
                                        <Button primary fluid className="tm-login-btn" loading={this.state.loginLoading}>
                                            Login as Client
                                        </Button>
                                    </Form>
                                    <div className="signup-row">
                                        <span>New to EventCoin?</span>
                                        <Button
                                            type="button"
                                            basic
                                            color="teal"
                                            className="tm-switch-btn"
                                            onClick={() => this.setState({ showRegister: true, errorMessage: '', successMessage: '' })}
                                        >
                                            SignUp
                                        </Button>
                                    </div>
                                </article>
                            </div>
                        ) : (
                            <div className="auth-shell">
                                <article className="auth-card register">
                                    <div className="panel-badge">
                                        <Icon name="user plus" />
                                        NEW CLIENT
                                    </div>
                                    <h2>Register Client</h2>
                                    <Form onSubmit={this.onRegister}>
                                        <Form.Input
                                            label="Full Name"
                                            placeholder="Enter full name"
                                            value={this.state.registerName}
                                            onChange={(event) => this.setState({ registerName: event.target.value })}
                                        />
                                        <Form.Input
                                            label="Username"
                                            placeholder="Create username"
                                            value={this.state.registerUsername}
                                            onChange={(event) => this.setState({ registerUsername: event.target.value })}
                                        />
                                        <Form.Input
                                            label="Email"
                                            placeholder="Enter email"
                                            value={this.state.registerEmail}
                                            onChange={(event) => this.setState({ registerEmail: event.target.value })}
                                        />
                                        <Form.Input
                                            type="password"
                                            label="Password"
                                            placeholder="Create password"
                                            value={this.state.registerPassword}
                                            onChange={(event) => this.setState({ registerPassword: event.target.value })}
                                        />
                                        <Form.Input
                                            type="password"
                                            label="Confirm Password"
                                            placeholder="Re-enter password"
                                            value={this.state.registerConfirmPassword}
                                            onChange={(event) => this.setState({ registerConfirmPassword: event.target.value })}
                                        />
                                        <Button color="teal" fluid className="tm-register-btn" loading={this.state.registerLoading}>
                                            Register Client
                                        </Button>
                                    </Form>
                                    <div className="signup-row">
                                        <span>Already have an account?</span>
                                        <Button
                                            type="button"
                                            basic
                                            color="blue"
                                            className="tm-switch-btn"
                                            onClick={() => this.setState({ showRegister: false, errorMessage: '', successMessage: '' })}
                                        >
                                            Back to Login
                                        </Button>
                                    </div>
                                </article>
                            </div>
                        )}
                    </section>

                    {this.state.errorMessage ? (
                        <Message error header="Authentication failed" content={this.state.errorMessage} />
                    ) : null}
                    {this.state.successMessage ? (
                        <Message success header="Success" content={this.state.successMessage} />
                    ) : null}
                </div>
                <style jsx>{`
                    .tm-client-login-page {
                        min-height: calc(100vh - 120px);
                        border-radius: 24px;
                        overflow: hidden;
                        background:
                            radial-gradient(circle at top right, rgba(0, 185, 242, 0.28), transparent 28%),
                            linear-gradient(120deg, #00112c 0%, #002d72 45%, #026cdf 100%);
                        box-shadow: 0 24px 48px rgba(2, 32, 96, 0.22);
                        padding: 24px;
                        display: flex;
                        flex-direction: column;
                        gap: 14px;
                    }
                    .hero-shell {
                        display: grid;
                        grid-template-columns: 1.05fr 0.95fr;
                        gap: 16px;
                    }
                    .hero-copy {
                        color: #f8fbff;
                        padding: 16px 12px 0 8px;
                    }
                    .eyebrow {
                        display: inline-flex;
                        margin-bottom: 14px;
                        background: rgba(255, 255, 255, 0.12);
                        border: 1px solid rgba(255, 255, 255, 0.22);
                        border-radius: 999px;
                        padding: 7px 14px;
                        font-size: 0.76rem;
                        font-weight: 800;
                        letter-spacing: 0.12em;
                    }
                    .hero-copy h1 {
                        margin: 0 0 10px;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2.7rem;
                        text-transform: uppercase;
                        letter-spacing: 0.03em;
                    }
                    .hero-copy p {
                        margin: 0 0 14px;
                        color: #d8e6ff;
                        line-height: 1.7;
                    }
                    .feature-list {
                        display: flex;
                        gap: 8px;
                        flex-wrap: wrap;
                    }
                    .feature-chip {
                        background: rgba(255, 255, 255, 0.12);
                        border: 1px solid rgba(255, 255, 255, 0.14);
                        color: #ffffff;
                        border-radius: 999px;
                        padding: 6px 11px;
                        font-size: 0.72rem;
                        font-weight: 800;
                        letter-spacing: 0.08em;
                    }
                    .auth-shell {
                        display: grid;
                        gap: 12px;
                    }
                    .auth-card {
                        border-radius: 22px;
                        border: 1px solid rgba(191, 219, 254, 0.78);
                        box-shadow: 0 18px 30px rgba(0, 20, 61, 0.22);
                        background: rgba(255, 255, 255, 0.96);
                        padding: 16px;
                    }
                    .auth-card.register {
                        border-color: rgba(153, 246, 228, 0.9);
                    }
                    .signup-row {
                        margin-top: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 10px;
                        color: #334155;
                        font-size: 0.88rem;
                    }
                    .panel-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 10px;
                        color: #026cdf;
                        font-size: 0.76rem;
                        font-weight: 800;
                        letter-spacing: 0.11em;
                    }
                    .auth-card h2 {
                        margin: 0 0 10px;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2rem;
                        text-transform: uppercase;
                        color: #00112c;
                    }
                    :global(.auth-card .field > label) {
                        color: #002060 !important;
                        font-weight: 800 !important;
                    }
                    :global(.auth-card .ui.input > input) {
                        border-radius: 12px !important;
                        border: 1px solid #cbd5e1 !important;
                        background: #f8fbff !important;
                    }
                    :global(.tm-login-btn.ui.button),
                    :global(.tm-register-btn.ui.button) {
                        border-radius: 14px !important;
                        font-weight: 800 !important;
                        letter-spacing: 0.04em;
                        text-transform: uppercase;
                    }
                    :global(.tm-login-btn.ui.button) {
                        background: linear-gradient(90deg, #002060 0%, #026cdf 100%) !important;
                    }
                    :global(.tm-register-btn.ui.button) {
                        background: linear-gradient(90deg, #0f766e 0%, #14b8a6 100%) !important;
                        color: #fff !important;
                    }
                    :global(.tm-switch-btn.ui.button) {
                        border-radius: 999px !important;
                        font-weight: 800 !important;
                    }
                    @media (max-width: 980px) {
                        .hero-shell {
                            grid-template-columns: 1fr;
                        }
                        .hero-copy {
                            padding: 4px 2px;
                        }
                    }
                    @media (max-width: 640px) {
                        .tm-client-login-page {
                            padding: 14px;
                        }
                        .hero-copy h1 {
                            font-size: 2.2rem;
                        }
                    }
                `}</style>
            </Layout>
        );
    }
}

export default ClientLogin;
