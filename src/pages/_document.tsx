import Document, { DocumentContext, Head, Html, Main, NextScript } from "next/document";
import Script from "next/script";

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en" data-scroll-behavior="smooth">
        <Head>
          <meta name="title" content="Oleh Vanin - Senior Full Stack Engineer" />
          <meta name="author" content="Oleh Vanin" />
          <meta
            name="description"
            content="Oleh Vanin is a senior full-stack engineer and AI engineer building scalable product systems with React, Next.js, Node.js, Go, cloud infrastructure, and LLM workflows."
          />
          <meta
            name="keywords"
            content="Oleh Vanin, Senior Full Stack Engineer, AI Engineer, React, Next.js, Node.js, Go, MCP, LLM"
          />
          <meta name="url" content="https://exsesx.dev" />
          <link rel="canonical" href="https://exsesx.dev" />

          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://exsesx.dev" />
          <meta property="og:title" content="Oleh Vanin - Senior Full Stack Engineer" />
          <meta
            property="og:description"
            content="Senior full-stack engineer and AI engineer building scalable product systems across frontend, backend, cloud, and LLM workflows."
          />
          <meta property="og:image" content="https://exsesx.dev/images/me/oleh-portrait.jpg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="1200" />
          <meta property="og:image:alt" content="Portrait of Oleh Vanin" />

          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content="https://exsesx.dev" />
          <meta property="twitter:title" content="Oleh Vanin - Senior Full Stack Engineer" />
          <meta
            property="twitter:description"
            content="Senior full-stack engineer and AI engineer building scalable product systems across frontend, backend, cloud, and LLM workflows."
          />
          <meta property="twitter:image" content="https://exsesx.dev/images/me/oleh-portrait.jpg" />

          <meta name="google-site-verification" content="NlY8lg13Q1xV0C0JlIkIOnqfpfTWHHY7IwSn-rHdIAc" />

          <link
            id="favicon-light"
            rel="icon"
            type="image/svg+xml"
            href="/favicon/favicon-light.svg"
            media="(prefers-color-scheme: light)"
          />
          <link
            id="favicon-dark"
            rel="icon"
            type="image/svg+xml"
            href="/favicon/favicon-dark.svg"
            media="(prefers-color-scheme: dark)"
          />
          <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
          <link rel="manifest" href="/favicon/site.webmanifest" />
          <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#18181b" />
          <link rel="shortcut icon" href="/favicon/favicon.ico" />
          <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
        </Head>
        <body>
          <Script src="/scripts/noflash.js" strategy="beforeInteractive" />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
