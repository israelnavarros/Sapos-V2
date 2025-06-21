import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

export default function AgendaMeusEstagiarios() {
  const [estagiarios, setEstagiarios] = useState([{ id_estagiario: '', nome: 'Todos os estagiários' }]);
  const [estagiarioSelecionado, setEstagiarioSelecionado] = useState('');
  const [eventos, setEventos] = useState([]);
  const calendarRef = useRef(null);

  useEffect(() => {
    fetch('/api/consulta_ids_estagiarios')
      .then(res => res.json())
      .then(data => setEstagiarios([{ id_estagiario: '', nome: 'Todos os estagiários' }, ...data]));
  }, []);

  useEffect(() => {
    fetch(`/api/consulta_supervisor${estagiarioSelecionado ? `?estagiarioId=${estagiarioSelecionado}` : ''}`)
      .then(res => res.json())
      .then(data => setEventos(data));
  }, [estagiarioSelecionado]);

  const handleEstagiarioChange = (e) => {
    setEstagiarioSelecionado(e.target.value);
    // O useEffect acima já recarrega os eventos ao mudar o estagiário
  };

  return (
    <div className="shadow-lg border rounded-lg bg-white">
      <div className="mb-4 p-6">
        <h3 className="text-center text-xl font-bold mb-4">Agenda dos meus estagiários</h3>
        <form>
          <select
            className="form-select w-full md:w-1/2 mx-auto block px-3 py-2 border rounded"
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
      <div className="p-6">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          locale={ptBrLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay'
          }}
          events={eventos}
          height="auto"
        />
      </div>
    </div>
  );
}