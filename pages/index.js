import React, { Component } from 'react';
import { Button, Icon } from 'semantic-ui-react';
import Layout from '../components/layout';
import { Link } from '../routes';

class LoginPortal extends Component {
    render() {
        return (
            <Layout>
                <div className="tm-hub-page">
                    <section className="hero-panel">
                        <div className="hero-copy">
                            <h1>EventCoin Commerce Hub</h1>
                            <p className="hero-description">
                                A full event ticketing commerce platform with role-based portals, checkout, barcode tickets, and validation.
                            </p>
                            <div className="hero-tags">
                                <span className="tag">CLIENT CHECKOUT</span>
                                <span className="tag">ADMIN OPS</span>
                                <span className="tag">BARCODE VALIDATION</span>
                            </div>
                        </div>
                        <div className="hero-side-card">
                            <p className="side-kicker">Quick Start</p>
                            <h3>Choose a Portal</h3>
                            <p>Select your role below to enter your dedicated Ticketmaster-inspired experience.</p>
                            <div className="side-list">
                                <span><Icon name="check circle" /> Secure wallet-based access</span>
                                <span><Icon name="check circle" /> Live event inventory</span>
                                <span><Icon name="check circle" /> Instant barcode workflows</span>
                            </div>
                        </div>
                    </section>

                    <section className="portal-grid">
                        <article className="portal-card">
                            <div className="card-head">
                                <span className="pill admin">Admin</span>
                                <h3>Admin Portal</h3>
                            </div>
                            <p>Create events, manage tickets, and validate barcode tickets from an operations-focused dashboard.</p>
                            <Link route="/admin/login" legacyBehavior>
                                <a>
                                    <Button primary icon labelPosition="left" className="tm-btn">
                                        <Icon name="user secret" />
                                        Login as Admin
                                    </Button>
                                </a>
                            </Link>
                        </article>

                        <article className="portal-card">
                            <div className="card-head">
                                <span className="pill client">Client</span>
                                <h3>Client Portal</h3>
                            </div>
                            <p>Explore events, purchase tickets, and view barcode tickets instantly with a modern storefront flow.</p>
                            <Link route="/client/login" legacyBehavior>
                                <a>
                                    <Button color="teal" icon labelPosition="left" className="tm-btn client-btn">
                                        <Icon name="user" />
                                        Login as Client
                                    </Button>
                                </a>
                            </Link>
                        </article>
                    </section>
                </div>
                <style jsx>{`
                    .tm-hub-page {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        font-family: 'Nunito Sans', sans-serif;
                    }
                    .hero-panel {
                        display: grid;
                        grid-template-columns: 1.2fr 0.8fr;
                        gap: 16px;
                        padding: 26px;
                        border-radius: 24px;
                        background:
                            radial-gradient(circle at top right, rgba(0, 185, 242, 0.24), transparent 30%),
                            linear-gradient(125deg, #00112c 0%, #002d72 55%, #026cdf 100%);
                        color: white;
                        box-shadow: 0 24px 48px rgba(0, 32, 96, 0.22);
                    }
                    .kicker {
                        display: inline-block;
                        margin-bottom: 8px;
                        color: #7dd3fc;
                        font-size: 0.74rem;
                        font-weight: 800;
                        letter-spacing: 0.12em;
                        text-transform: uppercase;
                    }
                    .hero-copy h1 {
                        margin: 0;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 3rem;
                        text-transform: uppercase;
                        letter-spacing: 0.03em;
                    }
                    .hero-description {
                        margin: 12px 0 14px;
                        color: #dbeafe;
                        line-height: 1.7;
                        font-size: 1rem;
                        max-width: 620px;
                    }
                    .hero-tags {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                    }
                    .tag {
                        border-radius: 999px;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        background: rgba(255, 255, 255, 0.12);
                        padding: 6px 12px;
                        font-size: 0.72rem;
                        font-weight: 800;
                        letter-spacing: 0.06em;
                    }
                    .hero-side-card {
                        border-radius: 18px;
                        border: 1px solid rgba(255, 255, 255, 0.18);
                        background: rgba(2, 23, 60, 0.45);
                        padding: 16px;
                    }
                    .side-kicker {
                        margin: 0 0 6px;
                        color: #bae6fd;
                        font-size: 0.72rem;
                        text-transform: uppercase;
                        letter-spacing: 0.1em;
                        font-weight: 700;
                    }
                    .hero-side-card h3 {
                        margin: 0 0 8px;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2rem;
                        text-transform: uppercase;
                        letter-spacing: 0.03em;
                    }
                    .hero-side-card p {
                        margin: 0;
                        color: #dbeafe;
                        line-height: 1.6;
                    }
                    .side-list {
                        margin-top: 14px;
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                        font-size: 0.86rem;
                        color: #e0f2fe;
                    }
                    .portal-grid {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 14px;
                    }
                    .portal-card {
                        padding: 18px;
                        border-radius: 20px;
                        border: 1px solid #dbeafe;
                        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                        box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .card-head h3 {
                        margin: 8px 0 0;
                        color: #0f172a;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2rem;
                        text-transform: uppercase;
                        letter-spacing: 0.03em;
                    }
                    .portal-card p {
                        margin: 0;
                        color: #475569;
                        line-height: 1.6;
                    }
                    .pill {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 999px;
                        padding: 5px 10px;
                        font-size: 0.72rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.06em;
                    }
                    .pill.admin {
                        background: #dbeafe;
                        color: #1d4ed8;
                    }
                    .pill.client {
                        background: #ccfbf1;
                        color: #0f766e;
                    }
                    :global(.tm-btn.ui.button) {
                        border-radius: 999px !important;
                        font-weight: 800 !important;
                        letter-spacing: 0.04em;
                        margin-top: 4px;
                    }
                    :global(.client-btn.ui.button) {
                        background: #14b8a6 !important;
                    }
                    @media (max-width: 900px) {
                        .hero-panel,
                        .portal-grid {
                            grid-template-columns: 1fr;
                        }
                        .hero-copy h1 {
                            font-size: 2.3rem;
                        }
                    }
                `}</style>
            </Layout>
        );
    }
}

export default LoginPortal;
