import React from 'react';
import { Wallet } from 'lucide-react';
import { cn } from '../../lib/cn';

const truncate = (addr) => {
    if (!addr || typeof addr !== 'string') return '';
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
};

export const WalletPill = ({ address, className, ...props }) => (
    <span
        className={cn(
            'inline-flex items-center gap-2 rounded-full border border-border bg-surface',
            'px-3 py-1.5 text-xs font-mono text-fg/80',
            className
        )}
        title={address || ''}
        {...props}
    >
        <Wallet size={13} strokeWidth={1.75} className="text-accent" />
        {address ? truncate(address) : 'Not connected'}
    </span>
);

export default WalletPill;
