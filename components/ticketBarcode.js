import React from 'react';
import JsBarcode from 'jsbarcode';
import { BARCODE_FORMAT } from '../ethereum/ticketBarcode';

const TicketBarcode = ({
    value,
    id,
    width = 2,
    height = 88,
    displayValue = false
}) => {
    const svgRef = React.useRef(null);

    React.useEffect(() => {
        if (!svgRef.current || !value) {
            return;
        }

        JsBarcode(svgRef.current, value, {
            format: BARCODE_FORMAT,
            lineColor: '#0f172a',
            background: 'transparent',
            width,
            height,
            margin: 0,
            displayValue,
            textMargin: 8,
            fontOptions: 'bold'
        });
    }, [value, width, height, displayValue]);

    return <svg ref={svgRef} id={id} role="img" aria-label={`Ticket barcode ${value}`} />;
};

export default TicketBarcode;
