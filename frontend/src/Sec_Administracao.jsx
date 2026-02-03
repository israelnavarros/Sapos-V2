import { useState } from "react";
import Header from "./Header";
import SecPacientes from "./Sec_Pacientes";
import SecGrupos from "./Sec_Grupos";
import SecUsuarios from "./Sec_Usuarios";
import SecAlertas from "./Sec_Alertas";

export default function SecAdministracao() {
    const [abaAtiva, setAbaAtiva] = useState('pacientes');

    const TabButton = ({ aba, label }) => (
        <button
            onClick={() => setAbaAtiva(aba)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${abaAtiva === aba
                ? 'bg-white border-b-2 border-green text-green'
                : 'bg-transparent text-slate-500 hover:text-slate-700'
                }`}
        >
            {label}
        </button>
    );

    return (
        <>
            <Header />
            <main className="pt-20">
                <div className="p-4 sm:p-6 lg:p-8 bg-[#F4F1EE] min-h-screen">
                 <div className="container-geral">
                  <div className="bg-white rounded-xl shadow-md p-6">
                    {/* Cabeçalho Estilo MeuGrupo */}
                    <div className="mb-8 text-center md:text-left">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Secretaria</h3>
                        <h3 className="sm:text-5xl text-3xl font-bold text-gray-800 mb-2">Painel de Administração</h3>
                        <p className="mt-1 text-base sm:text-lg text-slate-600">Gerencie pacientes, grupos, usuários e alertas do sistema.</p>
                    </div>

                    {/* Navegação por Abas */}
                    <div className="border-b border-slate-200 mb-8 overflow-x-auto">
                        <nav className="-mb-px flex space-x-2 sm:space-x-6">
                            <TabButton aba="pacientes" label="Pacientes" />
                            <TabButton aba="grupos" label="Grupos" />
                            <TabButton aba="usuarios" label="Usuários" />
                            <TabButton aba="alertas" label="Alertas" />
                        </nav>
                    </div>

                    {/* Conteúdo das Abas */}
                    <div>
                        {abaAtiva === 'pacientes' && <SecPacientes embedded={true} />}
                        {abaAtiva === 'grupos' && <SecGrupos embedded={true} />}
                        {abaAtiva === 'usuarios' && <SecUsuarios embedded={true} />}
                        {abaAtiva === 'alertas' && <SecAlertas embedded={true} />}
                    </div>
                  </div>
                 </div>
                </div>
            </main>
        </>
    );
}