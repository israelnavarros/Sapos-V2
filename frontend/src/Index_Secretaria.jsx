import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import API_URL from './config';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import BannerNotificacoes from './BannerNotificacoes';

export default function AgendaEstagiarios() {
  const [grupos, setGrupos] = useState([{ id_grupo: '', titulo: 'Consultas de todos os grupos' }]);
  const [grupoSelecionado, setGrupoSelecionado] = useState('');
  const [eventos, setEventos] = useState([]);
  const calendarRef = useRef();

  useEffect(() => {
    fetch(`${API_URL}/api/consulta_ids_grupos`)
      .then(res => res.json())
      .then(data => setGrupos([{ id_grupo: '', titulo: 'Consultas de todos os grupos' }, ...data]));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/consulta_secretaria${grupoSelecionado ? `?gruposId=${grupoSelecionado}` : ''}`)
      .then(res => res.json())
      .then(data => setEventos(data));
  }, [grupoSelecionado]);

  return (
    <main className='pt-20'>
      <div className="p-4 sm:p-6 lg:p-8 bg-[#F4F1EE] min-h-screen">
        <BannerNotificacoes />
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Agenda dos estagiários</h1>
          <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
            {grupos.map(grupo => (
              <button
                key={grupo.id_grupo}
                onClick={() => setGrupoSelecionado(grupo.id_grupo)}
                className={`py-2 px-4 font-medium transition-colors whitespace-nowrap ${grupoSelecionado === grupo.id_grupo ? 'border-b-2 border-green text-green' : 'text-gray-500 hover:bg-gray-100'
                  }`}
              >
                {grupo.titulo}
              </button>
            ))}
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
            slotMinTime="06:00:00"
            slotMaxTime="20:00:00"
            nowIndicator={true}
          />
        </div>
      </div>
    </main>
  );
}