import type { Metadata } from "next";
import { Noto_Sans_SC, Roboto_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import FramerWrapper from "./components/FramerWrapper";
import { FingerprintProvider } from '@/context/FingerprintContext'; // Import the provider

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
  title: "SUC Echo",
  description: "Sounds only exist for a day.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${notoSans.variable} ${robotoMono.variable} antialiased`}
      >
        <FingerprintProvider> {/* Wrap everything with the provider */}
          <Header />
          <FramerWrapper>{children}</FramerWrapper>
        </FingerprintProvider>
      </body>
    </html>
  );
}