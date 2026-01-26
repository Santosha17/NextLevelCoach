import React from 'react';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
    return (
        <section className="flex flex-col items-center text-center px-4 py-20 bg-gradient-to-b from-slate-900 to-slate-800">
            <div className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider text-green-400 uppercase bg-green-400/10 rounded-full border border-green-400/20">
                Para Treinadores de Elite
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 max-w-3xl leading-tight">
                Leva os teus alunos ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Next Level</span>
            </h1>

            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-8">
                A ferramenta digital definitiva para desenhar táticas, planear aulas e partilhar exercícios. Adeus papel, olá profissionalismo.
            </p>

            <div className="flex gap-4">
                <button className="px-8 py-3 bg-green-500 text-slate-900 rounded-lg font-bold hover:bg-green-400 transition flex items-center gap-2 shadow-[0_0_20px_rgba(74,222,128,0.3)]">
                    Começar Grátis <ArrowRight size={18} />
                </button>
                <button className="px-8 py-3 bg-slate-800 text-white rounded-lg font-bold border border-slate-700 hover:bg-slate-700 transition">
                    Ver Demo
                </button>
            </div>
        </section>
    );
};

export default Hero;