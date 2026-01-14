import { useEffect, useState } from 'react';
import { Pie, Doughnut, Bar } from 'react-chartjs-2';
import API_URL from './config';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title } from 'chart.js';
import BannerAlertas from './BannerAlertas';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
  return color;
}

function generateRandomData(labels) {
  return labels.map(() => Math.floor(Math.random() * 100) + 1);
}

function chartData(labels) {
  const data = generateRandomData(labels);
  const backgroundColor = labels.map(() => getRandomColor());
  return {
    labels,
    datasets: [{ data, backgroundColor, borderColor: backgroundColor, borderWidth: 1 }]
  };
}

export default function IndexCoordenador() {
  const [grupos, setGrupos] = useState([{ id_grupo: '', titulo: 'Todos os grupos' }]);
  const [grupoSelecionado, setGrupoSelecionado] = useState('');
  const [status, setStatus] = useState('0');

  // Labels fixos para exemplo, troque por dados reais se necessário
  const usuariosPorGrupoLabels = ['Grupo 1', 'Grupo 2', 'Grupo 3', 'Grupo 4'];
  const usuariosPorCargoLabels = ['Estagiário', 'Supervisão', 'Secretaria', 'Coordenação'];
  const usuariosPorIdadeLabels = ['18-25', '26-35', '36-45', '46-55', '56+'];
  const usuariosPorGeneroLabels = ['Masculino', 'Feminino', 'Outro'];
  const pacientesPorGrupoLabels = ['Grupo 1', 'Grupo 2', 'Grupo 3', 'Grupo 4'];
  const pacientesPorIdadeLabels = ['0-10', '11-20', '21-30', '31-40', '41-50', '51+'];
  const pacientesPorRendaLabels = ['< R$2000', 'R$2000-3000', 'R$3000-4000', 'R$4000-5000', '> R$5000'];
  const pacientesPorEscolaridadeLabels = ['Analfabeto', 'Fundamental', 'Médio', 'Superior'];
  const consultasPorGrupoLabels = ['Grupo 1', 'Grupo 2', 'Grupo 3', 'Grupo 4'];
  const consultasPorStatusLabels = ['Cancelado', 'Agendado', 'Realizado'];
  const consultasPorDiaLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const consultasPorHoraLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

  useEffect(() => {
    // Troque pelo endpoint real da sua API
    fetch(`${API_URL}/api/consulta_ids_grupos`)
      .then(res => res.json())
      .then(data => setGrupos([{ id_grupo: '', titulo: 'Todos os grupos' }, ...data]));
  }, []);

  return (
    <main className='pt-20'>
    <BannerAlertas />
    <div className="shadow-lg border rounded-lg p-6 bg-white">
      <div className="mb-6">
        <h3 className="text-center text-xl font-bold mb-4">Agenda dos estagiários</h3>
        <form className="flex flex-col md:flex-row gap-4 justify-center">
          <select
            className="form-select px-3 py-2 border rounded w-full md:w-2/3"
            value={grupoSelecionado}
            onChange={e => setGrupoSelecionado(e.target.value)}
          >
            {grupos.map(grupo => (
              <option key={grupo.id_grupo} value={grupo.id_grupo}>{grupo.titulo}</option>
            ))}
          </select>
          <select
            className="form-select px-3 py-2 border rounded w-full md:w-1/3"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="0">Todos os usuários</option>
            <option value="1">Apenas Ativos</option>
          </select>
        </form>
      </div>

      <h3 className="text-center text-lg font-semibold mt-8 mb-4">Usuários</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Pie data={chartData(usuariosPorGrupoLabels)} options={{ plugins: { title: { display: true, text: 'Usuários por Grupo' } } }} />
        <Pie data={chartData(usuariosPorCargoLabels)} options={{ plugins: { title: { display: true, text: 'Usuários por Cargo' } } }} />
        <Pie data={chartData(usuariosPorIdadeLabels)} options={{ plugins: { title: { display: true, text: 'Usuários por Idade' } } }} />
        <Pie data={chartData(usuariosPorGeneroLabels)} options={{ plugins: { title: { display: true, text: 'Usuários por Gênero' } } }} />
      </div>

      <h3 className="text-center text-lg font-semibold mt-8 mb-4">Pacientes</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Pie data={chartData(pacientesPorGrupoLabels)} options={{ plugins: { title: { display: true, text: 'Pacientes por Grupo' } } }} />
        <Pie data={chartData(pacientesPorIdadeLabels)} options={{ plugins: { title: { display: true, text: 'Pacientes por Idade' } } }} />
        <Pie data={chartData(pacientesPorRendaLabels)} options={{ plugins: { title: { display: true, text: 'Pacientes por Renda' } } }} />
        <Pie data={chartData(pacientesPorEscolaridadeLabels)} options={{ plugins: { title: { display: true, text: 'Pacientes por Escolaridade' } } }} />
      </div>

      <h3 className="text-center text-lg font-semibold mt-8 mb-4">Consultas</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Pie data={chartData(consultasPorGrupoLabels)} options={{ plugins: { title: { display: true, text: 'Consultas por Grupo' } } }} />
        <Doughnut data={chartData(consultasPorStatusLabels)} options={{ plugins: { title: { display: true, text: 'Consultas por Status' } } }} />
        <Bar data={chartData(consultasPorDiaLabels)} options={{ plugins: { title: { display: true, text: 'Consultas por Dia' } }, scales: { y: { beginAtZero: true } } }} />
        <Bar data={chartData(consultasPorHoraLabels)} options={{ plugins: { title: { display: true, text: 'Consultas por Hora' } }, scales: { y: { beginAtZero: true } } }} />
      </div>
    </div>
  </main>
  );
}
