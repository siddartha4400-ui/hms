import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import ClientLayout from "./ClientLayout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HotelSphere — Hospitality Management Platform",
  description: "Manage your entire hotel portfolio in one place. Real-time bookings, occupancy, and revenue across all properties.",
  icons: {
    icon: "/brand/hotel-sphere-icon.png",
    shortcut: "/brand/hotel-sphere-icon.png",
    apple: "/brand/hotel-sphere-icon.png",
  },
};

// Runs before React hydration to avoid theme flash
const themeScript = `
  (function(){
    try {
      var t = localStorage.getItem('hs-theme') || 'dark';
      document.documentElement.setAttribute('data-theme', t);
    } catch(e){}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
