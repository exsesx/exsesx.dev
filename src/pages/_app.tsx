import { AppProps } from "next/app";
import Head from "next/head";
import MainLayout from "../layouts/MainLayout";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Oleh Vanin - Personal Web Page</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <MainLayout>
        <Component {...pageProps} />
      </MainLayout>
    </>
  );
}

export default MyApp;
