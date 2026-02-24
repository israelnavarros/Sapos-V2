import React from 'react';

export default function EmBreve({ title = 'Em Breve', message = 'Desculpa, nossos engenheiros estão trabalhando.' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] py-12 md:py-20">
      <div className="w-24 h-24 md:w-40 md:h-40 rounded-lg flex items-center justify-center shadow-md">
        <img src="/LogoWorking.png" alt="Sapo Engrenagem" className="w-20 h-20 md:w-36 md:h-36 object-contain" />
      </div>

      <h3 className="mt-4 md:mt-6 text-lg md:text-2xl font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 text-sm md:text-base text-slate-600 text-center max-w-sm md:max-w-md">{message}</p>
    </div>
  );
}
