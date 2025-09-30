import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.min.css";

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
    const [imgPreview, setImgPreview] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [croppedImgBlob, setCroppedImgBlob] = useState(null);
    const [finalPreviewUrl, setFinalPreviewUrl] = useState('/src/assets/capa_padrao.jpg');

    const fileInputRef = useRef(null);
    const cropperRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setImgPreview(reader.result);
            setShowCropModal(true);
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        if (showCropModal && imgPreview) {
            const imageElement = document.getElementById('crop-image-paciente');
            if (imageElement) {
                if (cropperRef.current) {
                    cropperRef.current.destroy();
                }
                cropperRef.current = new Cropper(imageElement, {
                    aspectRatio: 1, viewMode: 1, autoCropArea: 1, background: false, responsive: true,
                });
            }
        }
        return () => {
            if (cropperRef.current) {
                cropperRef.current.destroy();
                cropperRef.current = null;
            }
        };
    }, [showCropModal, imgPreview]);

    const confirmCrop = () => {
        if (cropperRef.current) {
            const canvas = cropperRef.current.getCroppedCanvas({ width: 256, height: 256 });
            canvas.toBlob((blob) => {
                setCroppedImgBlob(blob);
                setFinalPreviewUrl(URL.createObjectURL(blob));
                setShowCropModal(false);
            }, 'image/jpeg');
        }
    };

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

    const finalFormData = new FormData();

    for (const key in formData) {
        finalFormData.append(key, formData[key]);
    }

    if (croppedImgBlob) {
        finalFormData.append('imagem_paciente', croppedImgBlob, 'avatar.jpg');
    }

    try {
        const response = await fetch("/api/adicionar_paciente_secretaria", {
            method: "POST",
            credentials: "include",
            body: finalFormData 
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
                        {/* --- SEÇÃO DE FOTO DO PACIENTE --- */}
                        <div className="flex flex-col items-center gap-4 border-b pb-6">
                            <img
                                src={finalPreviewUrl}
                                alt="Preview do Paciente"
                                className="w-32 h-32 rounded-full object-cover bg-slate-200"
                            />
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="px-4 py-2 bg-slate-100 text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-200"
                            >
                                Selecionar Imagem
                            </button>
                        </div>
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
             {/* MODAL DO CROPPER ATUALIZADO */}
            {showCropModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-4">
                        <h3 className="text-lg font-medium text-slate-800 mb-4">Ajustar Imagem</h3>
                        <div className="max-h-[60vh]">
                            {/* Imagem com o ID adicionado */}
                            <img id="crop-image-paciente" src={imgPreview} alt="Para cortar" className="max-w-full" />
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button type="button" onClick={() => setShowCropModal(false)} className="px-4 py-2 bg-slate-100 rounded-lg">Cancelar</button>
                            <button type="button" onClick={confirmCrop} className="px-4 py-2 bg-green text-white rounded-lg">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
