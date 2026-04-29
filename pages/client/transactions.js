import React, { Component } from 'react';
import { Button } from 'semantic-ui-react';
import Layout from '../../components/layout';
import { getClientSession } from '../../ethereum/clientSession';
import { formatEthValue, getClientTransactions } from '../../ethereum/clientTransactions';
import { Link } from '../../routes';

class ClientTransactionsPage extends Component {
    state = {
        clientAccount: '',
        clientWallet: '',
        transactions: []
    };

    componentDidMount() {
        const session = getClientSession();
        this.setState({
            clientAccount: session.clientAccount,
            clientWallet: session.clientWallet,
            transactions: getClientTransactions()
        });
    }

    getDateParts(value) {
        if (!value) {
            return { dateLabel: 'Unknown date', timeLabel: '' };
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return { dateLabel: value, timeLabel: '' };
        }

        return {
            dateLabel: parsed.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }),
            timeLabel: parsed.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            })
        };
    }

    getEthParts(valueWei) {
        const formatted = formatEthValue(valueWei);
        const [amount, unit] = formatted.split(' ');

        return {
            amount: amount || '0.0000',
            unit: unit || 'ETH'
        };
    }

    formatSingleLineDate(value) {
        if (!value) {
            return 'Unknown date';
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }

        return parsed.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    renderTransactionRows() {
        if (!this.state.transactions.length) {
            return (
                <div className="empty-history">
                    <p>No ticket purchases recorded for this client yet.</p>
                </div>
            );
        }

        return (
            <div className="history-table-wrap">
                <table className="history-table">
                    <colgroup>
                        <col className="col-event" />
                        <col className="col-qty" />
                        <col className="col-paid" />
                        <col className="col-hash" />
                        <col className="col-date" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Event</th>
                            <th>Qty</th>
                            <th>ETH Paid</th>
                            <th>Tx Hash</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.transactions.map((transaction, index) => {
                            const { amount, unit } = this.getEthParts(transaction.ethPaidWei);
                            const singleLineDate = this.formatSingleLineDate(transaction.purchasedAt);
                            const eventDisplay = `${transaction.eventName || 'Unnamed Event'} | ${transaction.eventAddress || 'Unavailable'}`;

                            return (
                            <tr key={`${transaction.txHash}-${transaction.eventAddress}-${index}`}>
                                <td className="event-cell mono">{eventDisplay}</td>
                                <td className="qty-cell">{transaction.qty || 1}</td>
                                <td className="paid-cell mono">{`${amount} ${unit}`}</td>
                                <td className="hash-cell mono">{transaction.txHash || 'Unavailable'}</td>
                                <td className="date-cell">{singleLineDate}</td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    render() {
        return (
            <Layout>
                <div className="tm-client-transactions-page">
                    <section className="hero-panel">
                        <div className="hero-copy">
                            <span className="kicker">Client Ledger</span>
                            <h1>Transaction History</h1>
                            <p>Review every ticket purchase linked to this client session, including payment amount and blockchain transaction hash.</p>
                        </div>
                        <div className="hero-side">
                            <span className="side-label">Current Client</span>
                            <h3>{this.state.clientAccount || 'Not signed in'}</h3>
                            <p>{this.state.clientWallet || 'Wallet not connected yet'}</p>
                        </div>
                    </section>

                    <section className="history-panel">
                        <div className="panel-header">
                            <h3>Ticket Purchases</h3>
                            <Link route="/client/dashboard" legacyBehavior>
                                <a><Button className="back-btn">Back to Dashboard</Button></a>
                            </Link>
                        </div>
                        {this.renderTransactionRows()}
                    </section>
                </div>
                <style jsx>{`
                    .tm-client-transactions-page {
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
                    .history-panel {
                        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                        border: 1px solid #dbeafe;
                        border-radius: 20px;
                        padding: 18px;
                        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
                    }
                    .panel-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                        margin-bottom: 14px;
                    }
                    .panel-header h3 {
                        margin: 0;
                        color: #0f172a;
                        font-family: 'Barlow Condensed', sans-serif;
                        font-size: 1.9rem;
                        text-transform: uppercase;
                    }
                    .history-table-wrap {
                        overflow-x: auto;
                    }
                    .history-table {
                        width: 100%;
                        table-layout: fixed;
                        min-width: 980px;
                        border-collapse: separate;
                        border-spacing: 0;
                        border: 1px solid #dbeafe;
                        border-radius: 16px;
                        overflow: hidden;
                        background: white;
                    }
                    .history-table th,
                    .history-table td {
                        padding: 8px 7px;
                        text-align: left;
                        border-bottom: 1px solid #e2e8f0;
                        vertical-align: middle;
                        color: #0f172a;
                        font-size: 0.58rem;
                        white-space: nowrap;
                        line-height: 1.1;
                    }
                    .history-table th {
                        background: #eff6ff;
                        color: #1e3a8a;
                        font-size: 0.54rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        line-height: 1.1;
                    }
                    .col-event { width: 39%; }
                    .col-qty { width: 6%; }
                    .col-paid { width: 12%; }
                    .col-hash { width: 26%; }
                    .col-date { width: 17%; }
                    .history-table tbody tr:last-child td {
                        border-bottom: 0;
                    }
                    .history-table tbody tr:hover {
                        background: #f8fbff;
                    }
                    .mono {
                        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                        font-size: 0.54rem;
                    }
                    .qty-cell {
                        text-align: center;
                        font-size: 0.62rem;
                        font-weight: 800;
                    }
                    .paid-cell,
                    .date-cell,
                    .event-cell,
                    .hash-cell {
                        overflow: visible;
                    }
                    .hash-cell {
                        color: #1e293b;
                    }
                    .empty-history {
                        border: 1px dashed #bfd7ff;
                        border-radius: 16px;
                        background: white;
                        padding: 20px;
                        text-align: center;
                    }
                    .empty-history p {
                        margin: 0;
                        color: #64748b;
                    }
                    :global(.back-btn.ui.button) {
                        border-radius: 999px !important;
                        background: #eff6ff !important;
                        color: #1d4ed8 !important;
                        border: 1px solid #bfdbfe !important;
                        font-weight: 800 !important;
                    }
                    @media (max-width: 900px) {
                        .hero-panel {
                            grid-template-columns: 1fr;
                        }
                    }
                    @media (max-width: 680px) {
                        .panel-header {
                            flex-direction: column;
                            align-items: flex-start;
                        }
                        .history-panel {
                            padding: 14px;
                        }
                        .history-table {
                            min-width: 920px;
                        }
                        .history-table th,
                        .history-table td {
                            padding: 8px 6px;
                            font-size: 0.52rem;
                        }
                        .history-table th {
                            font-size: 0.48rem;
                            letter-spacing: 0.04em;
                        }
                        .col-event { width: 39%; }
                        .col-qty { width: 7%; }
                        .col-paid { width: 12%; }
                        .col-hash { width: 26%; }
                        .col-date { width: 16%; }
                        .mono,
                        .qty-cell {
                            font-size: 0.48rem;
                        }
                    }
                    @media (max-width: 520px) {
                        .history-table {
                            min-width: 880px;
                        }
                        .history-table th,
                        .history-table td {
                            padding: 7px 5px;
                            font-size: 0.48rem;
                        }
                        .history-table th {
                            font-size: 0.44rem;
                        }
                        .mono,
                        .qty-cell {
                            font-size: 0.44rem;
                        }
                    }
                `}</style>
            </Layout>
        );
    }
}

export default ClientTransactionsPage;
