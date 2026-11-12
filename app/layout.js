import { Inter, Noto_Sans_Bengali } from "next/font/google";

import { AppProviders } from "../components/providers/AppProviders.js";
import { BRAND_LOGO_SRC } from "../lib/branding.js";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bengali",
  display: "swap",
});

export const metadata = {
  title: "Krishi Mama — Climate Intelligence for Agriculture",
  description:
    "NASA-powered climate-informed agricultural decision support for Bangladesh, starting with Chattogram.",
  icons: {
    icon: BRAND_LOGO_SRC,
    apple: BRAND_LOGO_SRC,
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${bengali.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
