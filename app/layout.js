import { Inter, Noto_Sans_Bengali } from "next/font/google";

import { AppProviders } from "../components/providers/AppProviders.js";
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
};

/** Applies the persisted theme before first paint to avoid a flash of the wrong mode. */
const themeInitScript = `(function(){try{var t=localStorage.getItem('km-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${bengali.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
