import React from 'react';
import { Container } from 'semantic-ui-react';
import Head from 'next/head';
import Header from './header';

const Layout = (props) => {
    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f7f8fc 0%, #eef2ff 100%)', paddingBottom: '40px' }}>
            <Head>
                <link
                    async
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/semantic-ui@2/dist/semantic.min.css"
                />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=DM+Sans:wght@400;500;700&family=Nunito+Sans:wght@400;600;700;800&family=Syne:wght@500;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <Container style={{ paddingTop: '14px', fontFamily: '"DM Sans", sans-serif' }}>
                <Header />
                <div style={{ marginTop: '16px' }}>
                    {props.children}
                </div>
            </Container>
        </div>
    );
};

export default Layout;
