import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from './config';
import Header from './Header';
import moment from 'moment';
import Modal from './Modal';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';

export default function SecAlertas({ embedded = false }) {
  const [alertas, setAlertas] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [modalId, setModalId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [novoAlerta, setNovoAlerta] = useState({
    titulo: '',
    mensagem: '',
    validade: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/alertas`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setAlertas(data))
      .catch(err => console.error('Erro ao carregar alertas:', err));
  }, []);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/deletar_alerta/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        setAlertas(prev => prev.filter(a => a.id_alerta !== id));
        setModalId(null);
      } else {
        alert('Erro ao excluir alerta.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
    }
  };

  const handleCreateAlerta = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/adicionar_alerta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(novoAlerta)
      });
      const data = await res.json();
      if (data.success) {
        alert('Alerta criado com sucesso!');
        setIsCreateModalOpen(false);
        setNovoAlerta({ titulo: '', mensagem: '', validade: '' });
        // Recarrega a lista
        const resList = await fetch(`${API_URL}/api/alertas`, { credentials: 'include' });
        const dataList = await resList.json();
        setAlertas(dataList);
      } else {
        alert('Erro ao criar alerta: ' + data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'id_alerta',
      header: 'Nº',
    },
    {
      accessorKey: 'titulo',
      header: 'Título',
    },
    {
      accessorFn: row => moment(row.validade).format('DD/MM/YYYY'),
      id: 'validade',
      header: 'Validade',
    },
    {
      id: 'acoes',
      header: '',
      cell: ({ row }) => (
        <button
          className="px-3 py-1 text-sm rounded text-white bg-[#BD4343] hover:bg-red-600 transition cursor-pointer"
          onClick={() => setModalId(row.original.id_alerta)}
        >
          Excluir
        </button>
      ),
    },
  ], []);

  const table = useReactTable({
    data: alertas,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const Content = (
    <>
      <div className="p-6 bg-white shadow-md rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Alertas</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-green text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:bg-green-600 cursor-pointer transition-transform transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Adicionar Alerta
          </button>
        </div>

        <input
          type="text"
          placeholder="Buscar..."
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="mb-4 px-3 py-2 border rounded w-full"
        />

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-2 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span>
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      </div>

      {/* Modal de confirmação */}
      {modalId !== null && (
        <Modal
          onClose={() => setModalId(null)}
          title="Excluir Alerta"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Tem certeza que deseja excluir este alerta? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 cursor-pointer"
                onClick={() => setModalId(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-[#BD4343] text-white rounded-md hover:bg-red-600 shadow-md cursor-pointer"
                onClick={() => handleDelete(modalId)}
              >
                Excluir
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Criação de Alerta */}
      {isCreateModalOpen && (
        <Modal
          onClose={() => setIsCreateModalOpen(false)}
          title="Adicionar Novo Alerta"
        >
          <form onSubmit={handleCreateAlerta} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Título</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                value={novoAlerta.titulo}
                onChange={e => setNovoAlerta({ ...novoAlerta, titulo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Validade</label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                value={novoAlerta.validade}
                onChange={e => setNovoAlerta({ ...novoAlerta, validade: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mensagem</label>
              <textarea
                required
                rows="4"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                value={novoAlerta.mensagem}
                onChange={e => setNovoAlerta({ ...novoAlerta, mensagem: e.target.value })}
              ></textarea>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="mr-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green text-white rounded-md hover:bg-green-600 shadow-md"
              >
                Salvar Alerta
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );

  if (embedded) return Content;

  return (
    <>
      <Header />
      {Content}
    </>
  );
}
