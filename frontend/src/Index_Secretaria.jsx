import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import API_URL from './config';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

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

  const handleGrupoChange = (e) => {
    setGrupoSelecionado(e.target.value);
    // O useEffect acima já recarrega os eventos ao mudar o grupo
  };

  return (
    <main className='pt-20'>
      <div className="p-4 sm:p-6 lg:p-8 bg-[#F4F1EE] min-h-screen">
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Agenda dos estagiários</h1>
          <form className="max-w-md">
            <select
              className="form-select w-full block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              id="inputGrupos"
              value={grupoSelecionado}
              onChange={handleGrupoChange}
            >
              {grupos.map(grupo => (
                <option key={grupo.id_grupo} value={grupo.id_grupo}>{grupo.titulo}</option>
              ))}
            </select>
          </form>
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