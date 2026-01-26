import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'export', // <--- ADICIONA ISTO

    // Se usares o componente <Image /> do Next.js, adiciona também isto:
    images: {
        unoptimized: true,
    },
};

export default nextConfig;