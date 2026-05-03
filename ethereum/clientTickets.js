import Event from './event';
import { isTicketOwnedByClient } from './clientSession';
import { normalizeStoredTicket } from './ticketBarcode';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const CLIENT_TICKET_STORAGE_PREFIX = 'clientTickets:';
const CLIENT_TICKET_STORAGE_VERSION_KEY = 'eventCoinClientTicketStorageVersion';
const CLIENT_TICKET_STORAGE_VERSION = '2026-05-03-reset-1';

const getStorageKey = (eventAddress) => `${CLIENT_TICKET_STORAGE_PREFIX}${eventAddress}`;

const getTicketKeys = () => {
    if (typeof window === 'undefined') {
        return [];
    }

    return Object.keys(window.localStorage).filter((key) => key.startsWith(CLIENT_TICKET_STORAGE_PREFIX));
};

export const ensureClientTicketStorageVersion = () => {
    if (typeof window === 'undefined') {
        return;
    }

    const currentVersion = window.localStorage.getItem(CLIENT_TICKET_STORAGE_VERSION_KEY);
    if (currentVersion === CLIENT_TICKET_STORAGE_VERSION) {
        return;
    }

    getTicketKeys().forEach((key) => {
        window.localStorage.removeItem(key);
    });

    window.localStorage.setItem(CLIENT_TICKET_STORAGE_VERSION_KEY, CLIENT_TICKET_STORAGE_VERSION);
};

const readStoredTickets = (eventAddress) => {
    if (typeof window === 'undefined') {
        return [];
    }

    ensureClientTicketStorageVersion();

    try {
        const rawValue = window.localStorage.getItem(getStorageKey(eventAddress));
        const parsedTickets = rawValue ? JSON.parse(rawValue) : [];
        return Array.isArray(parsedTickets) ? parsedTickets.map(normalizeStoredTicket) : [];
    } catch (error) {
        return [];
    }
};

const writeStoredTickets = (eventAddress, tickets) => {
    if (typeof window === 'undefined') {
        return;
    }

    ensureClientTicketStorageVersion();
    window.localStorage.setItem(
        getStorageKey(eventAddress),
        JSON.stringify(tickets.map(normalizeStoredTicket))
    );
};

export const upsertStoredClientTickets = (eventAddress, tickets, session) => {
    const allTickets = readStoredTickets(eventAddress);
    const unrelatedTickets = session
        ? allTickets.filter((ticket) => !isTicketOwnedByClient(ticket, session))
        : allTickets;
    const normalizedTickets = (tickets || []).map(normalizeStoredTicket);

    writeStoredTickets(eventAddress, [...unrelatedTickets, ...normalizedTickets]);
};

export const removeStoredClientTicket = (eventAddress, ticketId, session) => {
    const allTickets = readStoredTickets(eventAddress);
    const nextTickets = allTickets.filter((ticket) => {
        const sameTicket = String(ticket.ticketId) === String(ticketId);
        const ownedByClient = session ? isTicketOwnedByClient(ticket, session) : true;
        return !(sameTicket && ownedByClient);
    });

    writeStoredTickets(eventAddress, nextTickets);
};

export const reconcileClientTicketsForEvent = async (eventAddress, session) => {
    const allTickets = readStoredTickets(eventAddress);
    const ownedTickets = allTickets.filter((ticket) => isTicketOwnedByClient(ticket, session));

    if (!ownedTickets.length) {
        return [];
    }

    const reconciledOwnedTickets = await Promise.all(ownedTickets.map(async (ticket) => {
        try {
            const ticketDetails = await Event(eventAddress).methods.tickets(ticket.ticketId).call();
            const onChainOwner = (ticketDetails.owner || ticketDetails[0] || '').toLowerCase();
            const isUsedOnChain = Boolean(ticketDetails.isUsed || ticketDetails[1]);
            const buyerAddress = (ticket.buyerAddress || '').toLowerCase();

            const isRefunded = !onChainOwner ||
                onChainOwner === ZERO_ADDRESS ||
                (buyerAddress && onChainOwner !== buyerAddress);

            if (isRefunded) {
                return null;
            }

            return {
                ...ticket,
                isUsedOnChain
            };
        } catch (error) {
            return ticket;
        }
    }));

    const activeOwnedTickets = reconciledOwnedTickets.filter(Boolean);
    const unrelatedTickets = allTickets.filter((ticket) => !isTicketOwnedByClient(ticket, session));
    writeStoredTickets(eventAddress, [...unrelatedTickets, ...activeOwnedTickets]);

    return activeOwnedTickets;
};
