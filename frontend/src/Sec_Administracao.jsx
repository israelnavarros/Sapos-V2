import { Link } from "react-router-dom";
import Header from "./Header";

// --- Componente Reutilizável para os Cards de Navegação ---
// Ele recebe um ícone (como JSX), um título e o link de destino
function AdminCard({ icon, title, to }) {
    return (
        <Link 
            to={to} 
            className="group block h-full bg-green p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
        >
            <div className="flex flex-col items-center text-center">
                <div className="flex-shrink-0 bg-green-100 p-4 rounded-full group-hover:bg-green-400 transition-colors duration-300">
                    {icon}
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">
                    {title}
                </h3>
            </div>
        </Link>
    );
}


export default function SecAdministracao() {
    return (
        <>
            <Header />
            <main className="bg-slate-50 min-h-screen pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-slate-900">Painel de Administração</h1>
                        <p className="mt-2 text-lg text-slate-600">Selecione uma área para gerenciar.</p>
                    </div>

                    {/* Grid responsivo para os cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        
                        <AdminCard 
                            to="/sec_pacientes"
                            title="Pacientes"
                            icon={<i className="bi bi-clipboard2-pulse text-3xl text-green"></i>}
                        />

                        <AdminCard 
                            to="/sec_grupos"
                            title="Grupos"
                            icon={<i className="bi bi-diagram-2 text-3xl text-green"></i>}
                        />

                        <AdminCard 
                            to="/sec_usuarios"
                            title="Usuários"
                            icon={<i className="bi bi-people text-3xl text-green"></i>}
                        />

                        <AdminCard 
                            to="/sec_alertas"
                            title="Alertas"
                            icon={<i className="bi bi-exclamation-triangle text-3xl text-green"></i>}
                        />

                    </div>
                </div>
            </main>
        </>
    );
}