import web3 from './web3';
import { getClientSession } from './clientSession';

const STORAGE_KEY = 'clientTransactions';

const safeParse = (rawValue) => {
    try {
        return rawValue ? JSON.parse(rawValue) : [];
    } catch (error) {
        return [];
    }
};

export const getStoredClientTransactions = () => {
    if (typeof window === 'undefined') {
        return [];
    }

    return safeParse(window.localStorage.getItem(STORAGE_KEY));
};

export const getClientTransactions = () => {
    const session = getClientSession();
    const identities = new Set(
        [
            session.clientId,
            session.clientAccount,
            session.clientProfile?.username,
            session.clientProfile?.email,
            session.clientIdentity
        ]
            .map((value) => (value || '').trim().toLowerCase())
            .filter(Boolean)
    );

    return getStoredClientTransactions()
        .filter((entry) => {
            const purchaserIdentity = (entry.purchaserClientId || entry.purchaserId || '').trim().toLowerCase();

            if (purchaserIdentity && identities.size) {
                return identities.has(purchaserIdentity);
            }

            return false;
        })
        .sort((left, right) => new Date(right.purchasedAt || 0).getTime() - new Date(left.purchasedAt || 0).getTime());
};

export const persistClientTransaction = (transaction) => {
    if (typeof window === 'undefined' || !transaction) {
        return;
    }

    const existingTransactions = getStoredClientTransactions();
    const nextTransactions = [transaction, ...existingTransactions];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTransactions));
};

export const formatEthValue = (valueWei) => {
    try {
        return `${parseFloat(web3.utils.fromWei((valueWei || '0').toString(), 'ether')).toFixed(4)} ETH`;
    } catch (error) {
        return '0.0000 ETH';
    }
};

export const formatTransactionDate = (value) => {
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
};

export const shortenHash = (hash) => {
    if (!hash) {
        return 'Unavailable';
    }

    if (hash.length <= 16) {
        return hash;
    }

    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};
