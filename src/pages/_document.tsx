import Document, { DocumentContext, Head, Html, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <meta name="title" content="Oleh Vanin - Personal Web Page" />
          <meta name="author" content="Oleh Vanin" />
          <meta
            name="description"
            content="Oleh Vanin is a software engineer specializing in building websites, applications, and everything in between."
          />
          <meta name="keywords" content="Oleh Vanin, Engineer, Software Engineer, Developer" />
          <meta name="url" content="https://exsesx.dev" />
          <link rel="canonical" href="https://exsesx.dev" />

          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://exsesx.dev" />
          <meta property="og:title" content="Oleh Vanin - Personal Web Page" />
          <meta
            property="og:description"
            content="Oleh Vanin is a software engineer specializing in building websites, applications, and everything in between."
          />
          <meta
            property="og:image"
            content="https://avatars.githubusercontent.com/u/20399517?s=460&u=7659ff2e4394643c56a6223b310f3492cd6feb1f&v=4"
          />

          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content="https://exsesx.dev" />
          <meta property="twitter:title" content="Oleh Vanin - Personal Web Page" />
          <meta
            property="twitter:description"
            content="Oleh Vanin is a software engineer specializing in building websites, applications, and everything in between."
          />
          <meta
            property="twitter:image"
            content="https://avatars.githubusercontent.com/u/20399517?s=460&u=7659ff2e4394643c56a6223b310f3492cd6feb1f&v=4"
          />

          <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
          <link rel="manifest" href="/favicon/site.webmanifest" />
          <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#262626" />
          <link rel="shortcut icon" href="/favicon/favicon.ico" />
          <meta name="msapplication-TileColor" content="#ffffff" />
          <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
          <meta name="theme-color" content="#262626" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
