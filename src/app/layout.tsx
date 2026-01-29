import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/src/components/Navbar";
import Footer from '../components/Footer';

const inter = Inter({ subsets: ["latin"] });

// 1. CONFIGURAÇÃO PWA (Viewport & Tema)
// Define a cor da barra de topo (status bar) e bloqueia o zoom para parecer app nativa
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
    manifest: "/manifest.json", // O ficheiro que diz ao telemóvel que isto é uma App

    // Ícones: Usamos o quadrado (192px) para não deformar
    icons: {
        icon: "/icon-192.png",       // Favicon do browser
        shortcut: "/icon-192.png",   // Atalhos
        apple: "/icon-192.png",      // Ícone do iPhone (IMPORTANTE ser quadrado)
    },

    // Definições específicas da Apple
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
        <body className={`${inter.className} bg-slate-900 text-white`}>
        <Navbar />
        {children}
        <Footer />
        </body>
        </html>
    );
}