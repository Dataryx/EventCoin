import Document, { Html, Head, Main, NextScript } from 'next/document';

const NO_FLASH = `(function(){try{var s=localStorage.getItem('theme');var d=s==='dark'||((s==='system'||!s)&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

class MyDocument extends Document {
    render() {
        return (
            <Html lang="en">
                <Head />
                <body className="bg-bg text-fg antialiased">
                    <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}

export default MyDocument;
