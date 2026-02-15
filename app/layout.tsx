import { Toaster } from "@/components/ui/sonner";
import { TanstackQueryProvider } from "@/providers/tanstack-query";
import type { Metadata } from "next";
import { Merriweather, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

export const metadata: Metadata = {
  title: "Servix",
  description: "Servix é uma plataforma SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${merriweather.variable} font-sans antialiased`}
      >
        <TanstackQueryProvider>
          {children}
          <Toaster />
        </TanstackQueryProvider>
      </body>
    </html>
  );
}
