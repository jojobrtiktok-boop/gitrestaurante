-- ═══════════════════════════════════════════════════════════════
-- SUPPLEMENTAL MIGRATION v2 — Tabelas e colunas faltantes
-- Rodar APÓS o supabase-migration.sql no Supabase Studio → SQL Editor
-- Seguro para rodar mesmo que partes já existam (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. profiles ─────────────────────────────────────────────────────────
-- Tabela de perfil público ligada ao auth.users.
-- Criada/populada automaticamente pelo trigger abaixo.

CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT UNIQUE,
  nome_exibicao TEXT,
  foto         TEXT,
  email        TEXT,
  is_admin     BOOLEAN DEFAULT FALSE,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Cada usuário vê só o próprio perfil
DROP POLICY IF EXISTS "own_profile" ON profiles;
CREATE POLICY "own_profile" ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger: ao cadastrar um novo usuário, cria automaticamente a linha em profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, nome_exibicao)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'nome_exibicao', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: preencher profiles para usuários já existentes (sem profile)
INSERT INTO public.profiles (id, email, username, nome_exibicao)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'nome_exibicao', u.raw_user_meta_data->>'username', split_part(u.email, '@', 1))
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- ── 2. movimentos_caixa ─────────────────────────────────────────────────
-- Sangrias e suprimentos do caixa.

CREATE TABLE IF NOT EXISTS movimentos_caixa (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data        DATE NOT NULL,
  hora        TEXT,
  tipo        TEXT NOT NULL,   -- 'sangria' | 'suprimento'
  valor       NUMERIC DEFAULT 0,
  descricao   TEXT DEFAULT '',
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE movimentos_caixa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_data" ON movimentos_caixa;
CREATE POLICY "own_data" ON movimentos_caixa FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 3. pagamentos_config ────────────────────────────────────────────────
-- Configuração de formas de pagamento (Mercado Pago, Efí Pay, etc.) como JSONB.

CREATE TABLE IF NOT EXISTS pagamentos_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  config      JSONB DEFAULT '{}'
);

ALTER TABLE pagamentos_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_data" ON pagamentos_config;
CREATE POLICY "own_data" ON pagamentos_config FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 4. Colunas faltantes em ingredientes ───────────────────────────────

ALTER TABLE ingredientes ADD COLUMN IF NOT EXISTS perecivel        BOOLEAN DEFAULT FALSE;
ALTER TABLE ingredientes ADD COLUMN IF NOT EXISTS percentual_perda NUMERIC DEFAULT 0;

-- ── 5. Colunas faltantes em clientes ───────────────────────────────────

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefone   TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS aniversario TEXT;

-- ── 6. Realtime para movimentos_caixa (opcional) ───────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE movimentos_caixa;

-- ── 7. saas_config ─────────────────────────────────────────────────────
-- Configurações globais do SaaS: trial links, planos, gateways, suporte.
-- Uma única linha com id = 1 (singleton). Acesso liberado para admins.

CREATE TABLE IF NOT EXISTS saas_config (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  config     JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garante que só existe uma linha
ALTER TABLE saas_config ADD CONSTRAINT saas_config_singleton CHECK (id = 1);

-- RLS: apenas admins (is_admin = true em profiles) podem ler e escrever
ALTER TABLE saas_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_only" ON saas_config;
CREATE POLICY "admin_only" ON saas_config FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Inserir linha inicial se ainda não existir
INSERT INTO saas_config (id, config) VALUES (1, '{}') ON CONFLICT (id) DO NOTHING;

-- ── 8. Colunas faltantes em pratos ─────────────────────────────────────
-- Colunas necessárias para produtos customizáveis (variações, tamanhos, etc.)
-- e campos gerais. Sem elas, o .update() falha silenciosamente.

ALTER TABLE pratos ADD COLUMN IF NOT EXISTS descricao        TEXT DEFAULT '';
ALTER TABLE pratos ADD COLUMN IF NOT EXISTS tipo             TEXT DEFAULT 'normal';
ALTER TABLE pratos ADD COLUMN IF NOT EXISTS meia_a_meia      BOOLEAN DEFAULT FALSE;
ALTER TABLE pratos ADD COLUMN IF NOT EXISTS calc_variacao    TEXT DEFAULT 'maior';
ALTER TABLE pratos ADD COLUMN IF NOT EXISTS max_sabores      INTEGER DEFAULT 1;
ALTER TABLE pratos ADD COLUMN IF NOT EXISTS bordas           JSONB DEFAULT '[]';
ALTER TABLE pratos ADD COLUMN IF NOT EXISTS tamanhos         JSONB DEFAULT '[]';
ALTER TABLE pratos ADD COLUMN IF NOT EXISTS label_sabores    TEXT;
ALTER TABLE pratos ADD COLUMN IF NOT EXISTS label_bordas     TEXT;
ALTER TABLE pratos ADD COLUMN IF NOT EXISTS visivel_individual BOOLEAN DEFAULT TRUE;
ALTER TABLE pratos ADD COLUMN IF NOT EXISTS aparece_cozinha  BOOLEAN DEFAULT TRUE;

-- ── 9. Storage bucket "imagens" ────────────────────────────────────────
-- Bucket público para fotos de pratos, ingredientes, etc.
-- Seguro rodar mesmo que já exista (ON CONFLICT DO NOTHING).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'imagens', 'imagens', true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de acesso ao bucket imagens
DROP POLICY IF EXISTS "imagens_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "imagens_auth_insert"   ON storage.objects;
DROP POLICY IF EXISTS "imagens_auth_update"   ON storage.objects;
DROP POLICY IF EXISTS "imagens_auth_delete"   ON storage.objects;

CREATE POLICY "imagens_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'imagens');

CREATE POLICY "imagens_auth_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'imagens');

CREATE POLICY "imagens_auth_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'imagens');

CREATE POLICY "imagens_auth_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'imagens');

-- ── 10. Trial: colunas plano em profiles + função activate_trial ──────────
-- Sem isso o trial nunca ativa (app chama supabase.rpc('activate_trial')).

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plano_ativo TEXT    DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plano_fim   DATE    DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_slug  TEXT    DEFAULT NULL;

-- Função RPC chamada pelo app no primeiro login após signup via link trial
CREATE OR REPLACE FUNCTION public.activate_trial(
  p_user_id UUID,
  p_dias     INT,
  p_slug     TEXT
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE profiles
  SET
    plano_ativo = 'trial',
    plano_fim   = CURRENT_DATE + p_dias,
    trial_slug  = p_slug
  WHERE id = p_user_id
    AND (plano_ativo IS NULL OR plano_ativo = '')
    AND (plano_fim IS NULL OR plano_fim < CURRENT_DATE);
END;
$$;

-- Permissão: usuários autenticados podem chamar a função (RLS já protege por user_id)
GRANT EXECUTE ON FUNCTION public.activate_trial(UUID, INT, TEXT) TO authenticated;

-- ── 11. integracoes_config ─────────────────────────────────────────────────
-- Armazena credenciais de integrações (99food, Ketta, etc.) por usuário.
-- iFood usa tabela própria (ifood_config). Esta guarda as demais via JSONB.

CREATE TABLE IF NOT EXISTS integracoes_config (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  config   JSONB DEFAULT '{}'
);

ALTER TABLE integracoes_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_data" ON integracoes_config;
CREATE POLICY "own_data" ON integracoes_config FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 12b. Comissão por garçom ───────────────────────────────────────────────────
-- taxa_comissao: percentual de comissão do garçom (ex: 10 = 10%). Zero por padrão.

ALTER TABLE garcons ADD COLUMN IF NOT EXISTS taxa_comissao NUMERIC DEFAULT 0;

-- ── 12. Colunas para pedidos de plataformas (99food, Keeta, etc.) ─────────────
-- plataforma_taxa  : taxa/comissão cobrada pela plataforma no pedido
-- plataforma_pedido_id : ID externo do pedido na plataforma (redundante com ifood_order_id
--                        mas semânticamente correto para plataformas não-iFood)

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS plataforma_taxa      NUMERIC DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS plataforma_pedido_id TEXT;

-- ═══════════════════════════════════════════════════════════════
-- FIM — Verificação rápida (rode para checar se tudo criou certo)
-- ═══════════════════════════════════════════════════════════════
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
