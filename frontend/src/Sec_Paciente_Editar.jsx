import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "./Header";

// Se usar Cropper.js, instale: npm install cropperjs
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.min.css";

export default function SecEditarPaciente() {
  const { id_paciente } = useParams();
  const [paciente, setPaciente] = useState(null);
  const [form, setForm] = useState({});
  const [imgPreview, setImgPreview] = useState("");
  const [croppedImg, setCroppedImg] = useState("");
  const [showCrop, setShowCrop] = useState(false);
  const fileInputRef = useRef();
  const cropperRef = useRef();
  const navigate = useNavigate();
    
  useEffect(() => {
    fetch(`/api/editar_paciente/${id_paciente}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setPaciente(data);
        setForm(data);
        setImgPreview(data.img_url || '/src/assets/Logo.png');
      });
  }, [id_paciente]);

  // Atualiza campos do formulário
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Cropper modal
  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        setImgPreview(ev.target.result);
        setShowCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (showCrop) {
      const image = document.getElementById("crop-image");
      if (image && !cropperRef.current) {
        cropperRef.current = new Cropper(image, {
          aspectRatio: 1 / 1.5,
          viewMode: 1,
          autoCropArea: 0.65,
          minCropBoxWidth: 200,
          minCropBoxHeight: 300,
        });
      }
    }
    return () => {
      if (cropperRef.current && !showCrop) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [showCrop, imgPreview]);

  const confirmCrop = () => {
    if (cropperRef.current) {
        console.log(croppedImg)
      const canvas = cropperRef.current.getCroppedCanvas({ width: 200, height: 300 });
      setCroppedImg(canvas.toDataURL());
      setImgPreview(canvas.toDataURL());
      setShowCrop(false);
      cropperRef.current.destroy();
      cropperRef.current = null;
      
    }
  };

  // CEP busca
  const buscaCep = async cep => {
    const url = `https://viacep.com.br/ws/${cep.replace(/\D/g, "")}/json/`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.logradouro) {
      setForm(f => ({
        ...f,
        logradouro: json.logradouro,
        cidade: json.localidade,
        bairro: json.bairro,
      }));
    }
  };

  // Envia formulário
  const handleSubmit = async e => {
    e.preventDefault();
    const payload = { ...form, croppedData: croppedImg };
    const res = await fetch(`/api/atualizar_paciente/${id_paciente}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
  credentials: "include"
});
    if (res.ok) {
      navigate("/sec_pacientes");
    } else {
      alert("Erro ao salvar paciente!");
    }
  };

  if (!paciente) return <Header />;

  return (
    <>
      <Header />
      <form className="shadow-lg row g-0 border rounded p-3" onSubmit={handleSubmit}>
        <div className="text-center d-flex justify-content-center">
          <figure className="img thumbnail col-md-4">
            <img className="img-fluid" id="profile-img" src={`/api/uploads/pacientes/${id_paciente}?t=${Date.now()}`} alt="Paciente" onError={e => { e.target.src = "/src/assets/Logo.png"; }}/>
            <input type="hidden" name="croppedData" value={croppedImg} />
            <div className="d-grid gap-2 col-6 mx-auto mt-2">
              <label className="label custom-file-upload btn btn-primary btn-sm">
                <input
                  type="file"
                  className="d-none"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <i className="bi bi-person-bounding-box"></i> Anexar imagem
              </label>
            </div>
          </figure>
        </div>

        {/* Cropper Modal */}
        {showCrop && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog modal-md">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Ajustar a imagem</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCrop(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="img-container">
                    <img id="crop-image" src={imgPreview} alt="Crop" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCrop(false)}>Cancelar</button>
                  <button type="button" className="btn btn-primary" onClick={confirmCrop}>Confirmar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <fieldset className="row g-3">
          <h3>Ficha de Atendimento</h3>
          <div className="col-4">
            <div className="form-floating">
              <input className="form-control" id="floatingSupervisor" value={paciente.supervisor_nome} disabled />
              <label htmlFor="floatingSupervisor">Supervisor</label>
            </div>
          </div>
          <div className="col-4">
            <div className="form-floating">
              <input className="form-control" id="floatingEstagiario" value={paciente.estagiario_nome} disabled />
              <label htmlFor="floatingEstagiario">Estagiário</label>
            </div>
          </div>
          <div className="col-2">
            <div className="form-floating">
              <input className="form-control" id="floatingStatus" value={paciente.status ? "Ativo" : "Desativado"} disabled />
              <label htmlFor="floatingStatus">Status</label>
            </div>
          </div>
          <div className="col-2">
            <div className="form-floating">
              <input className="form-control" id="floatingDataCriacao" value={paciente.data_criacao} disabled />
              <label htmlFor="floatingDataCriacao">Data de Criação</label>
            </div>
          </div>

          <h3>Dados Pessoais do Paciente</h3>
          <div className="col-12">
            <div className="form-floating">
              <input className="form-control" id="floatingNomeCompleto" name="nome_completo" value={form.nome_completo || ""} onChange={handleChange} />
              <label htmlFor="floatingNomeCompleto">Nome Completo</label>
            </div>
          </div>
          <div className="col-9">
            <div className="form-floating">
              <input className="form-control" id="floatingNomeResponsavel" name="nome_responsavel" value={form.nome_responsavel || ""} onChange={handleChange} />
              <label htmlFor="floatingNomeResponsavel">Nome do Responsável</label>
            </div>
          </div>
          <div className="col-3">
            <div className="form-floating">
              <input className="form-control" id="floatingGrauParentesco" name="grau_parentesco" value={form.grau_parentesco || ""} onChange={handleChange} />
              <label htmlFor="floatingGrauParentesco">Grau de Parentesco</label>
            </div>
          </div>
          <div className="col-4">
            <div className="form-floating">
              <input className="form-control" id="floatingDataNascimento" name="data_nascimento" value={form.data_nascimento || ""} onChange={handleChange} />
              <label htmlFor="floatingDataNascimento">Data de Nascimento</label>
            </div>
          </div>
          <div className="col-2">
            <div className="form-floating">
              <input className="form-control" id="floatingIdade" name="idade" value={form.idade || ""} onChange={handleChange} />
              <label htmlFor="floatingIdade">Idade</label>
            </div>
          </div>
          <div className="col-6">
            <div className="form-floating">
              <input className="form-control" id="floatingSexo" name="sexo" value={form.sexo || ""} onChange={handleChange} />
              <label htmlFor="floatingSexo">Sexo</label>
            </div>
          </div>
          <div className="col-12">
            <div className="form-floating">
              <input className="form-control" id="floatingEscolaridade" name="escolaridade" value={form.escolaridade || ""} onChange={handleChange} />
              <label htmlFor="floatingEscolaridade">Escolaridade</label>
            </div>
          </div>
          <div className="col-6">
            <div className="form-floating">
              <input className="form-control" id="floatingProfissao" name="profissao" value={form.profissao || ""} onChange={handleChange} />
              <label htmlFor="floatingProfissao">Profissão</label>
            </div>
          </div>
          <div className="col-6">
            <div className="form-floating">
              <input className="form-control" id="floatingOcupacao" name="ocupacao" value={form.ocupacao || ""} onChange={handleChange} />
              <label htmlFor="floatingOcupacao">Ocupação</label>
            </div>
          </div>
          <div className="col-6">
            <div className="form-floating">
              <input className="form-control" id="floatingSalario" name="salario" value={form.salario || ""} onChange={handleChange} />
              <label htmlFor="floatingSalario">Salário</label>
            </div>
          </div>
          <div className="col-6">
            <div className="form-floating">
              <input className="form-control" id="floatingRendaFamiliar" name="renda_familiar" value={form.renda_familiar || ""} onChange={handleChange} />
              <label htmlFor="floatingRendaFamiliar">Renda Familiar</label>
            </div>
          </div>
        </fieldset>

        <fieldset className="row g-3">
          <h3>Endereço</h3>
          <div className="col-4">
            <div className="form-floating">
              <input className="form-control" id="floatingCep" name="cep" value={form.cep || ""} onChange={e => { handleChange(e); buscaCep(e.target.value); }} />
              <label htmlFor="floatingCep">CEP</label>
            </div>
          </div>
          <div className="col-4">
            <div className="form-floating">
              <input className="form-control" id="floatingCidade" name="cidade" value={form.cidade || ""} onChange={handleChange} />
              <label htmlFor="floatingCidade">Cidade</label>
            </div>
          </div>
          <div className="col-4">
            <div className="form-floating">
              <input className="form-control" id="floatingBairro" name="bairro" value={form.bairro || ""} onChange={handleChange} />
              <label htmlFor="floatingBairro">Bairro</label>
            </div>
          </div>
          <div className="col-8">
            <div className="form-floating">
              <input className="form-control" id="floatingLogradouro" name="logradouro" value={form.logradouro || ""} onChange={handleChange} />
              <label htmlFor="floatingLogradouro">Logradouro</label>
            </div>
          </div>
          <div className="col-4">
            <div className="form-floating">
              <input className="form-control" id="floatingComplemento" name="complemento" value={form.complemento || ""} onChange={handleChange} />
              <label htmlFor="floatingComplemento">Complemento</label>
            </div>
          </div>
          <div className="col-4">
            <div className="form-floating">
              <input className="form-control" id="floatingTelefone" name="telefone" value={form.telefone || ""} onChange={handleChange} />
              <label htmlFor="floatingTelefone">Telefone</label>
            </div>
          </div>
          <div className="col-4">
            <div className="form-floating">
              <input className="form-control" id="floatingCelular1" name="celular1" value={form.celular1 || ""} onChange={handleChange} />
              <label htmlFor="floatingCelular1">Celular 1</label>
            </div>
          </div>
          <div className="col-4">
            <div className="form-floating">
              <input className="form-control" id="floatingCelular2" name="celular2" value={form.celular2 || ""} onChange={handleChange} />
              <label htmlFor="floatingCelular2">Celular 2</label>
            </div>
          </div>
          <div className="col-12">
            <div className="form-floating">
              <input className="form-control" id="floatingEmail" name="email" value={form.email || ""} onChange={handleChange} />
              <label htmlFor="floatingEmail">Email</label>
            </div>
          </div>
        </fieldset>

        <fieldset className="row g-3">
          <h3>Origem do Encaminhamento</h3>
          <div className="col-12">
            <div className="form-floating">
              <select className="form-control" id="floatingOrigem" name="origem_encaminhamento" value={form.origem_encaminhamento || ""} onChange={handleChange}>
                <option value="">Selecione</option>
                <option value="Instituição">Instituição</option>
                <option value="Hospital">Hospital</option>
                <option value="Outras">Outras</option>
              </select>
              <label htmlFor="floatingOrigem">Origem do Encaminhamento</label>
              {form.origem_encaminhamento === "Outras" && (
                <input type="text" className="form-control mt-2 py-0" id="outrasOpcao" name="outrasOpcao" value={form.outrasOpcao || ""} onChange={handleChange} />
              )}
            </div>
          </div>
          <div className="col-12">
            <div className="form-floating">
              <input className="form-control" id="floatingNomeInstituicao" name="nome_instituicao" value={form.nome_instituicao || ""} onChange={handleChange} />
              <label htmlFor="floatingNomeInstituicao">Nome da Instituição</label>
            </div>
          </div>
          <div className="col-12">
            <div className="form-floating">
              <input className="form-control" id="floatingNomeResp" name="nome_resp_encaminhamento" value={form.nome_resp_encaminhamento || ""} onChange={handleChange} />
              <label htmlFor="floatingNomeResp">Nome de quem assinou o encaminhamento</label>
            </div>
          </div>
        </fieldset>

        <fieldset className="row g-3">
          <h3>Motivo da Consulta</h3>
          <div className="col-12">
            <div className="form-floating">
              <textarea className="form-control" id="floatingMotivo" name="motivo" value={form.motivo || ""} onChange={handleChange} style={{ height: "150px" }} />
              <label htmlFor="floatingMotivo">Motivo da Consulta</label>
            </div>
          </div>
          <div className="col-12">
            <div className="form-floating">
              <textarea className="form-control" id="floatingMedicamentos" name="medicamentos" value={form.medicamentos || ""} onChange={handleChange} style={{ height: "150px" }} />
              <label htmlFor="floatingMedicamentos">Medicamentos</label>
            </div>
          </div>
        </fieldset>
        <br />
        <button type="submit" className="btn btn-primary mt-3">Salvar</button>
      </form>
    </>
  );
}