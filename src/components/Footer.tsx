import React from 'react';

const Footer = () => {
    return (
        <footer className="w-full py-8 bg-slate-950 text-slate-500 text-center border-t border-slate-900">
            <p className="text-sm">
                © {new Date().getFullYear()} Coach Next Level. Desenvolvido para Padel.
            </p>
            <div className="flex justify-center gap-4 mt-4 text-xs">
                <a href="#" className="hover:text-green-400">Termos</a>
                <a href="#" className="hover:text-green-400">Privacidade</a>
                <a href="#" className="hover:text-green-400">Instagram</a>
            </div>
        </footer>
    );
};

export default Footer;