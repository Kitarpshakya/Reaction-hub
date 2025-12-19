import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/auth/SessionProvider";
import Header from "@/components/layout/Header";
import { ModalProvider } from "@/lib/contexts/ModalContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reaction Hub - Interactive Periodic Table",
  description: "Explore chemistry interactively with 3D visualizations and compound creation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0F0F1E] text-white`}
      >
        <SessionProvider>
          <ModalProvider>
            <Header />
            <main className="pt-14">
              {children}
            </main>
          </ModalProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
