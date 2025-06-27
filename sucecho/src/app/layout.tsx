// sucecho/src/app/layout.tsx
import type { Metadata } from "next";
import { Noto_Sans_SC, Roboto_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import FramerWrapper from "./components/FramerWrapper";
import { FingerprintProvider } from '@/context/FingerprintContext';
import { AdminProvider } from "@/context/AdminContext";
import AdminShield from "./components/AdminShield";
import UserStatusBanner from "./components/UserStatusBanner";
import OnboardingWrapper from "./components/OnboardingWrapper";
import { SvgGlowFilter } from "./components/Icon";

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
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en">
      <body className={`${notoSans.variable} ${robotoMono.variable} antialiased`}>
        {/* --- ADDED STAR LAYERS --- */}
        {/* These divs are the elements that will be animated to create the parallax star effect. */}
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        {/* --- END OF ADDED STAR LAYERS --- */}

        <SvgGlowFilter />
        <AdminProvider>
          <FingerprintProvider>
            <OnboardingWrapper>
              <UserStatusBanner />
              <Header />
              <FramerWrapper>{children}</FramerWrapper>
              <AdminShield />
            </OnboardingWrapper>
          </FingerprintProvider>
        </AdminProvider>
      </body>
    </html>
  );
}