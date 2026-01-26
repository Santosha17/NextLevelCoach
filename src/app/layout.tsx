import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/src/components/Navbar";
import Footer from '../components/Footer';

const inter = Inter({ subsets: ["latin"] });

// 1. CONFIGURAÇÃO PWA (Viewport & Tema)
// Isto define a cor da barra de topo do telemóvel e impede o zoom indesejado
export const viewport: Viewport = {
    themeColor: "#0f172a", // A cor Slate-900 do teu fundo
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Faz com que pareça uma app nativa (não dá para fazer pinch-zoom)
};

// 2. METADADOS DA APP
export const metadata: Metadata = {
    title: "Coach Next Level",
    description: "A ferramenta definitiva para treinadores de Padel.",
    manifest: "/manifest.json", // O ficheiro que criámos antes
    icons: {
        icon: "/logo.png",
        shortcut: "/logo.png",
        apple: "/logo.png", // Ícone para iPhone
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
        <body className={`${inter.className} bg-slate-900 text-white`}>
        <Navbar />
        {children}
        <Footer />
        </body>
        </html>
    );
}