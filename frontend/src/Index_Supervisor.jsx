import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import API_URL from './config';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import BannerAlertas from './BannerAlertas';
import BannerNotificacoes from './BannerNotificacoes';
import Modal from './Modal';

export default function AgendaMeusEstagiarios() {
  const [estagiarios, setEstagiarios] = useState([{ id_estagiario: '', nome: 'Todos os estagiários' }]);
  const [estagiarioSelecionado, setEstagiarioSelecionado] = useState('');
  const [eventos, setEventos] = useState([]);
  const calendarRef = useRef(null);

  // Estados para o Modal e Criação de Consulta
  const [modalState, setModalState] = useState({ isOpen: false, mode: null, data: null });
  const [pacientes, setPacientes] = useState([]);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tipoAgendamento, setTipoAgendamento] = useState('consulta'); // 'consulta' | 'reuniao'

  useEffect(() => {
    fetch(`${API_URL}/api/consulta_ids_estagiarios`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setEstagiarios([{ id_estagiario: '', nome: 'Todos os estagiários' }, ...data]));

    // Busca pacientes supervisionados pelo usuário logado (Supervisor)
    fetch(`${API_URL}/api/sup_pacientes_supervisionados`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setPacientes(data || []));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/consulta_supervisor${estagiarioSelecionado ? `?estagiarioId=${estagiarioSelecionado}` : ''}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setEventos(data));
  }, [estagiarioSelecionado]);

  const handleEstagiarioChange = (e) => {
    setEstagiarioSelecionado(e.target.value);
    // O useEffect acima já recarrega os eventos ao mudar o estagiário
  };

  // Lógica do Modal
  const handleDateSelect = (selectInfo) => {
    const defaultData = {
      dia: selectInfo.startStr.split('T')[0],
      inicio: selectInfo.startStr.split('T')[1]?.substring(0, 5) || '09:00',
      final: selectInfo.endStr.split('T')[1]?.substring(0, 5) || '10:00',
      paciente: '',
      titulo: '',
      participantes: []
    };
    setFormData(defaultData);
    setTipoAgendamento('consulta');
    setModalState({ isOpen: true, mode: 'create', data: defaultData });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const current = prev.participantes || [];
      if (checked) return { ...prev, participantes: [...current, value] };
      return { ...prev, participantes: current.filter(id => id !== value) };
    });
  };

  const handleEventClick = (clickInfo) => {
    setModalState({ isOpen: true, mode: 'view', data: clickInfo.event });
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este evento?")) return;
    
    setIsSubmitting(true);
    try {
        const response = await fetch(`${API_URL}/api/excluir_evento_supervisor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id_evento: modalState.data.id })
        });
        
        if (!response.ok) throw new Error('Erro ao excluir evento.');

        // Recarrega eventos
        const resEventos = await fetch(`${API_URL}/api/consulta_supervisor${estagiarioSelecionado ? `?estagiarioId=${estagiarioSelecionado}` : ''}`, { credentials: 'include' });
        const dataEventos = await resEventos.json();
        setEventos(dataEventos);

        setModalState({ isOpen: false, mode: null, data: null });
    } catch (error) {
        alert(error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let response;
      if (tipoAgendamento === 'consulta') {
        const formBody = new URLSearchParams(formData).toString();
        console.log('Enviando consulta:', formBody);
        response = await fetch(`${API_URL}/api/cadastrar_consulta_supervisor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          credentials: 'include',
          body: formBody
        });
      } else {
        // Reunião (envia JSON)
        console.log('Enviando reunião:', formData);
        response = await fetch(`${API_URL}/api/criar_reuniao_supervisor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData)
        });
      }

      console.log('Response status cadastro:', response.status, response.statusText);
      
      let result;
      const contentType = response.headers.get('content-type');
      console.log('Content-Type da resposta:', contentType);
      
      try {
        const responseText = await response.text();
        console.log('Response text:', responseText);
        result = JSON.parse(responseText);
      } catch (err) {
        console.error('Erro ao fazer parse JSON:', err);
        throw new Error(`Erro na resposta do servidor: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) throw new Error(result?.message || 'Erro ao cadastrar.');
      
      console.log('Cadastro bem-sucedido, recarregando eventos...');
      
      // Recarrega eventos
      const urlEventos = `${API_URL}/api/consulta_supervisor${estagiarioSelecionado ? `?estagiarioId=${estagiarioSelecionado}` : ''}`;
      console.log('URL para recarregar eventos:', urlEventos);
      
      const resEventos = await fetch(urlEventos, { credentials: 'include' });
      console.log('Response status eventos:', resEventos.status, resEventos.statusText);
      
      if (!resEventos.ok) {
        throw new Error(`Erro ao carregar eventos: ${resEventos.status} ${resEventos.statusText}`);
      }
      
      const dataEventos = await resEventos.json();
      console.log('Eventos carregados:', dataEventos);
      setEventos(dataEventos);

      setModalState({ isOpen: false, mode: null, data: null });
    } catch (error) {
      console.error('Erro completo:', error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className='pt-20'>
      <div className="p-4 sm:p-6 lg:p-8 bg-[#F4F1EE] min-h-screen">
        <BannerAlertas />
        <BannerNotificacoes />
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Agenda dos meus estagiários</h1>
          <div className="flex gap-4 items-center">
            <label className="font-semibold text-slate-700">Filtrar por Estagiário:</label>
            <select
              value={estagiarioSelecionado}
              onChange={handleEstagiarioChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent"
            >
              {estagiarios.map(estagiario => (
                <option key={estagiario.id_estagiario} value={estagiario.id_estagiario}>{estagiario.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 px-4 items-center">
          <h3 className="text-sm font-semibold text-slate-600 mr-2">Legenda:</h3>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#26268D]"></span>
            <span className="text-xs text-slate-500">Agendada</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green"></span>
            <span className="text-xs text-slate-500">Realizada</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#BD4343]"></span>
            <span className="text-xs text-slate-500">Cancelada</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-black"></span>
            <span className="text-xs text-slate-500">Reunião</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={ptBrLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,dayGridDay'
            }}
            events={eventos}
            height="auto"
            selectable={true}
            eventClick={handleEventClick}
            select={handleDateSelect}
            slotMinTime="06:00:00"
            slotMaxTime="20:00:00"
            nowIndicator={true}
          />
        </div>
      </div>

      {/* Modal de Cadastro */}
      {modalState.isOpen && (
        <Modal
          onClose={() => setModalState({ isOpen: false, mode: null, data: null })}
          title={
            modalState.mode === 'create' ? (tipoAgendamento === 'consulta' ? "Agendar Consulta" : "Agendar Reunião") :
            "Detalhes do Evento"
          }
        >
          {modalState.mode === 'view' ? (
            <div className="space-y-4">
                <div>
                    <h4 className="text-lg font-bold text-slate-800">{modalState.data.title}</h4>
                    <p className="text-sm text-slate-600">
                        {new Date(modalState.data.start).toLocaleDateString('pt-BR')} - {new Date(modalState.data.start).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        {modalState.data.end && ` até ${new Date(modalState.data.end).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`}
                    </p>
                </div>
                
                {modalState.data.extendedProps?.participantes && (
                    <div>
                        <h5 className="font-semibold text-sm text-slate-700">Participantes:</h5>
                        <ul className="list-disc list-inside text-sm text-slate-600">
                            {modalState.data.extendedProps.participantes.map((p, idx) => (
                                <li key={idx}>{p}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {!modalState.data.groupId && (
                    <div className="pt-4 border-t flex justify-end">
                        <button 
                            onClick={handleDeleteEvent} 
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                            {isSubmitting ? 'Excluindo...' : 'Excluir Evento'}
                        </button>
                    </div>
                )}
                {modalState.data.groupId && (
                    <div className="pt-4 border-t text-center text-sm text-gray-500 italic">
                        Reunião recorrente. Gerencie na aba "Meu Grupo".
                    </div>
                )}
            </div>
          ) : (
          <form onSubmit={handleSaveEvent}>
            <div className="space-y-4">
              {/* Seletor de Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Agendamento</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input type="radio" className="form-radio text-green" name="tipo" checked={tipoAgendamento === 'consulta'} onChange={() => setTipoAgendamento('consulta')} />
                    <span className="ml-2">Consulta (Paciente)</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" className="form-radio text-green" name="tipo" checked={tipoAgendamento === 'reuniao'} onChange={() => setTipoAgendamento('reuniao')} />
                    <span className="ml-2">Reunião (Estagiários)</span>
                  </label>
                </div>
              </div>

              {tipoAgendamento === 'consulta' ? (
                <div>
                  <label htmlFor="paciente" className="block text-sm font-medium text-gray-700">Paciente</label>
                  <select id="paciente" name="paciente" value={formData.paciente} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                    <option value="">Selecione um paciente</option>
                    {pacientes.map(p => <option key={p.id_paciente} value={p.id_paciente}>{p.nome_completo}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">Título da Reunião</label>
                  <input type="text" id="titulo" name="titulo" value={formData.titulo} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="Ex: Supervisão em Grupo" />
                  
                  <label className="block text-sm font-medium text-gray-700 mt-3 mb-2">Participantes (Estagiários)</label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-gray-50">
                    {estagiarios.filter(e => e.id_estagiario).map(est => (
                      <label key={est.id_estagiario} className="flex items-center space-x-2 mb-1">
                        <input type="checkbox" value={est.id_estagiario} onChange={handleCheckboxChange} checked={(formData.participantes || []).includes(String(est.id_estagiario))} className="rounded text-green focus:ring-green" />
                        <span className="text-sm text-gray-700">{est.nome}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="dia" className="block text-sm font-medium text-gray-700">Data</label>
                <input type="date" id="dia" name="dia" value={formData.dia} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              </div>
              <div className='flex gap-4'>
                <div className='flex-1'>
                  <label htmlFor="inicio" className="block text-sm font-medium text-gray-700">Início</label>
                  <input type="time" id="inicio" name="inicio" value={formData.inicio} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div className='flex-1'>
                  <label htmlFor="final" className="block text-sm font-medium text-gray-700">Término</label>
                  <input type="time" id="final" name="final" value={formData.final} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t flex justify-end">
              <button type="submit" className="cursor-pointer px-3 py-1.5 bg-green text-white text-sm font-semibold rounded-md shadow-sm hover:bg-green-600 transition-colors disabled:opacity-50" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Agendamento'}
              </button>
            </div>
          </form>
          )}
        </Modal>
      )}
    </main>
  );
}