import { type AppType } from "next/app";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { createTheme, MantineProvider } from "@mantine/core";
import { api } from "~/utils/api";


import "~/styles/globals.css";
import "@mantine/core/styles.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});
const theme = createTheme({
  /** Put your mantine theme override here */
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ClerkProvider {...pageProps}>
      <MantineProvider theme={theme} forceColorScheme="dark">
        <main className={`font-sans ${inter.variable}`}>
          <Component {...pageProps} />
        </main>
      </MantineProvider>
    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
