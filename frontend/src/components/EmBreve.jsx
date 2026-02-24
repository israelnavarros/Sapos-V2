import React from 'react';

export default function EmBreve({ title = 'Em Breve', message = 'Desculpa, nossos engenheiros estão trabalhando.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-36 h-36 rounded-lg bg-amber-50 flex items-center justify-center shadow-md">
        <img src="/LogoWorking.png" alt="Sapo Engrenagem" className="w-28 h-28 object-contain" />
      </div>

      <h3 className="mt-6 text-xl font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 text-center max-w-md">{message}</p>
    </div>
  );
}
