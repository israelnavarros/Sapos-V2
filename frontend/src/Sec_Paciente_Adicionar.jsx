import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";

function FormField({ label, htmlFor, children }) {
    return (
        <div>
            <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700 mb-1">
                {label}
            </label>
            {children}
        </div>
    );
}

export default function SecAdicionarPaciente() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        nome_completo: "",
        nome_responsavel: "",
        grau_parentesco: "",
        celular1: "",
        celular2: "",
        telefone: "",
        idade: "",
        email: "",
        data_nascimento: "",
        sexo: "",
        etnia: "",
        genero: "",
        classe_social: "",
        hipotese_diagnostica: "",
        ja_fez_terapia: "",
        motivo: "",
        medicamentos: "",
        cidade: "",
        bairro: "",
        cep: "",
        logradouro: "",
        complemento: "",
        origem_encaminhamento: "",
        nome_instituicao: "",
        nome_resp_encaminhamento: "",
    });

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setIsSubmitting(true); 
        try {
            const response = await fetch("/api/adicionar_paciente_secretaria", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.status === "success") {
                alert("Paciente cadastrado com sucesso!");
                navigate(-1); 
            } else {
                throw new Error(data.message || "Ocorreu um erro ao cadastrar o paciente.");
            }
        } catch (error) {
            alert(error.message);
            console.error("Falha no cadastro:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const inputStyle = "mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green focus:border-green";

    return (
        <>
            <Header />
            <main className="mt-20 p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-slate-800 mb-6">Cadastrar Novo Paciente</h1>

                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md space-y-6">
                        {/* --- DADOS PESSOAIS E CONTATO --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-6">
                            <FormField label="Nome Completo" htmlFor="nome_completo" className="block text-sm font-semibold text-slate-700">
                                <input id="nome_completo" name="nome_completo" required value={formData.nome_completo} onChange={handleChange} className={inputStyle} placeholder="Nome completo do paciente" />
                            </FormField>
                            <FormField label="Data de Nascimento" htmlFor="data_nascimento">
                                <input id="data_nascimento" name="data_nascimento" type="date" value={formData.data_nascimento} onChange={handleChange} className={inputStyle} />
                            </FormField>
                            <FormField label="Idade" htmlFor="idade">
                                <input id="idade" name="idade" type="number" required value={formData.idade} onChange={handleChange} className={inputStyle} placeholder="0" />
                            </FormField>
                            <FormField label="Sexo" htmlFor="sexo">
                                <select id="sexo" name="sexo" value={formData.sexo} onChange={handleChange} className={inputStyle}>
                                    <option value="">Selecione...</option>
                                    <option value="M">Masculino</option>
                                    <option value="F">Feminino</option>
                                    <option value="O">Outro</option>
                                </select>
                            </FormField>
                            <FormField label="Celular 1" htmlFor="celular1">
                                <input id="celular1" name="celular1" required value={formData.celular1} onChange={handleChange} className={inputStyle} placeholder="(XX) XXXXX-XXXX" />
                            </FormField>
                            <FormField label="Email" htmlFor="email">
                                <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className={inputStyle} placeholder="email@exemplo.com" />
                            </FormField>
                        </div>

                        {/* --- ENDEREÇO --- */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b pb-6">
                            <FormField label="CEP" htmlFor="cep">
                                <input id="cep" name="cep" value={formData.cep} onChange={handleChange} className={inputStyle} placeholder="00000-000" />
                            </FormField>
                            <div className="md:col-span-2">
                                <FormField label="Logradouro (Rua, Av.)" htmlFor="logradouro">
                                    <input id="logradouro" name="logradouro" value={formData.logradouro} onChange={handleChange} className={inputStyle} />
                                </FormField>
                            </div>
                            <FormField label="Bairro" htmlFor="bairro">
                                <input id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} className={inputStyle} />
                            </FormField>
                            <FormField label="Cidade" htmlFor="cidade">
                                <input id="cidade" name="cidade" value={formData.cidade} onChange={handleChange} className={inputStyle} />
                            </FormField>
                        </div>

                        {/* --- INFORMAÇÕES CLÍNICAS --- */}
                        <div className="grid grid-cols-1 gap-6">
                            <FormField label="Motivo do Encaminhamento / Queixa Principal" htmlFor="motivo">
                                <textarea id="motivo" name="motivo" value={formData.motivo} onChange={handleChange} rows="4" className={inputStyle}></textarea>
                            </FormField>
                            <FormField label="Medicamentos em Uso" htmlFor="medicamentos">
                                <textarea id="medicamentos" name="medicamentos" value={formData.medicamentos} onChange={handleChange} rows="3" className={inputStyle}></textarea>
                            </FormField>
                        </div>

                        <div className="pt-6 border-t text-right">
                            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-green text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-colors disabled:opacity-50">
                                {isSubmitting ? "Cadastrando..." : "Cadastrar Paciente"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
