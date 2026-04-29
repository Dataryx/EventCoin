import React from 'react';
import Head from 'next/head';
import Header from './header';

const Layout = ({ children, wallet, nav, hideHeader = false, title }) => {
    return (
        <div className="min-h-screen bg-bg text-fg flex flex-col">
            <Head>
                <title>{title ? `${title} · EventCoin` : 'EventCoin'}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                <meta name="theme-color" content="#FAFAF7" media="(prefers-color-scheme: light)" />
                <meta name="theme-color" content="#0B0B0A" media="(prefers-color-scheme: dark)" />
            </Head>
            {!hideHeader ? <Header wallet={wallet} nav={nav} /> : null}
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
};

export default Layout;
