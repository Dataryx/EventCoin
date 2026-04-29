import React from 'react';
import { Dropdown, Icon } from 'semantic-ui-react';
import { Router } from '../routes';
import { clearClientSession } from '../ethereum/clientSession';

const ClientAccountDropdown = ({ clientAccount, clientWallet, inverted = false }) => {
    const accountLabel = clientAccount || 'Client Account';
    const walletLabel = clientWallet || 'Wallet not connected';

    const handleNavigate = (route) => {
        Router.pushRoute(route);
    };

    const handleLogout = () => {
        clearClientSession();
        Router.pushRoute('/client/login');
    };

    return (
        <div className={`client-account-dropdown ${inverted ? 'inverted' : ''}`}>
            <Dropdown
                floating
                button
                direction="left"
                className={`account-dropdown-btn ${inverted ? 'inverted' : ''}`}
                trigger={(
                    <span className="account-trigger">
                        <Icon name="user circle outline" />
                        <span className="account-trigger-copy">
                            <strong>{accountLabel}</strong>
                            <small>{walletLabel}</small>
                        </span>
                    </span>
                )}
            >
                <Dropdown.Menu>
                    <Dropdown.Header icon="id badge outline" content={accountLabel} />
                    <Dropdown.Item
                        icon="user outline"
                        text="Profile Details"
                        onClick={() => handleNavigate('/client/profile')}
                    />
                    <Dropdown.Item
                        icon="history"
                        text="Transaction History"
                        onClick={() => handleNavigate('/client/transactions')}
                    />
                    <Dropdown.Divider />
                    <Dropdown.Item
                        icon="sign-out"
                        text="Logout"
                        onClick={handleLogout}
                    />
                </Dropdown.Menu>
            </Dropdown>
            <style jsx>{`
                .client-account-dropdown {
                    min-width: 0;
                }
                .account-trigger {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                }
                .account-trigger-copy {
                    display: inline-flex;
                    flex-direction: column;
                    align-items: flex-start;
                    min-width: 0;
                }
                .account-trigger-copy strong,
                .account-trigger-copy small {
                    max-width: 220px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .account-trigger-copy strong {
                    font-size: 0.84rem;
                    line-height: 1.1;
                }
                .account-trigger-copy small {
                    font-size: 0.7rem;
                    opacity: 0.78;
                }
                :global(.account-dropdown-btn.ui.dropdown) {
                    border-radius: 999px !important;
                    font-weight: 800 !important;
                    letter-spacing: 0.02em;
                    min-width: 0;
                    padding: 10px 14px !important;
                }
                :global(.account-dropdown-btn.ui.dropdown > .dropdown.icon) {
                    margin-left: 10px !important;
                }
                :global(.account-dropdown-btn.inverted.ui.dropdown) {
                    background: rgba(255, 255, 255, 0.1) !important;
                    border: 1px solid rgba(255, 255, 255, 0.22) !important;
                    color: white !important;
                }
                :global(.account-dropdown-btn.ui.dropdown .menu > .item) {
                    font-weight: 700;
                }
                @media (max-width: 640px) {
                    .account-trigger-copy strong,
                    .account-trigger-copy small {
                        max-width: 150px;
                    }
                }
            `}</style>
        </div>
    );
};

export default ClientAccountDropdown;
