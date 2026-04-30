import React, { Component } from 'react';
import { Button, Icon } from 'semantic-ui-react';
import Layout from '../components/layout';
import { Link } from '../routes';

class LoginPortal extends Component {
    render() {
        return (
            <Layout>
                <div className="tm-home-page">
                    <section className="hero-shell">
                        <div className="hero-panel">
                            <div className="hero-copy">
                                <span className="eyebrow">LIVE EVENT PLATFORM</span>
                                <h1>EventCoin</h1>
                                <p className="hero-description">
                                    Modern ticketing with bold event discovery, client checkout, barcode entry, and admin control in one fast portal.
                                </p>
                                <div className="hero-actions">
                                    <Link route="/client/login" legacyBehavior>
                                        <a>
                                            <Button primary size="large" icon labelPosition="left" className="tm-btn tm-btn-primary">
                                                <Icon name="ticket" />
                                                Explore Events
                                            </Button>
                                        </a>
                                    </Link>
                                    <Link route="/admin/login" legacyBehavior>
                                        <a>
                                            <Button size="large" icon labelPosition="left" className="tm-btn tm-btn-secondary">
                                                <Icon name="setting" />
                                                Open Admin
                                            </Button>
                                        </a>
                                    </Link>
                                </div>
                                <div className="hero-tags">
                                    <span className="tag">SMART TICKETS</span>
                                    <span className="tag">CLIENT PORTAL</span>
                                    <span className="tag">ENTRY CONTROL</span>
                                </div>
                            </div>

                            <div className="hero-stage-card">
                                <div className="stage-top">
                                    <span className="stage-pill">Live Platform</span>
                                    <span className="stage-status">Live</span>
                                </div>
                                <h3>Built for modern event operations</h3>
                                <p className="stage-description">
                                    EventCoin brings client ticket access and admin control into one polished live-events platform with a faster, cleaner first impression.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="portal-grid">
                        <article className="portal-card admin-card">
                            <div className="card-head">
                                <span className="pill admin">Admin</span>
                                <h3>Admin Portal</h3>
                            </div>
                            <p>Launch events, monitor activity, validate tickets, and run venue operations from a control-room dashboard.</p>
                            <div className="card-points">
                                <span>Audit logs</span>
                                <span>Client management</span>
                                <span>Ticket validation</span>
                            </div>
                            <Link route="/admin/login" legacyBehavior>
                                <a>
                                    <Button primary icon labelPosition="left" className="tm-btn">
                                        <Icon name="user secret" />
                                        Login as Admin
                                    </Button>
                                </a>
                            </Link>
                        </article>

                        <article className="portal-card client-card">
                            <div className="card-head">
                                <span className="pill client">Client</span>
                                <h3>Client Portal</h3>
                            </div>
                            <p>Sign in, discover events, purchase seats, and keep barcode tickets ready for entry from one sleek account flow.</p>
                            <div className="card-points">
                                <span>Event discovery</span>
                                <span>Wallet checkout</span>
                                <span>Barcode wallet</span>
                            </div>
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
                    .tm-home-page {
                        display: flex;
                        flex-direction: column;
                        gap: 18px;
                        font-family: 'Nunito Sans', sans-serif;
                    }
                    .hero-shell {
                        display: flex;
                        flex-direction: column;
                        gap: 14px;
                    }
                    .hero-panel {
                        position: relative;
                        overflow: hidden;
                        display: grid;
                        grid-template-columns: 1.15fr 0.85fr;
                        gap: 18px;
                        padding: 30px;
                        border-radius: 28px;
                        background:
                            radial-gradient(circle at 20% 10%, rgba(65, 105, 225, 0.28), transparent 28%),
                            radial-gradient(circle at 90% 20%, rgba(0, 204, 255, 0.24), transparent 24%),
                            linear-gradient(135deg, #071127 0%, #0c2b68 45%, #0a56d8 100%);
                        color: white;
                        box-shadow: 0 30px 60px rgba(3, 20, 67, 0.28);
                    }
                    .hero-panel::after {
                        content: '';
                        position: absolute;
                        inset: auto -8% -18% auto;
                        width: 340px;
                        height: 340px;
                        border-radius: 50%;
                        background: radial-gradient(circle, rgba(255, 255, 255, 0.15), transparent 65%);
                        pointer-events: none;
                    }
                    .eyebrow {
                        display: inline-block;
                        margin-bottom: 12px;
                        color: #d8f1ff;
                        font-size: 0.76rem;
                        font-weight: 800;
                        letter-spacing: 0.12em;
                        text-transform: uppercase;
                        padding: 8px 14px;
                        border-radius: 999px;
                        border: 1px solid rgba(255, 255, 255, 0.18);
                        background: rgba(255, 255, 255, 0.08);
                    }
                    .hero-copy h1 {
                        margin: 0;
                        font-family: 'Syne', sans-serif;
                        font-size: 4rem;
                        letter-spacing: -0.04em;
                        line-height: 0.95;
                    }
                    .hero-description {
                        margin: 16px 0 18px;
                        color: #dbeafe;
                        line-height: 1.7;
                        font-size: 1.02rem;
                        max-width: 560px;
                    }
                    .hero-actions {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        margin-bottom: 18px;
                    }
                    .hero-tags {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                    }
                    .tag {
                        border-radius: 999px;
                        border: 1px solid rgba(255, 255, 255, 0.16);
                        background: rgba(255, 255, 255, 0.1);
                        padding: 7px 12px;
                        font-size: 0.72rem;
                        font-weight: 800;
                        letter-spacing: 0.09em;
                    }
                    .hero-stage-card {
                        position: relative;
                        z-index: 1;
                        border-radius: 22px;
                        border: 1px solid rgba(255, 255, 255, 0.16);
                        background: linear-gradient(180deg, rgba(6, 19, 48, 0.72) 0%, rgba(6, 32, 86, 0.48) 100%);
                        padding: 18px;
                        backdrop-filter: blur(12px);
                    }
                    .stage-top {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 8px;
                        margin-bottom: 12px;
                    }
                    .stage-pill,
                    .stage-status {
                        border-radius: 999px;
                        padding: 6px 12px;
                        font-size: 0.72rem;
                        font-weight: 800;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                    }
                    .stage-pill {
                        color: #dbeafe;
                        background: rgba(255, 255, 255, 0.08);
                    }
                    .stage-status {
                        color: #082f49;
                        background: #67e8f9;
                    }
                    .hero-stage-card h3 {
                        margin: 0 0 14px;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2rem;
                        text-transform: uppercase;
                        letter-spacing: 0.03em;
                    }
                    .stage-description {
                        margin: 0;
                        color: #dbeafe;
                        line-height: 1.7;
                        max-width: 360px;
                    }
                    .portal-grid {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 16px;
                    }
                    .portal-card {
                        position: relative;
                        overflow: hidden;
                        padding: 22px;
                        border-radius: 24px;
                        border: 1px solid #dbeafe;
                        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                        box-shadow: 0 18px 34px rgba(15, 23, 42, 0.08);
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .portal-card::before {
                        content: '';
                        position: absolute;
                        inset: 0 0 auto 0;
                        height: 5px;
                    }
                    .admin-card::before {
                        background: linear-gradient(90deg, #1d4ed8 0%, #38bdf8 100%);
                    }
                    .client-card::before {
                        background: linear-gradient(90deg, #0f766e 0%, #22c55e 100%);
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
                    .card-points {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                    }
                    .card-points span {
                        border-radius: 999px;
                        padding: 6px 10px;
                        background: #eff6ff;
                        color: #1d4ed8;
                        font-size: 0.74rem;
                        font-weight: 700;
                    }
                    .client-card .card-points span {
                        background: #ecfeff;
                        color: #0f766e;
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
                        box-shadow: none !important;
                    }
                    :global(.tm-btn-primary.ui.button) {
                        background: linear-gradient(90deg, #0ea5e9 0%, #2563eb 100%) !important;
                    }
                    :global(.tm-btn-secondary.ui.button) {
                        background: rgba(255, 255, 255, 0.08) !important;
                        border: 1px solid rgba(255, 255, 255, 0.2) !important;
                        color: #ffffff !important;
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
                            font-size: 2.8rem;
                        }
                    }
                    @media (max-width: 640px) {
                        .hero-panel {
                            padding: 18px;
                        }
                        .hero-actions {
                            flex-direction: column;
                        }
                    }
                `}</style>
            </Layout>
        );
    }
}

export default LoginPortal;
