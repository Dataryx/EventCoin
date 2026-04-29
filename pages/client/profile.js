import React, { Component } from 'react';
import { Button } from 'semantic-ui-react';
import Layout from '../../components/layout';
import ClientWalletBalance from '../../components/clientWalletBalance';
import { getClientSession } from '../../ethereum/clientSession';
import { Link } from '../../routes';

class ClientProfilePage extends Component {
    state = {
        clientAccount: '',
        clientWallet: '',
        clientProfile: {},
        clientId: ''
    };

    componentDidMount() {
        const session = getClientSession();
        this.setState({
            clientAccount: session.clientAccount,
            clientWallet: session.clientWallet,
            clientProfile: session.clientProfile || {},
            clientId: session.clientId || ''
        });
    }

    render() {
        const { clientAccount, clientWallet, clientProfile, clientId } = this.state;

        return (
            <Layout>
                <div className="tm-client-profile-page">
                    <section className="hero-panel">
                        <div className="hero-copy">
                            <span className="kicker">Client Profile</span>
                            <h1>Profile Details</h1>
                            <p>Review the current client identity, account details, and connected wallet information.</p>
                        </div>
                        <div className="hero-side">
                            <span className="side-label">Current Client</span>
                            <h3>{clientAccount || 'Not signed in'}</h3>
                            <p>{clientWallet || 'Wallet not connected yet'}</p>
                        </div>
                    </section>

                    <section className="profile-panel">
                        <div className="profile-header">
                            <h3>Client Details</h3>
                            <Link route="/client/dashboard" legacyBehavior>
                                <a><Button className="back-btn">Back to Dashboard</Button></a>
                            </Link>
                        </div>
                        <div className="details-grid">
                            <article className="detail-card">
                                <span>Full Name</span>
                                <strong>{clientProfile.name || 'Not available'}</strong>
                            </article>
                            <article className="detail-card">
                                <span>Username</span>
                                <strong>{clientProfile.username || clientAccount || 'Not available'}</strong>
                            </article>
                            <article className="detail-card">
                                <span>Email</span>
                                <strong>{clientProfile.email || 'Not available'}</strong>
                            </article>
                            <article className="detail-card">
                                <span>Client ID</span>
                                <strong className="mono">{clientId || 'Not available'}</strong>
                            </article>
                            <article className="detail-card full">
                                <span>Connected Wallet</span>
                                <strong className="mono">{clientWallet || 'Wallet not connected yet'}</strong>
                                <div className="balance-panel">
                                    <ClientWalletBalance
                                        walletAddress={clientWallet}
                                        label="Live MetaMask ETH Balance"
                                    />
                                </div>
                            </article>
                        </div>
                    </section>
                </div>
                <style jsx>{`
                    .tm-client-profile-page {
                        display: flex;
                        flex-direction: column;
                        gap: 14px;
                        font-family: 'Nunito Sans', sans-serif;
                    }
                    .hero-panel {
                        display: grid;
                        grid-template-columns: 1.1fr 0.9fr;
                        gap: 16px;
                        padding: 24px;
                        border-radius: 24px;
                        background: radial-gradient(circle at top right, rgba(0, 185, 242, 0.24), transparent 30%), linear-gradient(125deg, #00112c 0%, #002d72 55%, #026cdf 100%);
                        color: white;
                        box-shadow: 0 24px 44px rgba(0, 32, 96, 0.2);
                    }
                    .kicker, .side-label {
                        display: inline-block;
                        margin-bottom: 8px;
                        font-size: 0.72rem;
                        text-transform: uppercase;
                        letter-spacing: 0.11em;
                        font-weight: 800;
                        color: #7dd3fc;
                    }
                    .hero-copy h1 {
                        margin: 0 0 8px;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2.6rem;
                        text-transform: uppercase;
                    }
                    .hero-copy p {
                        margin: 0;
                        color: #dbeafe;
                        line-height: 1.6;
                    }
                    .hero-side {
                        border-radius: 18px;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        background: rgba(2, 23, 60, 0.42);
                        padding: 16px;
                    }
                    .hero-side h3 {
                        margin: 0 0 6px;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 2rem;
                        text-transform: uppercase;
                    }
                    .hero-side p {
                        margin: 0;
                        color: #dbeafe;
                        word-break: break-word;
                    }
                    .profile-panel {
                        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                        border: 1px solid #dbeafe;
                        border-radius: 20px;
                        padding: 18px;
                        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
                    }
                    .profile-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                        margin-bottom: 14px;
                    }
                    .profile-header h3 {
                        margin: 0;
                        color: #0f172a;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 1.9rem;
                        text-transform: uppercase;
                    }
                    .details-grid {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 12px;
                    }
                    .detail-card {
                        border-radius: 16px;
                        background: white;
                        border: 1px solid #dbeafe;
                        padding: 14px;
                    }
                    .detail-card.full {
                        grid-column: 1 / -1;
                    }
                    .balance-panel {
                        margin-top: 12px;
                        padding-top: 12px;
                        border-top: 1px solid #dbeafe;
                    }
                    .detail-card span {
                        display: block;
                        margin-bottom: 6px;
                        color: #64748b;
                        font-size: 0.72rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                    }
                    .detail-card strong {
                        color: #0f172a;
                        font-size: 0.96rem;
                        line-height: 1.5;
                        word-break: break-word;
                    }
                    .mono {
                        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                        word-break: break-all;
                    }
                    :global(.back-btn.ui.button) {
                        border-radius: 999px !important;
                        background: #eff6ff !important;
                        color: #1d4ed8 !important;
                        border: 1px solid #bfdbfe !important;
                        font-weight: 800 !important;
                    }
                    @media (max-width: 900px) {
                        .hero-panel,
                        .details-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                    @media (max-width: 560px) {
                        .profile-header {
                            flex-direction: column;
                            align-items: flex-start;
                        }
                    }
                `}</style>
            </Layout>
        );
    }
}

export default ClientProfilePage;
