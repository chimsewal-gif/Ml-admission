import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import HeaderWrapper from "@/componets/HeaderWrapper"; // client wrapper
import BreadcrumbWrapper from "@/componets/BreadcrumbWrapper"; // Add this

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mzuzu University - Admissions Portal",
  description: "Official Admissions Portal for Mzuzu University. Apply for undergraduate, postgraduate, diploma, and certificate programs.",
  keywords: "Mzuzu University, admissions, university application, higher education, Malawi",
  authors: [{ name: "Mzuzu University" }],
  creator: "Mzuzu University",
  publisher: "Mzuzu University",
  robots: "index, follow",
  openGraph: {
    title: "Mzuzu University - Admissions Portal",
    description: "Official Admissions Portal for Mzuzu University",
    type: "website",
    locale: "en_MW",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <HeaderWrapper />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}