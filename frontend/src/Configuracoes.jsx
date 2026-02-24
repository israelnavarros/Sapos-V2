import React from 'react';
import Header from './Header';
import EmBreve from './components/EmBreve';

export default function Configuracoes() {
  return (
    <div>
      <Header />
      <main className="max-w-7xl mx-auto px-4">
        <EmBreve title="Configurações" message="Desculpa, nossos engenheiros estão trabalhando nas configurações." />
      </main>
    </div>
  );
}
