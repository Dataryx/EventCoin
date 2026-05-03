import { formatEthFromWei, formatUsdFromWei, multiplyWeiAmount } from './ethPricing';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 42;
const TOP_PADDING = 58;
const BOTTOM_PADDING = 54;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
const SECTION_GAP = 12;

const COLORS = {
    brand: [0.01, 0.13, 0.38],
    accent: [0.02, 0.42, 0.87],
    accentSoft: [0.9, 0.95, 1],
    border: [0.84, 0.89, 0.95],
    text: [0.09, 0.13, 0.17],
    muted: [0.38, 0.45, 0.54],
    white: [1, 1, 1],
    successSoft: [0.9, 0.98, 0.93]
};

const getByteLength = (value) => {
    if (typeof TextEncoder !== 'undefined') {
        return new TextEncoder().encode(value).length;
    }

    return String(value || '').length;
};

const sanitizeText = (value) => (
    String(value ?? '')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
);

const escapePdfText = (value) => (
    sanitizeText(value)
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
);

const colorCommand = (type, color) => `${color[0]} ${color[1]} ${color[2]} ${type}`;

const formatDateTime = (value) => {
    if (!value) {
        return 'Not available';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return sanitizeText(value);
    }

    return parsed.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
};

const estimateCharLimit = (fontSize, width) => {
    const avgCharWidth = fontSize * 0.52;
    return Math.max(12, Math.floor(width / avgCharWidth));
};

const wrapText = (value, fontSize, width = CONTENT_WIDTH) => {
    const text = sanitizeText(value);
    if (!text) {
        return [''];
    }

    const maxChars = estimateCharLimit(fontSize, width);
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach((word) => {
        if (!word) {
            return;
        }

        if (word.length > maxChars) {
            if (currentLine) {
                lines.push(currentLine);
                currentLine = '';
            }

            for (let index = 0; index < word.length; index += maxChars) {
                lines.push(word.slice(index, index + maxChars));
            }
            return;
        }

        const nextLine = currentLine ? `${currentLine} ${word}` : word;
        if (nextLine.length <= maxChars) {
            currentLine = nextLine;
            return;
        }

        if (currentLine) {
            lines.push(currentLine);
        }
        currentLine = word;
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.length ? lines : [''];
};

const getLineHeight = (fontSize) => Math.max(fontSize + 4, 14);

const createPage = () => ({ commands: [] });

const addTextCommand = (page, text, x, y, fontSize = 11, bold = false, color = COLORS.text) => {
    page.commands.push([
        'BT',
        `/${bold ? 'F2' : 'F1'} ${fontSize} Tf`,
        colorCommand('rg', color),
        `1 0 0 1 ${x} ${y} Tm`,
        `(${escapePdfText(text)}) Tj`,
        'ET'
    ].join('\n'));
};

const addRectCommand = (page, x, topY, width, height, options = {}) => {
    const y = topY - height;
    const parts = ['q'];

    if (options.fillColor) {
        parts.push(colorCommand('rg', options.fillColor));
    }
    if (options.strokeColor) {
        parts.push(colorCommand('RG', options.strokeColor));
    }
    if (options.lineWidth) {
        parts.push(`${options.lineWidth} w`);
    }

    parts.push(`${x} ${y} ${width} ${height} re`);

    if (options.fillColor && options.strokeColor) {
        parts.push('B');
    } else if (options.fillColor) {
        parts.push('f');
    } else {
        parts.push('S');
    }

    parts.push('Q');
    page.commands.push(parts.join('\n'));
};

const addLineCommand = (page, x1, y1, x2, y2, color = COLORS.border, lineWidth = 1) => {
    page.commands.push([
        'q',
        colorCommand('RG', color),
        `${lineWidth} w`,
        `${x1} ${y1} m`,
        `${x2} ${y2} l`,
        'S',
        'Q'
    ].join('\n'));
};

const createDocument = () => {
    const pages = [];
    let page = createPage();
    let cursorY = PAGE_HEIGHT - TOP_PADDING;

    const startPage = () => {
        page = createPage();
        pages.push(page);
        cursorY = PAGE_HEIGHT - TOP_PADDING;

        addRectCommand(page, MARGIN, PAGE_HEIGHT - 18, CONTENT_WIDTH, 4, {
            fillColor: COLORS.accent
        });
        addTextCommand(page, 'EventCoin Admin Export', MARGIN, PAGE_HEIGHT - 34, 9, true, COLORS.muted);
    };

    const ensureSpace = (height) => {
        if (!pages.length) {
            startPage();
        } else if (cursorY - height < BOTTOM_PADDING) {
            startPage();
        }
    };

    const moveDown = (amount) => {
        cursorY -= amount;
    };

    const writeLines = ({ lines, x = MARGIN, fontSize = 11, bold = false, color = COLORS.text, gapAfter = 0 }) => {
        const lineHeight = getLineHeight(fontSize);
        const requiredHeight = (lines.length * lineHeight) + gapAfter;

        ensureSpace(requiredHeight);

        lines.forEach((line) => {
            addTextCommand(page, line, x, cursorY, fontSize, bold, color);
            cursorY -= lineHeight;
        });

        cursorY -= gapAfter;
    };

    startPage();

    return {
        pages,
        get page() {
            return page;
        },
        get cursorY() {
            return cursorY;
        },
        set cursorY(value) {
            cursorY = value;
        },
        ensureSpace,
        moveDown,
        writeLines
    };
};

const renderParagraph = (doc, text, options = {}) => {
    const fontSize = options.fontSize || 11;
    const width = options.width || CONTENT_WIDTH;
    const x = options.x || MARGIN;
    const lines = wrapText(text, fontSize, width);

    if (options.gapBefore) {
        doc.moveDown(options.gapBefore);
    }

    doc.writeLines({
        lines,
        x,
        fontSize,
        bold: Boolean(options.bold),
        color: options.color || COLORS.text,
        gapAfter: options.gapAfter || 0
    });
};

const renderSectionHeader = (doc, title) => {
    doc.ensureSpace(34);
    addRectCommand(doc.page, MARGIN, doc.cursorY, CONTENT_WIDTH, 24, {
        fillColor: COLORS.brand
    });
    addTextCommand(doc.page, title, MARGIN + 12, doc.cursorY - 16, 12, true, COLORS.white);
    doc.moveDown(32);
};

const renderSummaryTiles = (doc, payload) => {
    const summary = payload.summary || {};
    const ethUsdRate = summary.ethUsdRate || payload.ethUsdRate || null;
    const tiles = [
        { label: 'Total Events', value: String(summary.totalEvents || 0) },
        { label: 'Tickets Sold', value: String(summary.ticketsSold || 0) },
        { label: 'Tickets Used', value: String(summary.ticketsUsed || 0) },
        {
            label: 'Revenue',
            value: formatUsdFromWei(summary.revenueWei || 0, ethUsdRate),
            note: formatEthFromWei(summary.revenueWei || 0)
        }
    ];
    const tileWidth = (CONTENT_WIDTH - 12) / 2;
    const tileHeight = 58;

    doc.ensureSpace((tileHeight * 2) + 18);

    for (let index = 0; index < tiles.length; index += 1) {
        const row = Math.floor(index / 2);
        const column = index % 2;
        const x = MARGIN + (column * (tileWidth + 12));
        const topY = doc.cursorY - (row * (tileHeight + 12));
        const tile = tiles[index];

        addRectCommand(doc.page, x, topY, tileWidth, tileHeight, {
            fillColor: row === 1 && column === 1 ? COLORS.successSoft : COLORS.accentSoft,
            strokeColor: COLORS.border,
            lineWidth: 1
        });
        addTextCommand(doc.page, tile.label, x + 12, topY - 18, 9, true, COLORS.muted);
        addTextCommand(doc.page, tile.value, x + 12, topY - 37, 15, true, COLORS.brand);
        if (tile.note) {
            addTextCommand(doc.page, tile.note, x + 12, topY - 50, 8, false, COLORS.muted);
        }
    }

    doc.moveDown((tileHeight * 2) + 16);
};

const renderMetaBlock = (doc, payload) => {
    doc.ensureSpace(104);

    renderParagraph(doc, 'EventCoin Admin Export Report', {
        fontSize: 20,
        bold: true,
        color: COLORS.brand,
        gapAfter: 2
    });
    renderParagraph(doc, `Exported: ${formatDateTime(payload.exportedAt)}`, {
        fontSize: 10,
        color: COLORS.muted
    });
    renderParagraph(doc, `Admin account: ${payload.adminAccount || 'Not available'}`, {
        fontSize: 10,
        color: COLORS.muted,
        gapAfter: 14
    });

    addRectCommand(doc.page, MARGIN, doc.cursorY, CONTENT_WIDTH, 1, {
        fillColor: COLORS.border
    });
    doc.moveDown(12);
};

const getEventCardHeight = (event) => {
    const titleLines = wrapText(event.name || 'Unnamed Event', 13, CONTENT_WIDTH - 28).length;
    const descriptionLines = wrapText(event.description || 'Not available', 10, CONTENT_WIDTH - 28).length;

    return 24 + (titleLines * getLineHeight(13)) + (5 * getLineHeight(10)) + (descriptionLines * getLineHeight(10)) + 18;
};

const renderEventCards = (doc, payload) => {
    const events = payload.events || [];
    const ethUsdRate = payload.summary?.ethUsdRate || payload.ethUsdRate || null;

    renderSectionHeader(doc, 'Events');

    if (!events.length) {
        renderParagraph(doc, 'No event records available.', {
            fontSize: 10,
            color: COLORS.muted,
            gapAfter: SECTION_GAP
        });
        return;
    }

    events.forEach((event, index) => {
        const eventRevenueWei = multiplyWeiAmount(event.ticketPriceWei, event.ticketsSold);
        const cardHeight = getEventCardHeight(event);
        const innerX = MARGIN + 14;
        let y;

        doc.ensureSpace(cardHeight + 10);
        addRectCommand(doc.page, MARGIN, doc.cursorY, CONTENT_WIDTH, cardHeight, {
            fillColor: COLORS.white,
            strokeColor: COLORS.border,
            lineWidth: 1
        });

        y = doc.cursorY - 18;
        addTextCommand(doc.page, `${index + 1}. ${event.name || 'Unnamed Event'}`, innerX, y, 13, true, COLORS.brand);
        y -= getLineHeight(13);

        [
            `Contract: ${event.address || 'Not available'}`,
            `Date: ${formatDateTime(event.eventDate)}`,
            `Ticket Price: ${formatUsdFromWei(event.ticketPriceWei || 0, ethUsdRate)} | ${formatEthFromWei(event.ticketPriceWei || 0)}`,
            `Revenue: ${formatUsdFromWei(eventRevenueWei, ethUsdRate)} | ${formatEthFromWei(eventRevenueWei)}`,
            `Supply: ${event.ticketSupply || 0} | Sold: ${event.ticketsSold || 0} | Tickets Used: ${event.ticketsUsed || 0}`
        ].forEach((line) => {
            addTextCommand(doc.page, line, innerX, y, 10, false, COLORS.text);
            y -= getLineHeight(10);
        });

        wrapText(`Description: ${event.description || 'Not available'}`, 10, CONTENT_WIDTH - 28).forEach((line) => {
            addTextCommand(doc.page, line, innerX, y, 10, false, COLORS.muted);
            y -= getLineHeight(10);
        });

        doc.moveDown(cardHeight + 10);
    });
};

const getListItemHeight = (primary, secondary, width) => {
    const primaryLines = wrapText(primary, 10, width).length;
    const secondaryLines = wrapText(secondary, 9, width).length;

    return 16 + (primaryLines * getLineHeight(10)) + (secondaryLines * getLineHeight(9)) + 12;
};

const renderListSection = (doc, title, items, emptyMessage) => {
    renderSectionHeader(doc, title);

    if (!items.length) {
        renderParagraph(doc, emptyMessage, {
            fontSize: 10,
            color: COLORS.muted,
            gapAfter: SECTION_GAP
        });
        return;
    }

    items.forEach((item) => {
        const rowHeight = getListItemHeight(item.primary, item.secondary, CONTENT_WIDTH - 26);
        const innerX = MARGIN + 13;
        let y;

        doc.ensureSpace(rowHeight + 8);
        addRectCommand(doc.page, MARGIN, doc.cursorY, CONTENT_WIDTH, rowHeight, {
            fillColor: COLORS.white,
            strokeColor: COLORS.border,
            lineWidth: 1
        });

        y = doc.cursorY - 16;
        wrapText(item.primary, 10, CONTENT_WIDTH - 26).forEach((line) => {
            addTextCommand(doc.page, line, innerX, y, 10, true, COLORS.text);
            y -= getLineHeight(10);
        });
        wrapText(item.secondary, 9, CONTENT_WIDTH - 26).forEach((line) => {
            addTextCommand(doc.page, line, innerX, y, 9, false, COLORS.muted);
            y -= getLineHeight(9);
        });

        doc.moveDown(rowHeight + 8);
    });
};

const buildTicketItems = (payload) => (
    (payload.purchasedTickets || []).map((ticket, index) => ({
        primary: `${index + 1}. ${ticket.eventName || 'Unnamed Event'} | Ticket #${ticket.ticketId} | ${ticket.status || 'Unknown'}`,
        secondary: `Owner: ${ticket.ownerName || 'Unknown client'} | Wallet: ${ticket.ownerAddress || 'Not available'} | Event Contract: ${ticket.eventAddress || 'Not available'}`
    }))
);

const buildClientItems = (payload) => (
    (payload.clients || []).map((client, index) => ({
        primary: `${index + 1}. ${client.name || 'Unnamed Client'} | ${client.email || 'No email'}`,
        secondary: `Username: ${client.username || 'No username'} | Status: ${client.isActive ? 'Active' : 'Registered'} | Last Login: ${formatDateTime(client.lastLoginAt)}`
    }))
);

const buildTransactionItems = (payload) => {
    const ethUsdRate = payload.summary?.ethUsdRate || payload.ethUsdRate || null;

    return (payload.clientTransactions || []).map((transaction, index) => {
        const actionLabel = transaction.type === 'refund' ? 'Refund' : 'Purchase';
        return {
            primary: `${index + 1}. ${actionLabel} | ${transaction.eventName || 'Unnamed Event'} | Qty: ${transaction.qty || 1} | ${formatUsdFromWei(transaction.ethPaidWei || 0, ethUsdRate)} | ${formatEthFromWei(transaction.ethPaidWei || 0)}`,
            secondary: `Date: ${formatDateTime(transaction.purchasedAt)} | Tx: ${transaction.txHash || 'Not available'} | Event Contract: ${transaction.eventAddress || 'Not available'}`
        };
    });
};

const buildAuditItems = (payload) => (
    (payload.auditLogs || []).map((log, index) => {
        const detailsText = Object.entries(log.details || {})
            .map(([key, value]) => `${sanitizeText(key)}: ${sanitizeText(value)}`)
            .join(' | ');

        return {
            primary: `${index + 1}. ${formatDateTime(log.at)} | ${log.action || 'Unknown action'} | ${log.status || 'unknown'}`,
            secondary: `Actor: ${log.actorName || 'Unknown'} (${log.actorRole || 'system'}) | Route: ${log.route || 'Not available'}${detailsText ? ` | Details: ${detailsText}` : ''}`
        };
    })
);

const finalizePages = (pages) => {
    pages.forEach((page, index) => {
        addLineCommand(page, MARGIN, 36, PAGE_WIDTH - MARGIN, 36, COLORS.border, 1);
        addTextCommand(page, `Page ${index + 1} of ${pages.length}`, PAGE_WIDTH - MARGIN - 70, 22, 9, false, COLORS.muted);
    });
};

const buildPdf = (pages) => {
    const objects = [];

    const addObject = (content) => {
        objects.push(content);
        return objects.length;
    };

    const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const pageObjectIds = [];
    const contentObjectIds = [];

    pages.forEach((page) => {
        const commands = page.commands.join('\n');
        const stream = `<< /Length ${getByteLength(commands)} >>\nstream\n${commands}\nendstream`;
        const contentObjectId = addObject(stream);
        contentObjectIds.push(contentObjectId);

        const pageObjectId = addObject('');
        pageObjectIds.push(pageObjectId);
    });

    const kids = pageObjectIds.map((id) => `${id} 0 R`).join(' ');
    const pagesId = addObject(`<< /Type /Pages /Kids [${kids}] /Count ${pageObjectIds.length} >>`);
    const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

    pageObjectIds.forEach((pageObjectId, index) => {
        objects[pageObjectId - 1] = [
            '<<',
            '/Type /Page',
            `/Parent ${pagesId} 0 R`,
            `/MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}]`,
            `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >>`,
            `/Contents ${contentObjectIds[index]} 0 R`,
            '>>'
        ].join('\n');
    });

    let pdf = '%PDF-1.4\n';
    const offsets = [0];

    objects.forEach((object, index) => {
        offsets.push(getByteLength(pdf));
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = getByteLength(pdf);
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';

    offsets.slice(1).forEach((offset) => {
        pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return pdf;
};

export const createAdminExportPdfBlob = (payload) => {
    const doc = createDocument();

    renderMetaBlock(doc, payload || {});
    renderSectionHeader(doc, 'Summary');
    renderSummaryTiles(doc, payload || {});
    renderEventCards(doc, payload || {});
    renderListSection(doc, 'Purchased Tickets', buildTicketItems(payload || {}), 'No purchased ticket records available.');
    renderListSection(doc, 'Clients', buildClientItems(payload || {}), 'No client records available.');
    renderListSection(doc, 'Client Transactions', buildTransactionItems(payload || {}), 'No transaction records available.');
    renderListSection(doc, 'Audit Logs', buildAuditItems(payload || {}), 'No audit logs available.');

    finalizePages(doc.pages);

    return new Blob([buildPdf(doc.pages)], { type: 'application/pdf' });
};
