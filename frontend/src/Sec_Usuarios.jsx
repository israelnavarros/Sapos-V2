import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from './config';
import Header from './Header';
import moment from 'moment';
import Modal from './Modal';
import SecTrocas from './Sec_Trocas';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';

function ActionsDropdown({ usuario, onExtendValidity, onToggleStatus }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const menuRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                (!menuRef.current || !menuRef.current.contains(event.target))
            ) {
                setIsOpen(false);
            }
        }
        function handleScroll() {
            setIsOpen(false);
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", handleScroll, true);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [isOpen]);

    const toggleDropdown = () => {
        if (!isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setPosition({ top: rect.bottom, left: rect.right - 224 }); // w-56 = 224px
        }
        setIsOpen(!isOpen);
    };

    const itemStyle = "group flex w-full items-center rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-green hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-700";

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={toggleDropdown} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>
            {isOpen && createPortal(
                <div 
                    ref={menuRef}
                    className="fixed mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-gray-200 ring-opacity-5 focus:outline-none z-50"
                    style={{ top: position.top, left: position.left }}
                >
                    <div className="p-1">
                        <button onClick={() => { onExtendValidity(usuario); setIsOpen(false); }} className={itemStyle} title="Estender validade">
                            <i className="bi bi-calendar-plus mr-3"></i> Alterar Validade
                        </button>
                        <button onClick={() => { onToggleStatus(usuario); setIsOpen(false); }} className={itemStyle} title={usuario.status ? "Desativar usuário" : "Ativar usuário"}>
                            <i className={`bi ${usuario.status ? 'bi-person-x' : 'bi-person-check'} mr-3`}></i> {usuario.status ? 'Desativar' : 'Ativar'}
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

export default function SecUsuarios({ embedded = false }) {
  const [usuarios, setUsuarios] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/usuarios`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUsuarios(data))
      .catch(err => console.error('Erro ao carregar usuários:', err));
  }, []);

  const handleExtendValidity = async (usuario) => {
    const id = usuario.id || usuario.id_usuario;
    if (!window.confirm(`Deseja estender a validade do usuário ${usuario.nome}?`)) return;

    try {
        const res = await fetch(`${API_URL}/api/alterar_validade_usuario/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            alert('Validade estendida com sucesso!');
            setUsuarios(prev => prev.map(u => {
                const uid = u.id || u.id_usuario;
                return uid === id ? { ...u, valido_ate: data.valido_ate } : u;
            }));
        } else {
            alert(data.message || 'Erro ao alterar validade.');
        }
    } catch (err) {
        console.error(err);
        alert('Erro de conexão.');
    }
  };

  const handleToggleStatus = async (usuario) => {
    const id = usuario.id || usuario.id_usuario;
    if (!window.confirm(`Deseja ${usuario.status ? 'desativar' : 'ativar'} o usuário ${usuario.nome}?`)) return;

    try {
        const res = await fetch(`${API_URL}/api/alterar_status_usuario/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            setUsuarios(prev => prev.map(u => {
                const uid = u.id || u.id_usuario;
                return uid === id ? { ...u, status: data.status } : u;
            }));
        } else {
            alert(data.message || 'Erro ao alterar status.');
        }
    } catch (err) {
        console.error(err);
        alert('Erro de conexão.');
    }
  };

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
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex justify-end">
            <ActionsDropdown 
                usuario={row.original} 
                onExtendValidity={handleExtendValidity} 
                onToggleStatus={handleToggleStatus}
            />
        </div>
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

  const Content = (
        <div className={embedded ? "" : "max-w-7xl mx-auto"}>
          <div className={embedded ? "" : "p-6 bg-white shadow-md rounded-lg"}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Usuários</h2>
              <div className="flex gap-3">
                <button
                    onClick={() => navigate('/sec_adicionar_supervisor')}
                    className="flex items-center gap-2 bg-green text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-green-600 cursor-pointer transition-transform transform hover:scale-105"
                >
                    <i className="bi bi-person-badge"></i>
                    Adicionar Supervisor
                </button>
                <button
                    onClick={() => navigate('/sec_adicionar_estagiario')}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-blue-700 cursor-pointer transition-transform transform hover:scale-105"
                >
                    <i className="bi bi-person-plus"></i>
                    Adicionar Estagiário
                </button>
              </div>
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
  );

  if (embedded) return Content;

  return (
    <>
      <Header />
      <main className="pt-20 p-4">
        {Content}
      </main>
    </>
  );
}
