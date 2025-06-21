import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import Modal from './Modal'; // Crie um componente Modal reutilizável ou use um pronto

export default function ConsultasDashboard() {
  const [consultasHoje, setConsultasHoje] = useState(0);
  const [consultasSemana, setConsultasSemana] = useState(0);
  const [eventos, setEventos] = useState([]);
  const [modalInfo, setModalInfo] = useState(null);

  useEffect(() => {
    fetch('/api/est_consulta_card')
      .then(res => res.json())
      .then(data => {
        setConsultasHoje(data.hoje);
        setConsultasSemana(data.semana);
      });

    fetch('/api/consulta_estag')
      .then(res => res.json())
      .then(data => setEventos(data));
  }, []);

  const handleEventClick = (info) => {
    setModalInfo({
      title: info.event.title,
      dia: info.event.start,
      inicio: info.event.start,
      fim: info.event.end,
      status: info.event.extendedProps.status,
    });
  };

  return (
    <div className="shadow-lg border rounded-lg p-4 bg-white">
      <h2 className="text-center text-2xl font-bold mb-6">Minhas consultas</h2>
      <div className="flex flex-col md:flex-row justify-evenly gap-4 mb-6">
        <div className="flex-1 max-w-xs">
          <div className="card h-full bg-gray-50 rounded-lg shadow p-4 flex items-center">
            <div className="flex-shrink-0 text-teal-600 mr-4">
              <i className="bi bi-calendar4-event text-3xl"></i>
            </div>
            <div className="flex-1 text-right">
              <h3 className="text-2xl font-bold mb-0">{consultasHoje}</h3>
              <span className="text-gray-500">Consultas Hoje</span>
            </div>
          </div>
        </div>
        <div className="flex-1 max-w-xs">
          <div className="card h-full bg-gray-50 rounded-lg shadow p-4 flex items-center">
            <div className="flex-shrink-0 text-teal-600 mr-4">
              <i className="bi bi-calendar4-week text-3xl"></i>
            </div>
            <div className="flex-1 text-right">
              <h3 className="text-2xl font-bold mb-0">{consultasSemana}</h3>
              <span className="text-gray-500">Consultas na Semana</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-2">
        <FullCalendar
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          slotMinTime="06:00:00"
          slotMaxTime="20:00:00"
          locale={ptBrLocale}
          events={eventos}
          eventClick={handleEventClick}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,dayGridDay'
          }}
          height="auto"
        />
      </div>
      {modalInfo && (
        <Modal onClose={() => setModalInfo(null)} title="Detalhes do evento">
          <dl className="grid grid-cols-3 gap-x-2 gap-y-1">
            <dt className="font-semibold">Paciente:</dt>
            <dd className="col-span-2">{modalInfo.title}</dd>
            <dt className="font-semibold">Dia da consulta:</dt>
            <dd className="col-span-2">{new Date(modalInfo.dia).toLocaleDateString()}</dd>
            <dt className="font-semibold">Horário de início:</dt>
            <dd className="col-span-2">{new Date(modalInfo.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</dd>
            <dt className="font-semibold">Horário de término:</dt>
            <dd className="col-span-2">{modalInfo.fim ? new Date(modalInfo.fim).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</dd>
            <dt className="font-semibold">Status:</dt>
            <dd className="col-span-2">{modalInfo.status}</dd>
          </dl>
          {/* Adicione botões de ação conforme necessário */}
        </Modal>
      )}
    </div>
  );
}