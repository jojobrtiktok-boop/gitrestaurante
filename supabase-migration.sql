-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Criar/atualizar todas as tabelas para o Menu Control
-- Rodar no Supabase Studio → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── Tabelas já existentes — garantir colunas corretas ────────────

-- ingredientes
CREATE TABLE IF NOT EXISTS ingredientes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  unidade TEXT DEFAULT 'kg',
  preco NUMERIC DEFAULT 0,
  quantidade_estoque NUMERIC DEFAULT 0,
  estoque_minimo NUMERIC DEFAULT 0,
  fator_correcao NUMERIC DEFAULT 1,
  perecivel BOOLEAN DEFAULT FALSE,
  percentual_perda NUMERIC DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ingredientes ADD COLUMN IF NOT EXISTS estoque_minimo NUMERIC DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN IF NOT EXISTS fator_correcao NUMERIC DEFAULT 1;
ALTER TABLE ingredientes ADD COLUMN IF NOT EXISTS perecivel BOOLEAN DEFAULT FALSE;
ALTER TABLE ingredientes ADD COLUMN IF NOT EXISTS percentual_perda NUMERIC DEFAULT 0;

-- pratos
CREATE TABLE IF NOT EXISTS pratos (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  preco_venda NUMERIC DEFAULT 0,
  categoria TEXT DEFAULT '',
  em_destaque BOOLEAN DEFAULT FALSE,
  mais_pedido BOOLEAN DEFAULT FALSE,
  foto TEXT,
  ingredientes JSONB DEFAULT '[]',
  grupos JSONB DEFAULT '[]',
  variacoes JSONB DEFAULT '[]',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pratos ADD COLUMN IF NOT EXISTS em_destaque BOOLEAN DEFAULT FALSE;
ALTER TABLE pratos ADD COLUMN IF NOT EXISTS mais_pedido BOOLEAN DEFAULT FALSE;
ALTER TABLE pratos ADD COLUMN IF NOT EXISTS grupos JSONB DEFAULT '[]';
ALTER TABLE pratos ADD COLUMN IF NOT EXISTS variacoes JSONB DEFAULT '[]';

-- compras
CREATE TABLE IF NOT EXISTS compras (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ingrediente_id UUID,
  data DATE NOT NULL,
  quantidade NUMERIC DEFAULT 0,
  preco_unitario NUMERIC DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- despesas
CREATE TABLE IF NOT EXISTS despesas (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  categoria TEXT DEFAULT '',
  valor NUMERIC DEFAULT 0,
  data DATE NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- entradas_vendas
CREATE TABLE IF NOT EXISTS entradas_vendas (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prato_id UUID,
  data DATE NOT NULL,
  hora TEXT DEFAULT '',
  quantidade NUMERIC DEFAULT 0,
  garcon_id UUID,
  extras_unit NUMERIC DEFAULT 0,
  extras_custo_unit NUMERIC DEFAULT 0,
  custo_prato_unit NUMERIC,
  ingredientes_snapshot JSONB,
  preco_venda_unit NUMERIC,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE entradas_vendas ADD COLUMN IF NOT EXISTS extras_unit NUMERIC DEFAULT 0;
ALTER TABLE entradas_vendas ADD COLUMN IF NOT EXISTS extras_custo_unit NUMERIC DEFAULT 0;
ALTER TABLE entradas_vendas ADD COLUMN IF NOT EXISTS custo_prato_unit NUMERIC;
ALTER TABLE entradas_vendas ADD COLUMN IF NOT EXISTS ingredientes_snapshot JSONB;
ALTER TABLE entradas_vendas ADD COLUMN IF NOT EXISTS preco_venda_unit NUMERIC;

-- mesas
CREATE TABLE IF NOT EXISTS mesas (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  capacidade INTEGER DEFAULT 4,
  status TEXT DEFAULT 'livre',
  inicio_sessao TIMESTAMPTZ,
  nome_cliente TEXT
);
ALTER TABLE mesas ADD COLUMN IF NOT EXISTS inicio_sessao TIMESTAMPTZ;
ALTER TABLE mesas ADD COLUMN IF NOT EXISTS nome_cliente TEXT;

-- pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  garcon_id UUID,
  mesa_id UUID,
  cliente_id UUID,
  itens JSONB DEFAULT '[]',
  obs TEXT DEFAULT '',
  data DATE NOT NULL,
  hora TEXT DEFAULT '',
  status TEXT DEFAULT 'novo',
  pago BOOLEAN DEFAULT FALSE,
  cancelado BOOLEAN DEFAULT FALSE,
  timestamps JSONB DEFAULT '{}'
);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cancelado BOOLEAN DEFAULT FALSE;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS timestamps JSONB DEFAULT '{}';
-- Colunas delivery (adicionadas na v2)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS canal TEXT DEFAULT 'local';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS motoboy_id UUID;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_telefone TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_entrega TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS ifood_order_id TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS ifood_short_id TEXT;

-- cardapio_config (armazena config completa como JSONB)
CREATE TABLE IF NOT EXISTS cardapio_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  config JSONB DEFAULT '{}'
);

-- ── Tabelas novas ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS registros_vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prato_id UUID,
  data DATE NOT NULL,
  quantidade NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS garcons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  token TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  aniversario TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS aniversario TEXT;

CREATE TABLE IF NOT EXISTS sessoes_mesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mesa_id UUID,
  mesa_nome TEXT,
  nome_cliente TEXT,
  inicio TIMESTAMPTZ,
  fim TIMESTAMPTZ,
  total NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS kanban_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  config JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS despesas_fixas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  categoria TEXT DEFAULT '',
  valor NUMERIC DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS impostos_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  percentual NUMERIC DEFAULT 0,
  base TEXT DEFAULT 'faturamento',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS config_delivery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT FALSE,
  slug_delivery TEXT UNIQUE,
  municipio_id TEXT DEFAULT '',
  uf TEXT DEFAULT '',
  cidade TEXT DEFAULT '',
  bairros JSONB DEFAULT '[]',
  pedido_minimo NUMERIC DEFAULT 0,
  tempo_estimado TEXT DEFAULT '',
  tipo_entrega TEXT DEFAULT 'Padrão',
  formas_pagamento JSONB DEFAULT '["dinheiro","pix","cartao"]',
  telefone TEXT DEFAULT '',
  mensagem_intro TEXT DEFAULT '',
  modo_ifood BOOLEAN DEFAULT FALSE,
  cor_destaque_ifood TEXT DEFAULT '#ea1d2c'
);

CREATE TABLE IF NOT EXISTS configuracao_geral (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  estoque_minimo_padrao NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS notif_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  push_ativo BOOLEAN DEFAULT FALSE,
  notif_vendas BOOLEAN DEFAULT TRUE,
  notif_insumos BOOLEAN DEFAULT TRUE,
  notif_demora BOOLEAN DEFAULT TRUE,
  demora_minutos INTEGER DEFAULT 20
);

CREATE TABLE IF NOT EXISTS lista_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ingrediente_id UUID,
  nome TEXT NOT NULL,
  unidade TEXT DEFAULT '',
  quantidade NUMERIC DEFAULT 0,
  observacao TEXT DEFAULT '',
  checked BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS caixa_inicial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  valor NUMERIC DEFAULT 0,
  UNIQUE(user_id, data)
);

CREATE TABLE IF NOT EXISTS delivery_slugs (
  slug TEXT PRIMARY KEY,
  user_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS menu_slugs (
  slug TEXT PRIMARY KEY,
  user_id TEXT NOT NULL
);

-- profiles (espelho público do auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE,
  nome_exibicao TEXT,
  foto          TEXT,
  email         TEXT,
  is_admin      BOOLEAN DEFAULT FALSE,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

-- movimentos_caixa (sangrias / suprimentos)
CREATE TABLE IF NOT EXISTS movimentos_caixa (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data      DATE NOT NULL,
  hora      TEXT,
  tipo      TEXT NOT NULL,
  valor     NUMERIC DEFAULT 0,
  descricao TEXT DEFAULT '',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- pagamentos_config (MP, Efí Pay, etc. — armazenado como JSONB)
CREATE TABLE IF NOT EXISTS pagamentos_config (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  config  JSONB DEFAULT '{}'
);

-- Trigger: auto-cria profile quando usuário se cadastra
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

-- Backfill profiles para usuários já existentes
INSERT INTO public.profiles (id, email, username, nome_exibicao)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'nome_exibicao', u.raw_user_meta_data->>'username', split_part(u.email, '@', 1))
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- ── RLS: habilitar em todas ──────────────────────────────────────

ALTER TABLE ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas_fixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE entradas_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE garcons ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardapio_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracao_geral ENABLE ROW LEVEL SECURITY;
ALTER TABLE notif_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE caixa_inicial ENABLE ROW LEVEL SECURITY;
ALTER TABLE impostos_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_slugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_slugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentos_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_config ENABLE ROW LEVEL SECURITY;

-- ── Policies: own_data (cada user vê só seus dados) ─────────────

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ingredientes','pratos','compras','despesas','despesas_fixas',
    'entradas_vendas','registros_vendas','pedidos','mesas','sessoes_mesas',
    'garcons','clientes','cardapio_config','config_delivery','kanban_config',
    'configuracao_geral','notif_config','lista_compras','caixa_inicial','impostos_config',
    'movimentos_caixa','pagamentos_config'
  ] LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS "own_data" ON %I;
      CREATE POLICY "own_data" ON %I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    ', t, t);
  END LOOP;
END $$;

-- profiles: cada usuário vê/edita só o próprio
DROP POLICY IF EXISTS "own_profile" ON profiles;
CREATE POLICY "own_profile" ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- slug tables: leitura pública, escrita autenticada
DROP POLICY IF EXISTS "public_read" ON menu_slugs;
DROP POLICY IF EXISTS "public_read" ON delivery_slugs;
DROP POLICY IF EXISTS "auth_write" ON menu_slugs;
DROP POLICY IF EXISTS "auth_write" ON delivery_slugs;
CREATE POLICY "public_read" ON menu_slugs FOR SELECT USING (true);
CREATE POLICY "public_read" ON delivery_slugs FOR SELECT USING (true);
CREATE POLICY "auth_write" ON menu_slugs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write" ON delivery_slugs FOR ALL USING (auth.role() = 'authenticated');

-- ── Realtime: habilitar para pedidos e mesas ─────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE mesas;

-- ── Motoboys (rastreamento GPS) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS motoboys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT TRUE,
  online BOOLEAN DEFAULT FALSE,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  atualizado_em TIMESTAMPTZ,
  cor TEXT DEFAULT '#f04000'
);
ALTER TABLE motoboys ADD COLUMN IF NOT EXISTS cor TEXT DEFAULT '#f04000';

ALTER TABLE motoboys ENABLE ROW LEVEL SECURITY;

-- Dono vê/edita seus motoboys
DROP POLICY IF EXISTS "own_data" ON motoboys;
CREATE POLICY "own_data" ON motoboys FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Motoboy (sem login) pode ler e atualizar pelo token
DROP POLICY IF EXISTS "motoboy_public_read" ON motoboys;
DROP POLICY IF EXISTS "motoboy_public_update" ON motoboys;
CREATE POLICY "motoboy_public_read" ON motoboys FOR SELECT USING (true);
CREATE POLICY "motoboy_public_update" ON motoboys FOR UPDATE USING (true) WITH CHECK (true);

-- Realtime para o dono ver posição em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE motoboys;

-- ── Realtime adicional ───────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE movimentos_caixa;
