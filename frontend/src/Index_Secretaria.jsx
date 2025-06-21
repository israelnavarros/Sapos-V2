import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

export default function AgendaEstagiarios() {
  const [grupos, setGrupos] = useState([{ id_grupo: '', titulo: 'Consultas de todos os grupos' }]);
  const [grupoSelecionado, setGrupoSelecionado] = useState('');
  const [eventos, setEventos] = useState([]);
  const calendarRef = useRef();

  useEffect(() => {
    fetch('/api/consulta_ids_grupos')
      .then(res => res.json())
      .then(data => setGrupos([{ id_grupo: '', titulo: 'Consultas de todos os grupos' }, ...data]));
  }, []);

  useEffect(() => {
    fetch(`/api/consulta_secretaria${grupoSelecionado ? `?gruposId=${grupoSelecionado}` : ''}`)
      .then(res => res.json())
      .then(data => setEventos(data));
  }, [grupoSelecionado]);

  const handleGrupoChange = (e) => {
    setGrupoSelecionado(e.target.value);
    // O useEffect acima já recarrega os eventos ao mudar o grupo
  };

  return (
    <div className="shadow-lg border rounded-lg bg-white">
      <div className="mb-4 p-6">
        <h3 className="text-center text-xl font-bold mb-4">Agenda dos estagiários</h3>
        <form>
          <select
            className="form-select w-full md:w-1/2 mx-auto block px-3 py-2 border rounded"
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
      <div className="p-6">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin]}
          initialView="dayGridWeek"
          locale={ptBrLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridWeek,dayGridDay'
          }}
          events={eventos}
          height="auto"
        />
      </div>
    </div>
  );
}