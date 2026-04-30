const BARCODE_PREFIX = 'EC-TICKET-';

export const BARCODE_FORMAT = 'CODE128';

export const createTicketBarcodeValue = (ticketId) => `${BARCODE_PREFIX}${String(ticketId || '').trim()}`;

export const parseTicketBarcodeValue = (rawValue) => {
    const normalizedValue = String(rawValue || '').trim().toUpperCase();

    if (!normalizedValue) {
        throw new Error('Barcode value is required.');
    }

    const prefixedMatch = normalizedValue.match(/^EC-TICKET-(\d+)$/);
    if (prefixedMatch) {
        return {
            ticketId: prefixedMatch[1],
            barcodeValue: `${BARCODE_PREFIX}${prefixedMatch[1]}`
        };
    }

    const numericMatch = normalizedValue.match(/^(\d+)$/);
    if (numericMatch) {
        return {
            ticketId: numericMatch[1],
            barcodeValue: `${BARCODE_PREFIX}${numericMatch[1]}`
        };
    }

    throw new Error('Barcode value is invalid. Expected format EC-TICKET-<ticketId>.');
};

const parseLegacyQrPayload = (ticket) => {
    if (!ticket?.qrPayload) {
        return null;
    }

    try {
        return JSON.parse(ticket.qrPayload);
    } catch (error) {
        return null;
    }
};

export const normalizeStoredTicket = (ticket) => {
    if (!ticket) {
        return ticket;
    }

    const { qrPayload, ...ticketWithoutLegacyQr } = ticket;
    const legacyPayload = parseLegacyQrPayload(ticket);
    const resolvedTicketId = String(
        ticket.ticketId ??
        legacyPayload?.ticketId ??
        ''
    ).trim();

    if (!resolvedTicketId) {
        return ticket;
    }

    const barcodeValue = (() => {
        if (ticket.barcodeValue) {
            try {
                return parseTicketBarcodeValue(ticket.barcodeValue).barcodeValue;
            } catch (error) {
                return createTicketBarcodeValue(resolvedTicketId);
            }
        }

        return createTicketBarcodeValue(resolvedTicketId);
    })();

    return {
        ...ticketWithoutLegacyQr,
        ticketId: resolvedTicketId,
        barcodeValue,
        eventAddress: ticket.eventAddress || legacyPayload?.eventAddress || '',
        buyerAddress: ticket.buyerAddress || legacyPayload?.buyerAddress || '',
        issuedAt: ticket.issuedAt || legacyPayload?.issuedAt || ''
    };
};
