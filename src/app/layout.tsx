import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "rsuite/dist/rsuite.css";
import ClientProvider from "./ClientProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PointsGo",
  description: "PointsGo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClientProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClientProvider>
  );
}
