const normalizeValue = (value) => (value || '').trim().toLowerCase();

const getClientIdentities = (session) => {
    const candidates = [
        session?.clientId,
        session?.clientAccount,
        session?.clientProfile?.username,
        session?.clientProfile?.email,
        session?.clientIdentity
    ];

    return [...new Set(candidates.map(normalizeValue).filter(Boolean))];
};

const parseStoredProfile = () => {
    if (typeof window === 'undefined') {
        return {};
    }

    try {
        const rawProfile = window.localStorage.getItem('clientProfile');
        return rawProfile ? JSON.parse(rawProfile) : {};
    } catch (error) {
        return {};
    }
};

export const getClientSession = () => {
    if (typeof window === 'undefined') {
        return {
            clientAccount: '',
            clientWallet: '',
            clientId: '',
            clientProfile: {},
            clientIdentity: ''
        };
    }

    const clientProfile = parseStoredProfile();
    const clientAccount = window.localStorage.getItem('clientAccount') || '';
    const clientWallet = window.localStorage.getItem('clientWallet') || '';
    const clientId = window.localStorage.getItem('clientId') || clientProfile.id || '';
    const clientIdentity = normalizeValue(clientId || clientAccount || clientProfile.username || clientProfile.email);

    return {
        clientAccount,
        clientWallet,
        clientId,
        clientProfile,
        clientIdentity
    };
};

export const clearClientSession = () => {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.removeItem('clientId');
    window.localStorage.removeItem('clientAccount');
    window.localStorage.removeItem('clientProfile');
    window.localStorage.removeItem('clientWallet');
};

export const isTicketOwnedByClient = (ticket, session) => {
    if (!ticket) {
        return false;
    }

    const clientIdentities = getClientIdentities(session);
    const storedPurchaserIdentity = normalizeValue(ticket.purchaserClientId || ticket.purchaserId);

    if (storedPurchaserIdentity && clientIdentities.length) {
        return clientIdentities.includes(storedPurchaserIdentity);
    }

    if (storedPurchaserIdentity) {
        return false;
    }

    const clientWallet = normalizeValue(session?.clientWallet);
    const buyerAddress = normalizeValue(ticket.buyerAddress);

    if (!clientIdentities.length && clientWallet && buyerAddress) {
        return buyerAddress === clientWallet;
    }

    return false;
};
