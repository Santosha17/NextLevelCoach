import React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

interface PriceCardProps {
    tier: string;
    price: string;
    features: string[];
    featured?: boolean;
}

export function PriceCard({ tier, price, features, featured = false }: PriceCardProps) {
    return (
        <div className={`p-10 rounded-[2.5rem] border transition-all relative overflow-hidden ${
            featured
                ? 'bg-red-600 border-transparent shadow-2xl shadow-red-900/40 scale-105 z-10'
                : 'bg-slate-900 border-white/10'
        }`}>
            {featured && (
                <div className="absolute top-0 right-0 bg-white text-red-600 text-[8px] font-black uppercase px-4 py-1 rounded-bl-xl tracking-widest">
                    Recomendado
                </div>
            )}

            <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-6 ${
                featured ? 'text-white/70' : 'text-slate-500'
            }`}>
                {tier}
            </h4>

            <div className="text-6xl font-black italic uppercase mb-10 tracking-tighter">
                {price}
                <span className="text-xs font-normal not-italic opacity-60">/mês</span>
            </div>

            <ul className="text-left space-y-4 mb-12 text-sm font-bold">
                {features.map((f: string) => (
                    <li key={f} className="flex items-center gap-3">
                        <CheckCircle2 size={18} className={featured ? 'text-white' : 'text-red-600'} />
                        {f}
                    </li>
                ))}
            </ul>

            <Link
                href="/login"
                className={`block w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${
                    featured
                        ? 'bg-white text-red-600 hover:bg-slate-100 shadow-xl'
                        : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
            >
                Selecionar Plano
            </Link>
        </div>
    );
}