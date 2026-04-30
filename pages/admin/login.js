import React, { Component } from 'react';
import { Segment, Header, Icon, Grid, Button } from 'semantic-ui-react';
import Layout from '../../components/layout';
import AdminLoginForm from '../../components/adminLoginForm';
import { Link } from '../../routes';

class AdminLogin extends Component {
    render() {
        return (
            <Layout>
                <div className="tm-admin-page">
                    <section className="hero-shell">
                        <div className="hero-copy">
                            <div className="eyebrow">EVENTCOIN ADMIN</div>
                            <p className="hero-text">
                                Sign in to create events, manage on-chain inventory, and validate tickets from a single admin control center.
                            </p>

                            <div className="feature-list">
                                <div className="feature-chip">LIVE EVENT OPS</div>
                                <div className="feature-chip">BARCODE VALIDATION</div>
                                <div className="feature-chip">ON-CHAIN TRACKING</div>
                            </div>

                            <Link route="/" legacyBehavior>
                                <a>
                                    <Button basic inverted className="back-button">
                                        Back to Home
                                    </Button>
                                </a>
                            </Link>
                        </div>

                        <div className="login-panel">
                            <Segment padded="very" className="login-card">
                                <div className="panel-badge">
                                    <Icon name="ticket" />
                                    SECURE ADMIN SIGN-IN
                                </div>
                                <Header as="h2" className="panel-title">
                                    Admin Login
                                </Header>
                                <p className="panel-text">
                                    Enter your admin credentials to continue to the dashboard.
                                </p>
                                <AdminLoginForm
                                    className="tm-login-form"
                                    buttonLabel="Enter Admin Dashboard"
                                />
                            </Segment>
                        </div>
                    </section>
                </div>

                <style jsx>{`
                    .tm-admin-page {
                        min-height: calc(100vh - 120px);
                        border-radius: 24px;
                        overflow: hidden;
                        background:
                            radial-gradient(circle at top right, rgba(0, 185, 242, 0.28), transparent 28%),
                            linear-gradient(120deg, #00112c 0%, #002d72 45%, #026cdf 100%);
                        box-shadow: 0 24px 48px rgba(2, 32, 96, 0.22);
                    }
                    .hero-shell {
                        display: grid;
                        grid-template-columns: 1.15fr 0.85fr;
                        gap: 0;
                        min-height: 74vh;
                    }
                    .hero-copy {
                        padding: 56px 48px;
                        color: #f8fbff;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        position: relative;
                    }
                    .eyebrow {
                        display: inline-flex;
                        align-self: flex-start;
                        margin-bottom: 18px;
                        background: rgba(255, 255, 255, 0.12);
                        border: 1px solid rgba(255, 255, 255, 0.22);
                        border-radius: 999px;
                        padding: 7px 14px;
                        font-size: 0.78rem;
                        font-weight: 800;
                        letter-spacing: 0.12em;
                    }
                    .hero-text {
                        max-width: 520px;
                        color: #d8e6ff;
                        font-size: 1.05rem;
                        line-height: 1.7;
                        margin-bottom: 22px;
                    }
                    .feature-list {
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                        margin-bottom: 24px;
                    }
                    .feature-chip {
                        background: rgba(255, 255, 255, 0.12);
                        border: 1px solid rgba(255, 255, 255, 0.14);
                        color: #ffffff;
                        border-radius: 999px;
                        padding: 7px 12px;
                        font-size: 0.76rem;
                        font-weight: 800;
                        letter-spacing: 0.08em;
                    }
                    .back-button {
                        border-radius: 999px !important;
                        border-color: rgba(255, 255, 255, 0.38) !important;
                        color: #ffffff !important;
                    }
                    .login-panel {
                        background:
                            linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.04));
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 36px;
                    }
                    .login-card {
                        width: 100%;
                        max-width: 460px;
                        border-radius: 28px !important;
                        border: 1px solid rgba(191, 219, 254, 0.78) !important;
                        box-shadow: 0 28px 50px rgba(0, 20, 61, 0.24) !important;
                        background: rgba(255, 255, 255, 0.96) !important;
                    }
                    .panel-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 16px;
                        color: #026cdf;
                        font-size: 0.8rem;
                        font-weight: 800;
                        letter-spacing: 0.11em;
                    }
                    .panel-title {
                        margin: 0 0 10px !important;
                        font-family: 'Barlow Condensed', sans-serif !important;
                        font-size: 2.6rem !important;
                        line-height: 0.95 !important;
                        text-transform: uppercase;
                        color: #00112c !important;
                    }
                    .panel-text {
                        margin-bottom: 20px;
                        color: #475569;
                        font-size: 0.95rem;
                    }
                    :global(.tm-login-form .field > label) {
                        color: #002060 !important;
                        font-weight: 800 !important;
                        letter-spacing: 0.02em;
                    }
                    :global(.tm-login-form .ui.input > input) {
                        border-radius: 14px !important;
                        border: 1px solid #cbd5e1 !important;
                        background: #f8fbff !important;
                        padding: 14px 16px !important;
                    }
                    :global(.tm-login-form .ui.input > input:focus) {
                        border-color: #026cdf !important;
                        box-shadow: 0 0 0 3px rgba(2, 108, 223, 0.12) !important;
                    }
                    :global(.tm-login-form .ui.primary.button) {
                        background: linear-gradient(90deg, #002060 0%, #026cdf 100%) !important;
                        border-radius: 16px !important;
                        font-weight: 800 !important;
                        letter-spacing: 0.04em;
                        text-transform: uppercase;
                        padding-top: 15px !important;
                        padding-bottom: 15px !important;
                        margin-top: 6px !important;
                    }
                    :global(.tm-login-form .ui.error.message) {
                        border-radius: 14px !important;
                    }
                    @media (max-width: 980px) {
                        .hero-shell {
                            grid-template-columns: 1fr;
                        }
                        .hero-copy {
                            padding: 42px 28px 24px;
                        }
                        .login-panel {
                            padding: 16px 16px 28px;
                        }
                    }
                    @media (max-width: 640px) {
                        .panel-title {
                            font-size: 2.1rem !important;
                        }
                    }
                `}</style>
            </Layout>
        );
    }
}

export default AdminLogin;
