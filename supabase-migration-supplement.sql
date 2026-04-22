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

-- ═══════════════════════════════════════════════════════════════
-- FIM — Verificação rápida (rode para checar se tudo criou certo)
-- ═══════════════════════════════════════════════════════════════
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
