import Event from './event';
import { isTicketOwnedByClient } from './clientSession';
import { normalizeStoredTicket } from './ticketBarcode';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const readStoredTickets = (eventAddress) => {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const rawValue = window.localStorage.getItem(`clientTickets:${eventAddress}`);
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

    window.localStorage.setItem(`clientTickets:${eventAddress}`, JSON.stringify(tickets.map(normalizeStoredTicket)));
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
