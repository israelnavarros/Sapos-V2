import React from 'react';
import Header from './Header';
import EmBreve from './components/EmBreve';

export default function AlertasSimple() {
  return (
    <div>
      <Header />
      <main className="max-w-7xl mx-auto px-4">
        <EmBreve title="Alertas" message="Desculpa, nossos engenheiros estão trabalhando nos alertas dessa página." />
      </main>
    </div>
  );
}
