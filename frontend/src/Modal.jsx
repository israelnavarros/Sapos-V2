// Modal.js
import { useEffect } from 'react';

export default function Modal({ children, title, onClose }) {
  // Efeito para fechar o modal com a tecla 'Esc'
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose} // Fecha o modal ao clicar no fundo
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()} // Previne que o clique no card feche o modal
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div>{children}</div>
        
        <div className="mt-6 pt-4 border-t flex justify-end">
          <button 
            onClick={onClose} 
            className="cursor-pointer px-4 py-2 bg-slate-100 text-slate-800 font-semibold rounded-lg hover:bg-slate-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}