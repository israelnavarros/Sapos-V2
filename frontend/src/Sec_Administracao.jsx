import { Link } from "react-router-dom";
import Header from "./Header";

export default function SecAdministracao() {
  return (
    <>
      <Header />
      <style>
        {`
        .icon-box{
            padding: 60px 30px;
            position: relative;
            overflow: hidden;
            background: #008d7d;
            box-shadow: 0 0 29px 0 rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease-in-out;
            border-radius: 8px;
            z-index: 1;
            height: 100%;
            width: 100%;
            text-align: center;
        }
        .icon-box i {
            margin-bottom: 20px;
            padding-top: 10px;
            display: inline-block;
            transition: all 0.3s ease-in-out;
            font-size: 48px;
            line-height: 1;
            color: rgba(255, 255, 255, 0.9);
        }
        .icon-box h4 {
            font-weight: 700;
            margin-bottom: 15px;
            font-size: 24px;
        }
        .icon-box a {
            color: #ffffff;
            transition: 0.3s;
            text-decoration: none;
        }
        `}
      </style>
      <div className="icon-boxes position-relative">
        <div className="container position-relative">
          <div className="row gy-4 mt-5">
            <div className="col-xl-3 col-md-6">
              <div className="icon-box">
                <div className="icon"><i className="bi bi-clipboard2-pulse"></i></div>
                <h4 className="title">
                  <Link to="/sec_pacientes" className="stretched-link">Pacientes</Link>
                </h4>
              </div>
            </div>
            <div className="col-xl-3 col-md-6">
              <div className="icon-box">
                <div className="icon"><i className="bi bi-diagram-2"></i></div>
                <h4 className="title">
                  <Link to="/adm_grupos" className="stretched-link">Grupos</Link>
                </h4>
              </div>
            </div>
            <div className="col-xl-3 col-md-6">
              <div className="icon-box">
                <div className="icon"><i className="bi bi-people"></i></div>
                <h4 className="title">
                  <Link to="/adm_usuarios" className="stretched-link">Usuários</Link>
                </h4>
              </div>
            </div>
            <div className="col-xl-3 col-md-6">
              <div className="icon-box">
                <div className="icon"><i className="bi bi-exclamation-triangle"></i></div>
                <h4 className="title">
                  <Link to="/adm_alertas" className="stretched-link">Alertas</Link>
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}