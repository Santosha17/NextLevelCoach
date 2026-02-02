import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/src/components/Navbar";
import Footer from '../components/Footer';

// ADICIONEI "display: 'swap'" AQUI EM BAIXO 👇
const inter = Inter({
    subsets: ["latin"],
    display: 'swap',
});

// 1. CONFIGURAÇÃO PWA (Viewport & Tema)
export const viewport: Viewport = {
    themeColor: "#0f172a",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

// 2. METADADOS DA APP
export const metadata: Metadata = {
    title: "Coach Next Level",
    description: "A ferramenta definitiva para treinadores de Padel.",
    manifest: "/manifest.json",

    icons: {
        icon: "/icon-192.png",
        shortcut: "/icon-192.png",
        apple: "/icon-192.png",
    },

    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "CNL Coach",
    },
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt">
        {/* O resto mantém-se igual, o inter.className já cá estava bem */}
        <body className={`${inter.className} bg-slate-900 text-white`}>
        <Navbar />
        {children}
        <Footer />
        </body>
        </html>
    );
}