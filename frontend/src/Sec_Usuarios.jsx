import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import moment from 'moment';
import SecTrocas from './Sec_Trocas';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';

export default function SecUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const navigate = useNavigate();
  const habilitar_validade = moment().format('YYYY-MM-DD');

  useEffect(() => {
    fetch('/api/usuarios', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUsuarios(data))
      .catch(err => console.error('Erro ao carregar usuários:', err));
  }, []);

  const cargoLabel = (cargo) => {
    switch (cargo) {
      case 1: return 'Supervisor';
      case 2: return 'Estagiário';
      case 3: return 'Coordenador';
      default: return 'Secretaria';
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'nome',
      header: 'Nome',
    },
    {
      accessorFn: row => cargoLabel(row.cargo),
      id: 'cargo',
      header: 'Cargo',
    },
    {
      accessorFn: row => row.status ? 'Ativo' : 'Desativado',
      id: 'status',
      header: 'Status',
    },
    {
      accessorFn: row => moment(row.valido_ate).format('DD/MM/YYYY'),
      id: 'valido_ate',
      header: 'Validade',
    },
    {
      id: 'acoes',
      header: '',
      cell: ({ row }) => (
        <button
          className={`px-3 py-1 text-sm rounded text-white bg-indigo-600 hover:bg-indigo-700 transition ${row.original.valido_ate > habilitar_validade ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          onClick={() => navigate(`/adm_alterar_validade/${row.original.id_usuario}`)}
          disabled={row.original.valido_ate > habilitar_validade}
        >
          Alterar validade
        </button>
      ),
    },
  ], []);

  const table = useReactTable({
    data: usuarios,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <Header />
      <main className="pt-20 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="p-6 bg-white shadow-md rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Usuários</h2>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                onClick={() => navigate('/registrar_coordenador')}
              >
                Adicionar Supervisor
              </button>
            </div>
            <div>
              <section className="mb-6">
                <SecTrocas />
              </section>
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
        </div>
      </main>

    </>
  );
}
