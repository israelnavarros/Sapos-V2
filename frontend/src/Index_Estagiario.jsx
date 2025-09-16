import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import Modal from './Modal';


export default function ConsultasDashboard() {
  // Estados existentes
  const [consultasHoje, setConsultasHoje] = useState(0);
  const [consultasSemana, setConsultasSemana] = useState(0);
  const [eventos, setEventos] = useState([]);

  // --- NOVOS ESTADOS ---
  // Estado para controlar o modal (aberto/fechado, modo, dados)
  const [modalState, setModalState] = useState({ isOpen: false, mode: null, data: null });
  // Estado para a lista de pacientes do select
  const [pacientes, setPacientes] = useState([]);
  // Estado para os dados do formulário de criação/edição
  const [formData, setFormData] = useState({});
  // Estado para controlar o status de envio do formulário
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LÓGICA DE CARREGAMENTO DE DADOS ---
  const fetchEventos = () => {
    fetch('/api/consulta_estag')
      .then(res => res.json())
      .then(data => {
        const eventosMapeados = data.map(evento => ({
          ...evento,
          // Adiciona classes para estilização (opcional, mas recomendado)
          className: evento.groupId ? 'fc-event-black' :
            evento.status === 'Realizado' ? 'fc-event-green' :
              evento.status === 'Cancelado' ? 'fc-event-red' : 'fc-event-blue'
        }));
        setEventos(eventosMapeados);
      });
  };

  useEffect(() => {
    // Carrega os cards
    fetch('/api/est_consulta_card').then(res => res.json()).then(data => {
      setConsultasHoje(data.hoje);
      setConsultasSemana(data.semana);
    });

    // Carrega a lista de pacientes para o formulário
    fetch('/api/consulta_ids_pacientes').then(res => res.json()).then(data => setPacientes(data));

    // Carrega os eventos do calendário
    fetchEventos();
  }, []);

  // --- FUNÇÕES DE CALLBACK DO CALENDÁRIO ---
  const handleEventClick = (clickInfo) => {
    setModalState({ isOpen: true, mode: 'view', data: clickInfo.event });
  };

  const handleDateSelect = (selectInfo) => {
    const defaultData = {
      dia: selectInfo.startStr.split('T')[0],
      inicio: selectInfo.startStr.split('T')[1]?.substring(0, 5) || '09:00',
      final: selectInfo.endStr.split('T')[1]?.substring(0, 5) || '10:00',
      paciente: ''
    };
    setFormData(defaultData);
    setModalState({ isOpen: true, mode: 'create', data: defaultData });
  };

  // --- FUNÇÕES DE MANIPULAÇÃO DE DADOS (API) ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateConsulta = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formBody = new URLSearchParams(formData).toString();
      const response = await fetch('/api/cadastrar_consulta_estag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Erro ao cadastrar.');

      alert(result.message);
      fetchEventos(); // Re-carrega os eventos
      setModalState({ isOpen: false, mode: null, data: null });
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funções para editar, cancelar e realizar seriam semelhantes, usando o `modalState.data.id`
  // Exemplo para cancelar
  const handleActionConsulta = async (actionUrl) => {
    if (!window.confirm(`Tem certeza que deseja ${actionUrl.split('_')[0]} esta consulta?`)) return;

    setIsSubmitting(true);
    try {
      const formBody = new URLSearchParams({ id_consulta: modalState.data.id }).toString();
      const response = await fetch(`/api/${actionUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Erro ao processar ação.');

      alert(result.message);
      fetchEventos();
      setModalState({ isOpen: false, mode: null, data: null });
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <main className='pt-20'>
      <div className="p-4 sm:p-6 lg:p-8 bg-slate-100 min-h-screen">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Minhas Consultas</h1>
        {/* Cards de Resumo Corrigidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* Card 1: Consultas Hoje */}
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <i className="bi bi-calendar4-event text-3xl text-green-600"></i>
            </div>
            <div>
              <span className="text-slate-500 text-sm">Consultas Hoje</span>
              <p className="text-3xl font-bold text-green-600">{consultasHoje}</p>
            </div>
          </div>

          {/* Card 2: Consultas na Semana */}
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
            <div className="bg-teal-100 p-3 rounded-full">
              <i className="bi bi-calendar4-week text-3xl text-teal-600"></i>
            </div>
            <div>
              <span className="text-slate-500 text-sm">Consultas na Semana</span>
              <p className="text-3xl font-bold text-teal-600">{consultasSemana}</p>
            </div>
          </div>

        </div>

        {/* Calendário */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <FullCalendar
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={ptBrLocale}
            events={eventos}
            eventClick={handleEventClick}
            selectable={true}
            select={handleDateSelect}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,dayGridDay'
            }}
            height="auto"
            slotMinTime="06:00:00"
            slotMaxTime="20:00:00"
            nowIndicator={true}
          />
        </div>
      </div>
      {/* --- MODAL DINÂMICO --- */}
      {modalState.isOpen && (
        <Modal
          onClose={() => setModalState({ isOpen: false, mode: null, data: null })}
          title={
            modalState.mode === 'create' ? "Cadastrar Nova Consulta" :
              modalState.mode === 'edit' ? "Editar Consulta" :
                "Detalhes da Consulta"
          }
        >
          {/* MODO DE VISUALIZAÇÃO */}
          {modalState.mode === 'view' && (
            <div>
              <div className="space-y-4 text-sm">
                {/* ... conteúdo de visualização como antes ... */}
                <div className="flex items-start"><span className="w-28 font-semibold text-slate-600">Paciente:</span><span className="flex-1 text-slate-800 font-medium">{modalState.data.title}</span></div>
                <div className="flex items-start"><span className="w-28 font-semibold text-slate-600">Dia:</span><span className="flex-1 text-slate-800">{new Date(modalState.data.start).toLocaleDateString('pt-BR')}</span></div>
                <div className="flex items-start"><span className="w-28 font-semibold text-slate-600">Horário:</span><span className="flex-1 text-slate-800">{new Date(modalState.data.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                {modalState.data.extendedProps.status && (<div className="flex items-start"><span className="w-28 font-semibold text-slate-600">Status:</span><span className="flex-1">{modalState.data.extendedProps.status}</span></div>)}
              </div>
              
<div className="mt-6 pt-4 border-t flex items-center justify-between">
  
  {/* LADO ESQUERDO: Ação Secundária */}
  <div>
    {modalState.data.extendedProps.status === 'Agendado' && !modalState.data.groupId && (
      <button 
        className="cursor-pointer px-3 py-1.5 bg-slate-200 text-slate-800 text-sm font-semibold rounded-md shadow-sm hover:bg-slate-300 transition-colors disabled:opacity-50"
        disabled={isSubmitting} 
        onClick={() => alert('Função de editar a ser implementada')}
      >
        Editar
      </button>
    )}
  </div>

  {/* LADO DIREITO: Ações Principais */}
  <div className="flex items-center gap-3">
    {modalState.data.extendedProps.status === 'Agendado' && !modalState.data.groupId && (
      <>
        {/* Botão Cancelar (Vermelho) */}
        <button 
          className="cursor-pointer px-3 py-1.5 bg-[#BD4343] text-white text-sm font-semibold rounded-md shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50"
          disabled={isSubmitting} 
          onClick={() => handleActionConsulta('cancelar_consulta_estag')}
        >
          Cancelar
        </button>
        
        {/* Botão Realizar (Verde) */}
        <button 
          className="cursor-pointer px-3 py-1.5 bg-green text-white text-sm font-semibold rounded-md shadow-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting || new Date(modalState.data.start) > new Date()} 
          onClick={() => handleActionConsulta('realizar_consulta_estag')}
        >
          Realizar
        </button>
      </>
    )}
  </div>
</div>
            </div>
          )}

          {/* MODO DE CRIAÇÃO */}
          {modalState.mode === 'create' && (
            <form onSubmit={handleCreateConsulta}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="paciente" className="block text-sm font-medium text-gray-700">Paciente</label>
                  <select id="paciente" name="paciente" value={formData.paciente} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    <option value="">Selecione um paciente</option>
                    {pacientes.map(p => <option key={p.id_paciente} value={p.id_paciente}>{p.nome_completo}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="dia" className="block text-sm font-medium text-gray-700">Data</label>
                  <input type="date" id="dia" name="dia" value={formData.dia} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div className='flex gap-4'>
                  <div className='flex-1'>
                    <label htmlFor="inicio" className="block text-sm font-medium text-gray-700">Início</label>
                    <input type="time" id="inicio" name="inicio" value={formData.inicio} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                  <div className='flex-1'>
                    <label htmlFor="final" className="block text-sm font-medium text-gray-700">Término</label>
                    <input type="time" id="final" name="final" value={formData.final} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t flex justify-end">
                <button type="submit" className="cursor-pointer px-3 py-1.5 bg-green text-white text-sm font-semibold rounded-md shadow-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar Consulta'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}


    </main>
  );
}