import React from "react";

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
    return (
        <div className="p-10 bg-slate-900/40 border border-white/5 rounded-[2rem] hover:border-red-500/30 transition-all group">
            <div className="mb-6 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-black uppercase italic mb-3 tracking-tight">
                {title}
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                {description}
            </p>
        </div>
    );
}