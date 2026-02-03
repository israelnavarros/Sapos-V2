import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import API_URL from './config';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import BannerNotificacoes from './BannerNotificacoes';

export default function AgendaEstagiarios() {
  const [grupos, setGrupos] = useState([{ id_grupo: '', titulo: 'Todos os grupos' }]);
  const [grupoSelecionado, setGrupoSelecionado] = useState('');
  const [eventos, setEventos] = useState([]);
  const calendarRef = useRef();

  useEffect(() => {
    fetch(`${API_URL}/api/consulta_ids_grupos`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setGrupos([{ id_grupo: '', titulo: 'Todos os grupos' }, ...data]));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/consulta_secretaria${grupoSelecionado ? `?gruposId=${grupoSelecionado}` : ''}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setEventos(data));
  }, [grupoSelecionado]);

  const handleGrupoChange = (e) => {
    setGrupoSelecionado(e.target.value);
  };

  return (
    <main className='pt-20'>
      <style>{`
        .fc .fc-toolbar-title { font-size: 1.2rem !important; }
        .fc .fc-button { font-size: 0.8rem !important; padding: 4px 8px !important; }
        .fc .fc-col-header-cell-cushion { font-size: 0.8rem !important; }
        .fc .fc-timegrid-slot-label-cushion { font-size: 0.75rem !important; }
        .fc .fc-event { font-size: 0.7rem !important; }
        .fc .fc-toolbar-chunk { display: flex; gap: 0.5rem; align-items: center; }
        .fc .fc-button-group > .fc-button { margin-right: 2px; }

        @media (max-width: 768px) {
          .fc .fc-toolbar { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.5rem; }
          .fc .fc-toolbar-chunk:nth-child(1) { order: 1; }
          .fc .fc-toolbar-chunk:nth-child(3) { order: 2; }
          .fc .fc-toolbar-chunk:nth-child(2) { 
            order: 3; width: 100%; text-align: center; margin-top: 0.25rem; 
            display: flex; justify-content: center;
          }
          .fc .fc-toolbar-title { font-size: 1rem !important; }
        }
      `}</style>
      <div className="p-4 sm:p-6 lg:p-8 bg-[#F4F1EE] min-h-screen">
        <BannerNotificacoes />
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Agenda dos estagiários</h1>
          <div className="flex gap-4 items-center">
            <label className="font-semibold text-slate-700">Filtrar por Grupo:</label>
            <select
              value={grupoSelecionado}
              onChange={handleGrupoChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent"
            >
              {grupos.map(grupo => (
                <option key={grupo.id_grupo} value={grupo.id_grupo}>
                  {grupo.titulo}
                </option>
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
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={eventos}
            height="auto"
            slotMinTime="06:00:00"
            slotMaxTime="20:00:00"
            nowIndicator={true}
          />
        </div>
      </div>
    </main>
  );
}