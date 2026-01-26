import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/src/components/Navbar";
import Footer from '../components/Footer';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Coach Next Level",
    description: "A ferramenta para treinadores de elite",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt">
        <body className={inter.className}>
        <Navbar />
        {children} {/* Isto representa o conteúdo de cada página */}
        <Footer />
        </body>
        </html>
    );
}