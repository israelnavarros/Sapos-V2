import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import API_URL from './config';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import BannerAlertas from './BannerAlertas';

export default function AgendaMeusEstagiarios() {
  const [estagiarios, setEstagiarios] = useState([{ id_estagiario: '', nome: 'Todos os estagiários' }]);
  const [estagiarioSelecionado, setEstagiarioSelecionado] = useState('');
  const [eventos, setEventos] = useState([]);
  const calendarRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/consulta_ids_estagiarios`)
      .then(res => res.json())
      .then(data => setEstagiarios([{ id_estagiario: '', nome: 'Todos os estagiários' }, ...data]));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/consulta_supervisor${estagiarioSelecionado ? `?estagiarioId=${estagiarioSelecionado}` : ''}`)
      .then(res => res.json())
      .then(data => setEventos(data));
  }, [estagiarioSelecionado]);

  const handleEstagiarioChange = (e) => {
    setEstagiarioSelecionado(e.target.value);
    // O useEffect acima já recarrega os eventos ao mudar o estagiário
  };

  return (
    <main className='pt-20'>
      <div className="p-4 sm:p-6 lg:p-8 bg-[#F4F1EE] min-h-screen">
        <BannerAlertas />
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Agenda dos meus estagiários</h1>
          <form className="max-w-md">
            <select
              className="form-select w-full block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              id="inputEstagiarios"
              value={estagiarioSelecionado}
              onChange={handleEstagiarioChange}
            >
              {estagiarios.map(estagiario => (
                <option key={estagiario.id_estagiario} value={estagiario.id_estagiario}>{estagiario.nome}</option>
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