drop extension if exists "pg_net";

create sequence "public"."alertas_id_alerta_seq";

create sequence "public"."cargos_id_cargo_seq";

create sequence "public"."consultas_id_consulta_seq";

create sequence "public"."folha_evolucao_id_folha_seq";

create sequence "public"."grupos_id_grupo_seq";

create sequence "public"."historico_doencas_id_doenca_seq";

create sequence "public"."notificacoes_id_notificacao_seq";

create sequence "public"."pacientes_id_paciente_seq";

create sequence "public"."reuniao_grupos_id_reuniaogrupos_seq";

create sequence "public"."reunioes_id_reuniao_seq";

create sequence "public"."solicitacoes_acesso_id_solicitacao_seq";

create sequence "public"."trocas_supervisao_id_troca_seq";

create sequence "public"."usuarios_id_usuario_seq";


  create table "public"."alertas" (
    "id_alerta" integer not null default nextval('public.alertas_id_alerta_seq'::regclass),
    "titulo" character varying(100) not null,
    "mensagem" character varying(2000) not null,
    "validade" date not null
      );


alter table "public"."alertas" enable row level security;


  create table "public"."cargos" (
    "id_cargo" integer not null default nextval('public.cargos_id_cargo_seq'::regclass),
    "nome" character varying(50) not null
      );


alter table "public"."cargos" enable row level security;


  create table "public"."consultas" (
    "id_consulta" integer not null default nextval('public.consultas_id_consulta_seq'::regclass),
    "id_usuario" integer not null,
    "id_grupo" integer not null,
    "id_paciente" integer not null,
    "dia" date not null,
    "hora_inicio" time without time zone not null,
    "hora_fim" time without time zone not null,
    "cor" character varying(10) not null,
    "status" character varying(10) not null
      );


alter table "public"."consultas" enable row level security;


  create table "public"."folha_evolucao" (
    "id_folha" integer not null default nextval('public.folha_evolucao_id_folha_seq'::regclass),
    "id_paciente" integer not null,
    "id_estagiario" integer not null,
    "data_postagem" timestamp without time zone not null,
    "data_check_supervisor" timestamp without time zone,
    "status_validacao" character varying(20) not null default 'Pendente'::character varying,
    "feedback" text,
    "data_status" timestamp without time zone not null default CURRENT_TIMESTAMP,
    "numero_sessao" integer,
    "id_supervisor" integer,
    "hipotese_diagnostica" text,
    "sintomas_atuais" text,
    "intervencoes_realizadas" text,
    "evolucao_clinica" text,
    "plano_proxima_sessao" text,
    "observacoes" text,
    "valor" numeric(10,2)
      );


alter table "public"."folha_evolucao" enable row level security;


  create table "public"."grupos" (
    "id_grupo" integer not null default nextval('public.grupos_id_grupo_seq'::regclass),
    "titulo" character varying(120) not null,
    "vagas_estagiarios" integer not null,
    "convenio" character varying(50),
    "local" character varying(50) not null,
    "resumo" character varying(2000) not null,
    "objetivos" character varying(2000) not null,
    "atividades" character varying(2000) not null,
    "bibliografia" character varying(2000) not null
      );


alter table "public"."grupos" enable row level security;


  create table "public"."historico_doencas" (
    "id_doenca" integer not null default nextval('public.historico_doencas_id_doenca_seq'::regclass),
    "nome" character varying(50) not null
      );


alter table "public"."historico_doencas" enable row level security;


  create table "public"."notificacoes" (
    "id_notificacao" integer not null default nextval('public.notificacoes_id_notificacao_seq'::regclass),
    "mensagem" text not null,
    "tipo" character varying(50),
    "id_cargo_destinatario" integer,
    "data_criacao" timestamp without time zone default CURRENT_TIMESTAMP,
    "validade" date,
    "id_usuario_destinatario" integer,
    "id_paciente" integer,
    "visto" boolean not null default false
      );


alter table "public"."notificacoes" enable row level security;


  create table "public"."paciente_tags" (
    "id_paciente" integer not null,
    "id_tag" integer not null
      );


alter table "public"."paciente_tags" enable row level security;


  create table "public"."pacientes" (
    "id_paciente" integer not null default nextval('public.pacientes_id_paciente_seq'::regclass),
    "id_estagiario" integer,
    "id_supervisor" integer,
    "status" boolean,
    "data_criacao" date,
    "nome_completo" character varying(100) not null,
    "nome_responsavel" character varying(100),
    "grau_parentesco" character varying(20),
    "data_nascimento" date,
    "idade" integer not null,
    "sexo" character varying(1),
    "escolaridade" character varying(2),
    "profissao" character varying(50),
    "ocupacao" character varying(50),
    "salario" numeric(10,2),
    "renda_familiar" numeric(10,2),
    "email" character varying(100),
    "cep" integer,
    "cidade" character varying(30),
    "bairro" character varying(30),
    "logradouro" character varying(255),
    "complemento" character varying(50),
    "telefone" character varying(15),
    "celular1" character varying(15) not null,
    "celular2" character varying(15),
    "origem_encaminhamento" character varying(50),
    "nome_instituicao" character varying(50),
    "nome_resp_encaminhamento" character varying(50),
    "motivo" text,
    "medicamentos" text,
    "intervalo_sessoes" character varying(20),
    "hipotese_diagnostica" text,
    "ja_fez_terapia" boolean,
    "etnia" text,
    "genero" text,
    "classe_social" text,
    "acesso_liberado" boolean default false
      );


alter table "public"."pacientes" enable row level security;


  create table "public"."reuniao_grupos" (
    "id_reuniaogrupos" integer not null default nextval('public.reuniao_grupos_id_reuniaogrupos_seq'::regclass),
    "id_grupo" integer not null,
    "dia" integer not null,
    "hora_inicio" time without time zone not null,
    "hora_fim" time without time zone not null
      );


alter table "public"."reuniao_grupos" enable row level security;


  create table "public"."reuniao_participantes" (
    "id_reuniao" integer not null,
    "id_participante" integer not null
      );


alter table "public"."reuniao_participantes" enable row level security;


  create table "public"."reunioes" (
    "id_reuniao" integer not null default nextval('public.reunioes_id_reuniao_seq'::regclass),
    "id_supervisor" integer not null,
    "titulo" character varying(100) not null,
    "dia" date not null,
    "hora_inicio" time without time zone not null,
    "hora_fim" time without time zone not null
      );


alter table "public"."reunioes" enable row level security;


  create table "public"."solicitacoes_acesso" (
    "id_solicitacao" integer not null default nextval('public.solicitacoes_acesso_id_solicitacao_seq'::regclass),
    "id_paciente" integer not null,
    "id_estagiario" integer not null,
    "id_supervisor" integer not null,
    "status" character varying(20) not null default 'pendente'::character varying,
    "data_solicitacao" timestamp without time zone not null,
    "data_resposta" timestamp without time zone
      );


alter table "public"."solicitacoes_acesso" enable row level security;


  create table "public"."tags" (
    "id_tag" integer generated always as identity not null,
    "nome" character varying(50) not null
      );


alter table "public"."tags" enable row level security;


  create table "public"."trocas_supervisao" (
    "id_troca" integer not null default nextval('public.trocas_supervisao_id_troca_seq'::regclass),
    "id_estagiario" integer not null,
    "id_supervisor_atual" integer,
    "id_supervisor_novo" integer not null,
    "levar_pacientes" boolean default false,
    "justificativa" text,
    "status" character varying(20) default 'pendente'::character varying,
    "data_solicitacao" date default CURRENT_DATE,
    "data_resposta" date,
    "id_aprovador" integer,
    "id_grupo_origem" integer,
    "id_grupo_destino" integer
      );


alter table "public"."trocas_supervisao" enable row level security;


  create table "public"."usuarios" (
    "id_usuario" integer not null default nextval('public.usuarios_id_usuario_seq'::regclass),
    "matricula" character varying(30) not null,
    "nome" character varying(255) not null,
    "email" character varying(100) not null,
    "senha" character varying(100) not null,
    "cargo" integer not null,
    "grupo" integer,
    "status" boolean not null,
    "criado_em" date not null,
    "valido_ate" date not null,
    "session_token" character varying(80)
      );


alter table "public"."usuarios" enable row level security;

alter sequence "public"."alertas_id_alerta_seq" owned by "public"."alertas"."id_alerta";

alter sequence "public"."cargos_id_cargo_seq" owned by "public"."cargos"."id_cargo";

alter sequence "public"."consultas_id_consulta_seq" owned by "public"."consultas"."id_consulta";

alter sequence "public"."folha_evolucao_id_folha_seq" owned by "public"."folha_evolucao"."id_folha";

alter sequence "public"."grupos_id_grupo_seq" owned by "public"."grupos"."id_grupo";

alter sequence "public"."historico_doencas_id_doenca_seq" owned by "public"."historico_doencas"."id_doenca";

alter sequence "public"."notificacoes_id_notificacao_seq" owned by "public"."notificacoes"."id_notificacao";

alter sequence "public"."pacientes_id_paciente_seq" owned by "public"."pacientes"."id_paciente";

alter sequence "public"."reuniao_grupos_id_reuniaogrupos_seq" owned by "public"."reuniao_grupos"."id_reuniaogrupos";

alter sequence "public"."reunioes_id_reuniao_seq" owned by "public"."reunioes"."id_reuniao";

alter sequence "public"."solicitacoes_acesso_id_solicitacao_seq" owned by "public"."solicitacoes_acesso"."id_solicitacao";

alter sequence "public"."trocas_supervisao_id_troca_seq" owned by "public"."trocas_supervisao"."id_troca";

alter sequence "public"."usuarios_id_usuario_seq" owned by "public"."usuarios"."id_usuario";

CREATE UNIQUE INDEX alertas_pkey ON public.alertas USING btree (id_alerta);

CREATE UNIQUE INDEX cargos_pkey ON public.cargos USING btree (id_cargo);

CREATE UNIQUE INDEX consultas_pkey ON public.consultas USING btree (id_consulta);

CREATE UNIQUE INDEX folha_evolucao_pkey ON public.folha_evolucao USING btree (id_folha);

CREATE UNIQUE INDEX grupos_pkey ON public.grupos USING btree (id_grupo);

CREATE UNIQUE INDEX historico_doencas_pkey ON public.historico_doencas USING btree (id_doenca);

CREATE UNIQUE INDEX notificacoes_pkey ON public.notificacoes USING btree (id_notificacao);

CREATE UNIQUE INDEX paciente_tags_pkey ON public.paciente_tags USING btree (id_paciente, id_tag);

CREATE UNIQUE INDEX pacientes_pkey ON public.pacientes USING btree (id_paciente);

CREATE UNIQUE INDEX reuniao_grupos_pkey ON public.reuniao_grupos USING btree (id_reuniaogrupos);

CREATE UNIQUE INDEX reuniao_participantes_pkey ON public.reuniao_participantes USING btree (id_reuniao, id_participante);

CREATE UNIQUE INDEX reunioes_pkey ON public.reunioes USING btree (id_reuniao);

CREATE UNIQUE INDEX solicitacoes_acesso_pkey ON public.solicitacoes_acesso USING btree (id_solicitacao);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id_tag);

CREATE UNIQUE INDEX trocas_supervisao_pkey ON public.trocas_supervisao USING btree (id_troca);

CREATE UNIQUE INDEX usuarios_email_key ON public.usuarios USING btree (email);

CREATE UNIQUE INDEX usuarios_pkey ON public.usuarios USING btree (id_usuario);

alter table "public"."alertas" add constraint "alertas_pkey" PRIMARY KEY using index "alertas_pkey";

alter table "public"."cargos" add constraint "cargos_pkey" PRIMARY KEY using index "cargos_pkey";

alter table "public"."consultas" add constraint "consultas_pkey" PRIMARY KEY using index "consultas_pkey";

alter table "public"."folha_evolucao" add constraint "folha_evolucao_pkey" PRIMARY KEY using index "folha_evolucao_pkey";

alter table "public"."grupos" add constraint "grupos_pkey" PRIMARY KEY using index "grupos_pkey";

alter table "public"."historico_doencas" add constraint "historico_doencas_pkey" PRIMARY KEY using index "historico_doencas_pkey";

alter table "public"."notificacoes" add constraint "notificacoes_pkey" PRIMARY KEY using index "notificacoes_pkey";

alter table "public"."paciente_tags" add constraint "paciente_tags_pkey" PRIMARY KEY using index "paciente_tags_pkey";

alter table "public"."pacientes" add constraint "pacientes_pkey" PRIMARY KEY using index "pacientes_pkey";

alter table "public"."reuniao_grupos" add constraint "reuniao_grupos_pkey" PRIMARY KEY using index "reuniao_grupos_pkey";

alter table "public"."reuniao_participantes" add constraint "reuniao_participantes_pkey" PRIMARY KEY using index "reuniao_participantes_pkey";

alter table "public"."reunioes" add constraint "reunioes_pkey" PRIMARY KEY using index "reunioes_pkey";

alter table "public"."solicitacoes_acesso" add constraint "solicitacoes_acesso_pkey" PRIMARY KEY using index "solicitacoes_acesso_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."trocas_supervisao" add constraint "trocas_supervisao_pkey" PRIMARY KEY using index "trocas_supervisao_pkey";

alter table "public"."usuarios" add constraint "usuarios_pkey" PRIMARY KEY using index "usuarios_pkey";

alter table "public"."consultas" add constraint "consultas_id_grupo_fkey" FOREIGN KEY (id_grupo) REFERENCES public.grupos(id_grupo) not valid;

alter table "public"."consultas" validate constraint "consultas_id_grupo_fkey";

alter table "public"."consultas" add constraint "consultas_id_paciente_fkey" FOREIGN KEY (id_paciente) REFERENCES public.pacientes(id_paciente) not valid;

alter table "public"."consultas" validate constraint "consultas_id_paciente_fkey";

alter table "public"."consultas" add constraint "consultas_id_usuario_fkey" FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) not valid;

alter table "public"."consultas" validate constraint "consultas_id_usuario_fkey";

alter table "public"."folha_evolucao" add constraint "fk_supervisor" FOREIGN KEY (id_supervisor) REFERENCES public.usuarios(id_usuario) not valid;

alter table "public"."folha_evolucao" validate constraint "fk_supervisor";

alter table "public"."folha_evolucao" add constraint "folha_evolucao_id_estagiario_fkey" FOREIGN KEY (id_estagiario) REFERENCES public.usuarios(id_usuario) not valid;

alter table "public"."folha_evolucao" validate constraint "folha_evolucao_id_estagiario_fkey";

alter table "public"."folha_evolucao" add constraint "folha_evolucao_id_paciente_fkey" FOREIGN KEY (id_paciente) REFERENCES public.pacientes(id_paciente) not valid;

alter table "public"."folha_evolucao" validate constraint "folha_evolucao_id_paciente_fkey";

alter table "public"."notificacoes" add constraint "fk_destinatario" FOREIGN KEY (id_cargo_destinatario) REFERENCES public.cargos(id_cargo) not valid;

alter table "public"."notificacoes" validate constraint "fk_destinatario";

alter table "public"."paciente_tags" add constraint "paciente_tags_id_paciente_fkey" FOREIGN KEY (id_paciente) REFERENCES public.pacientes(id_paciente) not valid;

alter table "public"."paciente_tags" validate constraint "paciente_tags_id_paciente_fkey";

alter table "public"."paciente_tags" add constraint "paciente_tags_id_tag_fkey" FOREIGN KEY (id_tag) REFERENCES public.tags(id_tag) not valid;

alter table "public"."paciente_tags" validate constraint "paciente_tags_id_tag_fkey";

alter table "public"."pacientes" add constraint "pacientes_id_estagiario_fkey" FOREIGN KEY (id_estagiario) REFERENCES public.usuarios(id_usuario) not valid;

alter table "public"."pacientes" validate constraint "pacientes_id_estagiario_fkey";

alter table "public"."pacientes" add constraint "pacientes_id_supervisor_fkey" FOREIGN KEY (id_supervisor) REFERENCES public.usuarios(id_usuario) not valid;

alter table "public"."pacientes" validate constraint "pacientes_id_supervisor_fkey";

alter table "public"."reuniao_grupos" add constraint "reuniao_grupos_id_grupo_fkey" FOREIGN KEY (id_grupo) REFERENCES public.grupos(id_grupo) not valid;

alter table "public"."reuniao_grupos" validate constraint "reuniao_grupos_id_grupo_fkey";

alter table "public"."reuniao_participantes" add constraint "reuniao_participantes_id_participante_fkey" FOREIGN KEY (id_participante) REFERENCES public.usuarios(id_usuario) not valid;

alter table "public"."reuniao_participantes" validate constraint "reuniao_participantes_id_participante_fkey";

alter table "public"."reuniao_participantes" add constraint "reuniao_participantes_id_reuniao_fkey" FOREIGN KEY (id_reuniao) REFERENCES public.reunioes(id_reuniao) ON DELETE CASCADE not valid;

alter table "public"."reuniao_participantes" validate constraint "reuniao_participantes_id_reuniao_fkey";

alter table "public"."reunioes" add constraint "reunioes_id_supervisor_fkey" FOREIGN KEY (id_supervisor) REFERENCES public.usuarios(id_usuario) not valid;

alter table "public"."reunioes" validate constraint "reunioes_id_supervisor_fkey";

alter table "public"."solicitacoes_acesso" add constraint "solicitacoes_acesso_id_estagiario_fkey" FOREIGN KEY (id_estagiario) REFERENCES public.usuarios(id_usuario) not valid;

alter table "public"."solicitacoes_acesso" validate constraint "solicitacoes_acesso_id_estagiario_fkey";

alter table "public"."solicitacoes_acesso" add constraint "solicitacoes_acesso_id_paciente_fkey" FOREIGN KEY (id_paciente) REFERENCES public.pacientes(id_paciente) not valid;

alter table "public"."solicitacoes_acesso" validate constraint "solicitacoes_acesso_id_paciente_fkey";

alter table "public"."solicitacoes_acesso" add constraint "solicitacoes_acesso_id_supervisor_fkey" FOREIGN KEY (id_supervisor) REFERENCES public.usuarios(id_usuario) not valid;

alter table "public"."solicitacoes_acesso" validate constraint "solicitacoes_acesso_id_supervisor_fkey";

alter table "public"."trocas_supervisao" add constraint "trocas_supervisao_id_aprovador_fkey" FOREIGN KEY (id_aprovador) REFERENCES public.usuarios(id_usuario) not valid;

alter table "public"."trocas_supervisao" validate constraint "trocas_supervisao_id_aprovador_fkey";

alter table "public"."trocas_supervisao" add constraint "trocas_supervisao_id_estagiario_fkey" FOREIGN KEY (id_estagiario) REFERENCES public.usuarios(id_usuario) not valid;

alter table "public"."trocas_supervisao" validate constraint "trocas_supervisao_id_estagiario_fkey";

alter table "public"."trocas_supervisao" add constraint "trocas_supervisao_id_supervisor_atual_fkey" FOREIGN KEY (id_supervisor_atual) REFERENCES public.usuarios(id_usuario) not valid;

alter table "public"."trocas_supervisao" validate constraint "trocas_supervisao_id_supervisor_atual_fkey";

alter table "public"."trocas_supervisao" add constraint "trocas_supervisao_id_supervisor_novo_fkey" FOREIGN KEY (id_supervisor_novo) REFERENCES public.usuarios(id_usuario) not valid;

alter table "public"."trocas_supervisao" validate constraint "trocas_supervisao_id_supervisor_novo_fkey";

alter table "public"."usuarios" add constraint "fk_usuarios_cargo" FOREIGN KEY (cargo) REFERENCES public.cargos(id_cargo) not valid;

alter table "public"."usuarios" validate constraint "fk_usuarios_cargo";

alter table "public"."usuarios" add constraint "usuarios_email_key" UNIQUE using index "usuarios_email_key";

alter table "public"."usuarios" add constraint "usuarios_grupo_fkey" FOREIGN KEY (grupo) REFERENCES public.grupos(id_grupo) not valid;

alter table "public"."usuarios" validate constraint "usuarios_grupo_fkey";

grant delete on table "public"."alertas" to "anon";

grant insert on table "public"."alertas" to "anon";

grant references on table "public"."alertas" to "anon";

grant select on table "public"."alertas" to "anon";

grant trigger on table "public"."alertas" to "anon";

grant truncate on table "public"."alertas" to "anon";

grant update on table "public"."alertas" to "anon";

grant delete on table "public"."alertas" to "authenticated";

grant insert on table "public"."alertas" to "authenticated";

grant references on table "public"."alertas" to "authenticated";

grant select on table "public"."alertas" to "authenticated";

grant trigger on table "public"."alertas" to "authenticated";

grant truncate on table "public"."alertas" to "authenticated";

grant update on table "public"."alertas" to "authenticated";

grant delete on table "public"."alertas" to "service_role";

grant insert on table "public"."alertas" to "service_role";

grant references on table "public"."alertas" to "service_role";

grant select on table "public"."alertas" to "service_role";

grant trigger on table "public"."alertas" to "service_role";

grant truncate on table "public"."alertas" to "service_role";

grant update on table "public"."alertas" to "service_role";

grant delete on table "public"."cargos" to "anon";

grant insert on table "public"."cargos" to "anon";

grant references on table "public"."cargos" to "anon";

grant select on table "public"."cargos" to "anon";

grant trigger on table "public"."cargos" to "anon";

grant truncate on table "public"."cargos" to "anon";

grant update on table "public"."cargos" to "anon";

grant delete on table "public"."cargos" to "authenticated";

grant insert on table "public"."cargos" to "authenticated";

grant references on table "public"."cargos" to "authenticated";

grant select on table "public"."cargos" to "authenticated";

grant trigger on table "public"."cargos" to "authenticated";

grant truncate on table "public"."cargos" to "authenticated";

grant update on table "public"."cargos" to "authenticated";

grant delete on table "public"."cargos" to "service_role";

grant insert on table "public"."cargos" to "service_role";

grant references on table "public"."cargos" to "service_role";

grant select on table "public"."cargos" to "service_role";

grant trigger on table "public"."cargos" to "service_role";

grant truncate on table "public"."cargos" to "service_role";

grant update on table "public"."cargos" to "service_role";

grant delete on table "public"."consultas" to "anon";

grant insert on table "public"."consultas" to "anon";

grant references on table "public"."consultas" to "anon";

grant select on table "public"."consultas" to "anon";

grant trigger on table "public"."consultas" to "anon";

grant truncate on table "public"."consultas" to "anon";

grant update on table "public"."consultas" to "anon";

grant delete on table "public"."consultas" to "authenticated";

grant insert on table "public"."consultas" to "authenticated";

grant references on table "public"."consultas" to "authenticated";

grant select on table "public"."consultas" to "authenticated";

grant trigger on table "public"."consultas" to "authenticated";

grant truncate on table "public"."consultas" to "authenticated";

grant update on table "public"."consultas" to "authenticated";

grant delete on table "public"."consultas" to "service_role";

grant insert on table "public"."consultas" to "service_role";

grant references on table "public"."consultas" to "service_role";

grant select on table "public"."consultas" to "service_role";

grant trigger on table "public"."consultas" to "service_role";

grant truncate on table "public"."consultas" to "service_role";

grant update on table "public"."consultas" to "service_role";

grant delete on table "public"."folha_evolucao" to "anon";

grant insert on table "public"."folha_evolucao" to "anon";

grant references on table "public"."folha_evolucao" to "anon";

grant select on table "public"."folha_evolucao" to "anon";

grant trigger on table "public"."folha_evolucao" to "anon";

grant truncate on table "public"."folha_evolucao" to "anon";

grant update on table "public"."folha_evolucao" to "anon";

grant delete on table "public"."folha_evolucao" to "authenticated";

grant insert on table "public"."folha_evolucao" to "authenticated";

grant references on table "public"."folha_evolucao" to "authenticated";

grant select on table "public"."folha_evolucao" to "authenticated";

grant trigger on table "public"."folha_evolucao" to "authenticated";

grant truncate on table "public"."folha_evolucao" to "authenticated";

grant update on table "public"."folha_evolucao" to "authenticated";

grant delete on table "public"."folha_evolucao" to "service_role";

grant insert on table "public"."folha_evolucao" to "service_role";

grant references on table "public"."folha_evolucao" to "service_role";

grant select on table "public"."folha_evolucao" to "service_role";

grant trigger on table "public"."folha_evolucao" to "service_role";

grant truncate on table "public"."folha_evolucao" to "service_role";

grant update on table "public"."folha_evolucao" to "service_role";

grant delete on table "public"."grupos" to "anon";

grant insert on table "public"."grupos" to "anon";

grant references on table "public"."grupos" to "anon";

grant select on table "public"."grupos" to "anon";

grant trigger on table "public"."grupos" to "anon";

grant truncate on table "public"."grupos" to "anon";

grant update on table "public"."grupos" to "anon";

grant delete on table "public"."grupos" to "authenticated";

grant insert on table "public"."grupos" to "authenticated";

grant references on table "public"."grupos" to "authenticated";

grant select on table "public"."grupos" to "authenticated";

grant trigger on table "public"."grupos" to "authenticated";

grant truncate on table "public"."grupos" to "authenticated";

grant update on table "public"."grupos" to "authenticated";

grant delete on table "public"."grupos" to "service_role";

grant insert on table "public"."grupos" to "service_role";

grant references on table "public"."grupos" to "service_role";

grant select on table "public"."grupos" to "service_role";

grant trigger on table "public"."grupos" to "service_role";

grant truncate on table "public"."grupos" to "service_role";

grant update on table "public"."grupos" to "service_role";

grant delete on table "public"."historico_doencas" to "anon";

grant insert on table "public"."historico_doencas" to "anon";

grant references on table "public"."historico_doencas" to "anon";

grant select on table "public"."historico_doencas" to "anon";

grant trigger on table "public"."historico_doencas" to "anon";

grant truncate on table "public"."historico_doencas" to "anon";

grant update on table "public"."historico_doencas" to "anon";

grant delete on table "public"."historico_doencas" to "authenticated";

grant insert on table "public"."historico_doencas" to "authenticated";

grant references on table "public"."historico_doencas" to "authenticated";

grant select on table "public"."historico_doencas" to "authenticated";

grant trigger on table "public"."historico_doencas" to "authenticated";

grant truncate on table "public"."historico_doencas" to "authenticated";

grant update on table "public"."historico_doencas" to "authenticated";

grant delete on table "public"."historico_doencas" to "service_role";

grant insert on table "public"."historico_doencas" to "service_role";

grant references on table "public"."historico_doencas" to "service_role";

grant select on table "public"."historico_doencas" to "service_role";

grant trigger on table "public"."historico_doencas" to "service_role";

grant truncate on table "public"."historico_doencas" to "service_role";

grant update on table "public"."historico_doencas" to "service_role";

grant delete on table "public"."notificacoes" to "anon";

grant insert on table "public"."notificacoes" to "anon";

grant references on table "public"."notificacoes" to "anon";

grant select on table "public"."notificacoes" to "anon";

grant trigger on table "public"."notificacoes" to "anon";

grant truncate on table "public"."notificacoes" to "anon";

grant update on table "public"."notificacoes" to "anon";

grant delete on table "public"."notificacoes" to "authenticated";

grant insert on table "public"."notificacoes" to "authenticated";

grant references on table "public"."notificacoes" to "authenticated";

grant select on table "public"."notificacoes" to "authenticated";

grant trigger on table "public"."notificacoes" to "authenticated";

grant truncate on table "public"."notificacoes" to "authenticated";

grant update on table "public"."notificacoes" to "authenticated";

grant delete on table "public"."notificacoes" to "service_role";

grant insert on table "public"."notificacoes" to "service_role";

grant references on table "public"."notificacoes" to "service_role";

grant select on table "public"."notificacoes" to "service_role";

grant trigger on table "public"."notificacoes" to "service_role";

grant truncate on table "public"."notificacoes" to "service_role";

grant update on table "public"."notificacoes" to "service_role";

grant delete on table "public"."paciente_tags" to "anon";

grant insert on table "public"."paciente_tags" to "anon";

grant references on table "public"."paciente_tags" to "anon";

grant select on table "public"."paciente_tags" to "anon";

grant trigger on table "public"."paciente_tags" to "anon";

grant truncate on table "public"."paciente_tags" to "anon";

grant update on table "public"."paciente_tags" to "anon";

grant delete on table "public"."paciente_tags" to "authenticated";

grant insert on table "public"."paciente_tags" to "authenticated";

grant references on table "public"."paciente_tags" to "authenticated";

grant select on table "public"."paciente_tags" to "authenticated";

grant trigger on table "public"."paciente_tags" to "authenticated";

grant truncate on table "public"."paciente_tags" to "authenticated";

grant update on table "public"."paciente_tags" to "authenticated";

grant delete on table "public"."paciente_tags" to "service_role";

grant insert on table "public"."paciente_tags" to "service_role";

grant references on table "public"."paciente_tags" to "service_role";

grant select on table "public"."paciente_tags" to "service_role";

grant trigger on table "public"."paciente_tags" to "service_role";

grant truncate on table "public"."paciente_tags" to "service_role";

grant update on table "public"."paciente_tags" to "service_role";

grant delete on table "public"."pacientes" to "anon";

grant insert on table "public"."pacientes" to "anon";

grant references on table "public"."pacientes" to "anon";

grant select on table "public"."pacientes" to "anon";

grant trigger on table "public"."pacientes" to "anon";

grant truncate on table "public"."pacientes" to "anon";

grant update on table "public"."pacientes" to "anon";

grant delete on table "public"."pacientes" to "authenticated";

grant insert on table "public"."pacientes" to "authenticated";

grant references on table "public"."pacientes" to "authenticated";

grant select on table "public"."pacientes" to "authenticated";

grant trigger on table "public"."pacientes" to "authenticated";

grant truncate on table "public"."pacientes" to "authenticated";

grant update on table "public"."pacientes" to "authenticated";

grant delete on table "public"."pacientes" to "service_role";

grant insert on table "public"."pacientes" to "service_role";

grant references on table "public"."pacientes" to "service_role";

grant select on table "public"."pacientes" to "service_role";

grant trigger on table "public"."pacientes" to "service_role";

grant truncate on table "public"."pacientes" to "service_role";

grant update on table "public"."pacientes" to "service_role";

grant delete on table "public"."reuniao_grupos" to "anon";

grant insert on table "public"."reuniao_grupos" to "anon";

grant references on table "public"."reuniao_grupos" to "anon";

grant select on table "public"."reuniao_grupos" to "anon";

grant trigger on table "public"."reuniao_grupos" to "anon";

grant truncate on table "public"."reuniao_grupos" to "anon";

grant update on table "public"."reuniao_grupos" to "anon";

grant delete on table "public"."reuniao_grupos" to "authenticated";

grant insert on table "public"."reuniao_grupos" to "authenticated";

grant references on table "public"."reuniao_grupos" to "authenticated";

grant select on table "public"."reuniao_grupos" to "authenticated";

grant trigger on table "public"."reuniao_grupos" to "authenticated";

grant truncate on table "public"."reuniao_grupos" to "authenticated";

grant update on table "public"."reuniao_grupos" to "authenticated";

grant delete on table "public"."reuniao_grupos" to "service_role";

grant insert on table "public"."reuniao_grupos" to "service_role";

grant references on table "public"."reuniao_grupos" to "service_role";

grant select on table "public"."reuniao_grupos" to "service_role";

grant trigger on table "public"."reuniao_grupos" to "service_role";

grant truncate on table "public"."reuniao_grupos" to "service_role";

grant update on table "public"."reuniao_grupos" to "service_role";

grant delete on table "public"."reuniao_participantes" to "anon";

grant insert on table "public"."reuniao_participantes" to "anon";

grant references on table "public"."reuniao_participantes" to "anon";

grant select on table "public"."reuniao_participantes" to "anon";

grant trigger on table "public"."reuniao_participantes" to "anon";

grant truncate on table "public"."reuniao_participantes" to "anon";

grant update on table "public"."reuniao_participantes" to "anon";

grant delete on table "public"."reuniao_participantes" to "authenticated";

grant insert on table "public"."reuniao_participantes" to "authenticated";

grant references on table "public"."reuniao_participantes" to "authenticated";

grant select on table "public"."reuniao_participantes" to "authenticated";

grant trigger on table "public"."reuniao_participantes" to "authenticated";

grant truncate on table "public"."reuniao_participantes" to "authenticated";

grant update on table "public"."reuniao_participantes" to "authenticated";

grant delete on table "public"."reuniao_participantes" to "service_role";

grant insert on table "public"."reuniao_participantes" to "service_role";

grant references on table "public"."reuniao_participantes" to "service_role";

grant select on table "public"."reuniao_participantes" to "service_role";

grant trigger on table "public"."reuniao_participantes" to "service_role";

grant truncate on table "public"."reuniao_participantes" to "service_role";

grant update on table "public"."reuniao_participantes" to "service_role";

grant delete on table "public"."reunioes" to "anon";

grant insert on table "public"."reunioes" to "anon";

grant references on table "public"."reunioes" to "anon";

grant select on table "public"."reunioes" to "anon";

grant trigger on table "public"."reunioes" to "anon";

grant truncate on table "public"."reunioes" to "anon";

grant update on table "public"."reunioes" to "anon";

grant delete on table "public"."reunioes" to "authenticated";

grant insert on table "public"."reunioes" to "authenticated";

grant references on table "public"."reunioes" to "authenticated";

grant select on table "public"."reunioes" to "authenticated";

grant trigger on table "public"."reunioes" to "authenticated";

grant truncate on table "public"."reunioes" to "authenticated";

grant update on table "public"."reunioes" to "authenticated";

grant delete on table "public"."reunioes" to "service_role";

grant insert on table "public"."reunioes" to "service_role";

grant references on table "public"."reunioes" to "service_role";

grant select on table "public"."reunioes" to "service_role";

grant trigger on table "public"."reunioes" to "service_role";

grant truncate on table "public"."reunioes" to "service_role";

grant update on table "public"."reunioes" to "service_role";

grant delete on table "public"."solicitacoes_acesso" to "anon";

grant insert on table "public"."solicitacoes_acesso" to "anon";

grant references on table "public"."solicitacoes_acesso" to "anon";

grant select on table "public"."solicitacoes_acesso" to "anon";

grant trigger on table "public"."solicitacoes_acesso" to "anon";

grant truncate on table "public"."solicitacoes_acesso" to "anon";

grant update on table "public"."solicitacoes_acesso" to "anon";

grant delete on table "public"."solicitacoes_acesso" to "authenticated";

grant insert on table "public"."solicitacoes_acesso" to "authenticated";

grant references on table "public"."solicitacoes_acesso" to "authenticated";

grant select on table "public"."solicitacoes_acesso" to "authenticated";

grant trigger on table "public"."solicitacoes_acesso" to "authenticated";

grant truncate on table "public"."solicitacoes_acesso" to "authenticated";

grant update on table "public"."solicitacoes_acesso" to "authenticated";

grant delete on table "public"."solicitacoes_acesso" to "service_role";

grant insert on table "public"."solicitacoes_acesso" to "service_role";

grant references on table "public"."solicitacoes_acesso" to "service_role";

grant select on table "public"."solicitacoes_acesso" to "service_role";

grant trigger on table "public"."solicitacoes_acesso" to "service_role";

grant truncate on table "public"."solicitacoes_acesso" to "service_role";

grant update on table "public"."solicitacoes_acesso" to "service_role";

grant delete on table "public"."tags" to "anon";

grant insert on table "public"."tags" to "anon";

grant references on table "public"."tags" to "anon";

grant select on table "public"."tags" to "anon";

grant trigger on table "public"."tags" to "anon";

grant truncate on table "public"."tags" to "anon";

grant update on table "public"."tags" to "anon";

grant delete on table "public"."tags" to "authenticated";

grant insert on table "public"."tags" to "authenticated";

grant references on table "public"."tags" to "authenticated";

grant select on table "public"."tags" to "authenticated";

grant trigger on table "public"."tags" to "authenticated";

grant truncate on table "public"."tags" to "authenticated";

grant update on table "public"."tags" to "authenticated";

grant delete on table "public"."tags" to "service_role";

grant insert on table "public"."tags" to "service_role";

grant references on table "public"."tags" to "service_role";

grant select on table "public"."tags" to "service_role";

grant trigger on table "public"."tags" to "service_role";

grant truncate on table "public"."tags" to "service_role";

grant update on table "public"."tags" to "service_role";

grant delete on table "public"."trocas_supervisao" to "anon";

grant insert on table "public"."trocas_supervisao" to "anon";

grant references on table "public"."trocas_supervisao" to "anon";

grant select on table "public"."trocas_supervisao" to "anon";

grant trigger on table "public"."trocas_supervisao" to "anon";

grant truncate on table "public"."trocas_supervisao" to "anon";

grant update on table "public"."trocas_supervisao" to "anon";

grant delete on table "public"."trocas_supervisao" to "authenticated";

grant insert on table "public"."trocas_supervisao" to "authenticated";

grant references on table "public"."trocas_supervisao" to "authenticated";

grant select on table "public"."trocas_supervisao" to "authenticated";

grant trigger on table "public"."trocas_supervisao" to "authenticated";

grant truncate on table "public"."trocas_supervisao" to "authenticated";

grant update on table "public"."trocas_supervisao" to "authenticated";

grant delete on table "public"."trocas_supervisao" to "service_role";

grant insert on table "public"."trocas_supervisao" to "service_role";

grant references on table "public"."trocas_supervisao" to "service_role";

grant select on table "public"."trocas_supervisao" to "service_role";

grant trigger on table "public"."trocas_supervisao" to "service_role";

grant truncate on table "public"."trocas_supervisao" to "service_role";

grant update on table "public"."trocas_supervisao" to "service_role";

grant delete on table "public"."usuarios" to "anon";

grant insert on table "public"."usuarios" to "anon";

grant references on table "public"."usuarios" to "anon";

grant select on table "public"."usuarios" to "anon";

grant trigger on table "public"."usuarios" to "anon";

grant truncate on table "public"."usuarios" to "anon";

grant update on table "public"."usuarios" to "anon";

grant delete on table "public"."usuarios" to "authenticated";

grant insert on table "public"."usuarios" to "authenticated";

grant references on table "public"."usuarios" to "authenticated";

grant select on table "public"."usuarios" to "authenticated";

grant trigger on table "public"."usuarios" to "authenticated";

grant truncate on table "public"."usuarios" to "authenticated";

grant update on table "public"."usuarios" to "authenticated";

grant delete on table "public"."usuarios" to "service_role";

grant insert on table "public"."usuarios" to "service_role";

grant references on table "public"."usuarios" to "service_role";

grant select on table "public"."usuarios" to "service_role";

grant trigger on table "public"."usuarios" to "service_role";

grant truncate on table "public"."usuarios" to "service_role";

grant update on table "public"."usuarios" to "service_role";


