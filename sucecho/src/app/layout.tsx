// sucecho/src/app/layout.tsx
import type { Metadata } from "next";
import { Noto_Sans_SC, Roboto_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import FramerWrapper from "./components/FramerWrapper";
import { FingerprintProvider } from '@/context/FingerprintContext';
import { AdminProvider } from "@/context/AdminContext";
import UserStatusBanner from "./components/UserStatusBanner";
import OnboardingWrapper from "./components/OnboardingWrapper";
import { SvgGlowFilter } from "./components/Icon";
import FabContainer from "./components/FabContainer";

const notoSans = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  weight: ["400", "700"],
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "SUC回音壁",
  description: "声音只存在一天。",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon', sizes: 'any' }
    ],
    apple: '/apple-touch-icon.png',
  }
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#9F70FD" />
      </head>
      <body className={`${notoSans.variable} ${robotoMono.variable} antialiased`}>
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        <SvgGlowFilter />
        <AdminProvider>
          <FingerprintProvider>
            <OnboardingWrapper>
              <UserStatusBanner />
              <Header />
              <FramerWrapper>{children}</FramerWrapper>
              <FabContainer />
            </OnboardingWrapper>
          </FingerprintProvider>
        </AdminProvider>
      </body>
    </html>
  );
}