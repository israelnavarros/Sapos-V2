import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from './config';
import Header from './Header';
import moment from 'moment';
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
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/alertas`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setAlertas(data))
      .catch(err => console.error('Erro ao carregar alertas:', err));
  }, []);

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/api/alertas/${id}`, { method: 'DELETE' });
    setAlertas(prev => prev.filter(a => a.id_alerta !== id));
    setModalId(null);
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
          className="px-3 py-1 text-sm rounded text-white bg-red-600 hover:bg-red-700 transition"
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
          <Link
            to="/adm_adicionar_alerta"
            className="flex items-center gap-2 bg-green text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:bg-green-600 cursor-pointer transition-transform transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Adicionar Alerta
          </Link>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md text-center">
            <h2 className="text-lg font-semibold mb-4">
              Deseja excluir o alerta?
            </h2>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setModalId(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => handleDelete(modalId)}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
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
