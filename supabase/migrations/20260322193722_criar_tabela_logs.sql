CREATE TABLE public.logs_auditoria (
    id_log SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
    acao VARCHAR(50) NOT NULL,
    detalhes TEXT,
    data_hora TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Como é uma tabela de log (auditoria), ninguem deve poder deletar ou alterar!
-- Habilitamos a segurança do Supabase e não damos permissão de DELETE ou UPDATE pra ninguem.
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;
