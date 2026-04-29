import React, { useEffect, useState } from 'react';
import web3 from '../ethereum/web3';

const formatEthBalance = (valueWei) => {
    try {
        const formatted = parseFloat(web3.utils.fromWei((valueWei || '0').toString(), 'ether'));
        return `${formatted.toFixed(4)} ETH`;
    } catch (error) {
        return '0.0000 ETH';
    }
};

const ClientWalletBalance = ({ walletAddress, label = 'Live Balance', inverted = false, compact = false }) => {
    const [balanceLabel, setBalanceLabel] = useState('Loading...');

    useEffect(() => {
        let isActive = true;

        const loadBalance = async () => {
            if (!walletAddress) {
                if (isActive) {
                    setBalanceLabel('Wallet not connected');
                }
                return;
            }

            if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
                if (isActive) {
                    setBalanceLabel('MetaMask unavailable');
                }
                return;
            }

            try {
                const valueWei = await web3.eth.getBalance(walletAddress);
                if (isActive) {
                    setBalanceLabel(formatEthBalance(valueWei));
                }
            } catch (error) {
                if (isActive) {
                    setBalanceLabel('Balance unavailable');
                }
            }
        };

        loadBalance();

        const handleWalletUpdate = () => {
            loadBalance();
        };

        if (window.ethereum?.on) {
            window.ethereum.on('accountsChanged', handleWalletUpdate);
            window.ethereum.on('chainChanged', handleWalletUpdate);
        }

        const intervalId = window.setInterval(loadBalance, 15000);

        return () => {
            isActive = false;
            window.clearInterval(intervalId);

            if (window.ethereum?.removeListener) {
                window.ethereum.removeListener('accountsChanged', handleWalletUpdate);
                window.ethereum.removeListener('chainChanged', handleWalletUpdate);
            }
        };
    }, [walletAddress]);

    return (
        <div className={`client-wallet-balance ${inverted ? 'inverted' : ''} ${compact ? 'compact' : ''}`}>
            <span className="balance-label">{label}</span>
            <strong className="balance-value">{balanceLabel}</strong>
            <style jsx>{`
                .client-wallet-balance {
                    display: inline-flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                }
                .balance-label {
                    color: ${inverted ? '#bae6fd' : '#64748b'};
                    font-size: ${compact ? '0.58rem' : '0.66rem'};
                    font-weight: 800;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    line-height: 1.15;
                }
                .balance-value {
                    color: ${inverted ? '#ffffff' : '#0f172a'};
                    font-size: ${compact ? '0.74rem' : '0.96rem'};
                    line-height: 1.2;
                    overflow-wrap: anywhere;
                }
            `}</style>
        </div>
    );
};

export default ClientWalletBalance;
