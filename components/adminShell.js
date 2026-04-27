import React from 'react';
import { Button, Icon } from 'semantic-ui-react';
import { Link } from '../routes';
import Layout from './layout';

const navSections = [
    {
        title: 'Main',
        items: [
            { label: 'Dashboard', route: '/admin/dashboard' },
            { label: 'Events', route: '/admin/events' },
            { label: 'Ticket Validation', route: '/admin/ticket-validation' }
        ]
    },
    {
        title: 'Finance',
        items: [
            { label: 'Revenue', route: '/admin/revenue' },
            { label: 'Payouts', route: '/admin/payouts' },
            { label: 'Invoices', route: '/admin/invoices' }
        ]
    },
    {
        title: 'System',
        items: [
            { label: 'Integrations', route: '/admin/integrations' },
            { label: 'Audit Logs', route: '/admin/audit-logs' },
            { label: 'Settings', route: '/admin/settings' }
        ]
    }
];

const AdminShell = ({
    activeRoute,
    title,
    subtitle,
    walletAddress,
    topActions,
    heroTitle,
    heroDescription,
    heroActions,
    children
}) => {
    return (
        <Layout>
            <div className="admin-shell">
                <aside className="sidebar">
                    <div>
                        <div className="logo-block">
                            <Icon name="ticket" />
                            <div>
                                <h2>EventCoin</h2>
                                <p>E-Commerce Admin</p>
                            </div>
                        </div>
                        {navSections.map((section) => (
                            <div className="nav-group" key={section.title}>
                                <p className="group-title">{section.title}</p>
                                {section.items.map((item) => (
                                    <Link route={item.route} legacyBehavior key={item.route}>
                                        <a className={`nav-item ${activeRoute === item.route ? 'active' : ''}`}>
                                            {item.label}
                                        </a>
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="wallet-panel">
                        <p className="group-title">Connected Wallet</p>
                        <p className="wallet-address">{walletAddress || 'Not connected'}</p>
                    </div>
                </aside>

                <main className="content">
                    <div className="topbar">
                        <div>
                            <h1>{title}</h1>
                            <p>{subtitle}</p>
                        </div>
                        <div className="topbar-actions">
                            {topActions || (
                                <Link route="/events/new" legacyBehavior>
                                    <a><Button primary>Create Event</Button></a>
                                </Link>
                            )}
                        </div>
                    </div>

                    {heroTitle ? (
                        <section className="hero-banner">
                            <h2>{heroTitle}</h2>
                            <p>{heroDescription}</p>
                            {heroActions ? <div className="hero-actions">{heroActions}</div> : null}
                        </section>
                    ) : null}

                    {children}
                </main>
            </div>

            <style jsx>{`
                .admin-shell {
                    display: grid;
                    grid-template-columns: 250px 1fr;
                    gap: 18px;
                    min-height: calc(100vh - 130px);
                }
                .sidebar {
                    background: #0f172a;
                    color: #f8fafc;
                    border-radius: 16px;
                    padding: 18px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .logo-block {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    margin-bottom: 18px;
                }
                .logo-block h2,
                .content h1,
                .content h2,
                .content h3 {
                    font-family: 'Syne', sans-serif;
                }
                .logo-block h2 {
                    margin: 0;
                    font-size: 1.2rem;
                }
                .logo-block p {
                    margin: 0;
                    color: #94a3b8;
                    font-size: 0.85rem;
                }
                .nav-group {
                    margin-bottom: 18px;
                }
                .group-title {
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    font-size: 0.72rem;
                    margin-bottom: 8px;
                }
                .nav-item {
                    display: block;
                    color: #cbd5e1;
                    padding: 7px 10px;
                    border-radius: 10px;
                    margin-bottom: 4px;
                }
                .nav-item.active {
                    background: #1e3a8a;
                    color: white;
                    font-weight: 700;
                }
                .wallet-panel {
                    border-top: 1px solid #334155;
                    padding-top: 12px;
                }
                .wallet-address {
                    font-size: 0.78rem;
                    word-break: break-word;
                    color: #e2e8f0;
                }
                .content {
                    background: #f8fafc;
                    border-radius: 16px;
                    padding: 18px;
                }
                .topbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 14px;
                }
                .topbar h1 {
                    margin: 0;
                    font-size: 1.65rem;
                    color: #0f172a;
                }
                .topbar p {
                    margin: 4px 0 0;
                    color: #64748b;
                }
                .topbar-actions {
                    display: flex;
                    gap: 10px;
                }
                .hero-banner {
                    background: linear-gradient(110deg, #0f172a, #1e293b);
                    color: #f8fafc;
                    border-radius: 14px;
                    padding: 20px;
                    margin-bottom: 14px;
                }
                .hero-banner h2 {
                    margin-top: 0;
                    font-family: 'Syne', sans-serif;
                }
                .hero-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 10px;
                }
                @media (max-width: 1100px) {
                    .admin-shell {
                        grid-template-columns: 1fr;
                    }
                }
                @media (max-width: 680px) {
                    .topbar {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 10px;
                    }
                }
            `}</style>
        </Layout>
    );
};

export default AdminShell;
