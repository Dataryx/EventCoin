const STORAGE_KEY = 'eventCoinAuditLogs';
const MAX_LOGS = 500;

const safeParse = (rawValue) => {
    try {
        return rawValue ? JSON.parse(rawValue) : [];
    } catch (error) {
        return [];
    }
};

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const sanitizeDetails = (details) => {
    if (!details || typeof details !== 'object' || Array.isArray(details)) {
        return {};
    }

    return Object.entries(details).reduce((accumulator, [key, value]) => {
        if (value === undefined || value === null || value === '') {
            return accumulator;
        }

        accumulator[key] = typeof value === 'string' ? value.trim() : value;
        return accumulator;
    }, {});
};

const sortLogs = (logs) => (
    [...logs].sort((left, right) => new Date(right.at || 0).getTime() - new Date(left.at || 0).getTime())
);

export const getStoredAuditLogs = () => {
    if (typeof window === 'undefined') {
        return [];
    }

    return sortLogs(safeParse(window.localStorage.getItem(STORAGE_KEY)));
};

export const persistAuditLog = (entry) => {
    if (typeof window === 'undefined' || !entry) {
        return null;
    }

    const timestamp = entry.at || new Date().toISOString();
    const nextEntry = {
        id: entry.id || `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: timestamp,
        actorName: normalizeText(entry.actorName) || 'Unknown user',
        actorRole: normalizeText(entry.actorRole) || 'system',
        actorId: normalizeText(entry.actorId),
        walletAddress: normalizeText(entry.walletAddress),
        action: normalizeText(entry.action) || 'Unknown action',
        status: normalizeText(entry.status) || 'success',
        entityType: normalizeText(entry.entityType),
        entityId: normalizeText(entry.entityId),
        route: normalizeText(entry.route),
        details: sanitizeDetails(entry.details)
    };

    const existingLogs = getStoredAuditLogs();
    const nextLogs = [nextEntry, ...existingLogs].slice(0, MAX_LOGS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextLogs));

    return nextEntry;
};

export const formatAuditTimestamp = (value) => {
    if (!value) {
        return 'Unknown time';
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
        minute: '2-digit',
        second: '2-digit'
    });
};
