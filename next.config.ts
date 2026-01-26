import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'export', // Cria a pasta 'out' para o Cloudflare Pages

    images: {
        // Obrigatório para Static Exports (como Cloudflare Pages)
        // porque não há servidor para otimizar imagens em tempo real.
        unoptimized: true,

        // Permite carregar imagens alojadas no Supabase
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co', // O asterisco ** aceita qualquer projeto Supabase
            },
        ],
    },
};

export default nextConfig;