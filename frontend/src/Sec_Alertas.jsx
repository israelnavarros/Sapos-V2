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
  const [notificacoes, setNotificacoes] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [modalId, setModalId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateNotifModalOpen, setIsCreateNotifModalOpen] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('alertas');
  const [novoAlerta, setNovoAlerta] = useState({
    titulo: '',
    mensagem: '',
    validade: ''
  });
  const [novaNotificacao, setNovaNotificacao] = useState({
    mensagem: '',
    tipo: '',
    id_cargo_destinatario: '',
    validade: ''
  });
  const navigate = useNavigate();

  const cargoLabel = (cargo) => {
    switch (cargo) {
      case 0: return 'Secretaria';
      case 1: return 'Supervisor';
      case 2: return 'Estagiário';
      case 3: return 'Coordenador';
      default: return 'Desconhecido';
    }
  };

  useEffect(() => {
    fetch(`${API_URL}/api/alertas`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setAlertas(data))
      .catch(err => console.error('Erro ao carregar alertas:', err));

    fetch(`${API_URL}/api/notificacoes_secretaria`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setNotificacoes(data))
      .catch(err => console.error('Erro ao carregar notificações:', err));
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

  const handleDeleteNotificacao = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/deletar_notificacao/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        setNotificacoes(prev => prev.filter(n => n.id_notificacao !== id));
        setModalId(null);
      } else {
        alert('Erro ao excluir notificação.');
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

  const handleCreateNotificacao = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/adicionar_notificacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(novaNotificacao)
      });
      const data = await res.json();
      if (data.success) {
        alert('Notificação criada com sucesso!');
        setIsCreateNotifModalOpen(false);
        setNovaNotificacao({ mensagem: '', tipo: '', id_cargo_destinatario: '', validade: '' });
        // Recarrega a lista
        const resList = await fetch(`${API_URL}/api/notificacoes_secretaria`, { credentials: 'include' });
        const dataList = await resList.json();
        setNotificacoes(dataList);
      } else {
        alert('Erro ao criar notificação: ' + data.message);
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
      <div className={embedded ? "" : "p-6 bg-white shadow-md rounded-lg"}>
        {/* Abas */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setAbaAtiva('alertas')}
            className={`pb-2 px-4 font-semibold transition-colors ${
              abaAtiva === 'alertas'
                ? 'border-b-2 border-green text-green'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Alertas
          </button>
          <button
            onClick={() => setAbaAtiva('notificacoes')}
            className={`pb-2 px-4 font-semibold transition-colors ${
              abaAtiva === 'notificacoes'
                ? 'border-b-2 border-green text-green'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Notificações
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {abaAtiva === 'alertas' ? (
          <div>
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
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Notificações</h2>
              <button
                onClick={() => setIsCreateNotifModalOpen(true)}
                className="flex items-center gap-2 bg-green text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:bg-green-600 cursor-pointer transition-transform transform hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Adicionar Notificação
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Mensagem</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Tipo</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cargo Destinatário</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Data Criação</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Validade</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {notificacoes.map(notif => (
                    <tr key={notif.id_notificacao} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{notif.mensagem}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{notif.tipo}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{notif.cargo_nome}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{moment(notif.data_criacao).format('DD/MM/YYYY')}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{notif.validade ? moment(notif.validade).format('DD/MM/YYYY') : '-'}</td>
                      <td className="px-4 py-2 text-sm">
                        <button
                          className="px-3 py-1 text-sm rounded text-white bg-[#BD4343] hover:bg-red-600 transition cursor-pointer"
                          onClick={() => {
                            setModalId({ id: notif.id_notificacao, type: 'notif' });
                          }}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmação */}
      {modalId !== null && (
        <Modal
          onClose={() => setModalId(null)}
          title={modalId.type === 'notif' ? "Excluir Notificação" : "Excluir Alerta"}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Tem certeza que deseja excluir este {modalId.type === 'notif' ? 'notificação' : 'alerta'}? Esta ação não pode ser desfeita.
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
                onClick={() => {
                  if (modalId.type === 'notif') {
                    handleDeleteNotificacao(modalId.id);
                  } else {
                    handleDelete(modalId);
                  }
                }}
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

      {/* Modal de Criação de Notificação */}
      {isCreateNotifModalOpen && (
        <Modal
          onClose={() => setIsCreateNotifModalOpen(false)}
          title="Adicionar Nova Notificação"
        >
          <form onSubmit={handleCreateNotificacao} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mensagem</label>
              <textarea
                required
                rows="4"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                value={novaNotificacao.mensagem}
                onChange={e => setNovaNotificacao({ ...novaNotificacao, mensagem: e.target.value })}
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                value={novaNotificacao.tipo}
                onChange={e => setNovaNotificacao({ ...novaNotificacao, tipo: e.target.value })}
              >
                <option value="">Selecione um tipo...</option>
                <option value="alerta">Alerta</option>
                <option value="aviso">Aviso</option>
                <option value="info">Info</option>
                <option value="erro">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cargo Destinatário</label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                value={novaNotificacao.id_cargo_destinatario}
                onChange={e => setNovaNotificacao({ ...novaNotificacao, id_cargo_destinatario: parseInt(e.target.value) })}
              >
                <option value="">Selecione um cargo...</option>
                <option value="0">Secretaria</option>
                <option value="1">Supervisor</option>
                <option value="2">Estagiário</option>
                <option value="3">Coordenador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Validade</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                value={novaNotificacao.validade}
                onChange={e => setNovaNotificacao({ ...novaNotificacao, validade: e.target.value })}
              />
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setIsCreateNotifModalOpen(false)}
                className="mr-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green text-white rounded-md hover:bg-green-600 shadow-md"
              >
                Salvar Notificação
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
