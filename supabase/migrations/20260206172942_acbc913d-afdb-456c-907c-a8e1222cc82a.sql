-- Tabela para mapear usuários do Notion aos usuários do sistema
CREATE TABLE public.notion_sync_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notion_user_id TEXT,
  notion_user_email TEXT NOT NULL,
  system_user_id UUID NOT NULL,
  escola_padrao_id UUID,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_system_user FOREIGN KEY (system_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_escola_padrao FOREIGN KEY (escola_padrao_id) REFERENCES public.escolas(id) ON DELETE SET NULL,
  CONSTRAINT unique_notion_email UNIQUE (notion_user_email)
);

-- Tabela para log de sincronizações
CREATE TABLE public.notion_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notion_page_id TEXT NOT NULL,
  notion_database_id TEXT,
  tabela_destino TEXT NOT NULL,
  registro_id UUID,
  operacao TEXT NOT NULL DEFAULT 'create',
  status TEXT NOT NULL DEFAULT 'sucesso',
  erro_mensagem TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_notion_sync_config_system_user ON public.notion_sync_config(system_user_id);
CREATE INDEX idx_notion_sync_config_notion_email ON public.notion_sync_config(notion_user_email);
CREATE INDEX idx_notion_sync_log_page_id ON public.notion_sync_log(notion_page_id);
CREATE INDEX idx_notion_sync_log_created_at ON public.notion_sync_log(created_at DESC);
CREATE INDEX idx_notion_sync_log_status ON public.notion_sync_log(status);

-- Enable RLS
ALTER TABLE public.notion_sync_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notion_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies para notion_sync_config (apenas admin)
CREATE POLICY "Admins can manage notion_sync_config"
ON public.notion_sync_config
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Gestores can view notion_sync_config"
ON public.notion_sync_config
FOR SELECT
USING (is_gestor(auth.uid()));

-- RLS Policies para notion_sync_log (admin e gestor podem visualizar)
CREATE POLICY "Admins can manage notion_sync_log"
ON public.notion_sync_log
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Gestores can view notion_sync_log"
ON public.notion_sync_log
FOR SELECT
USING (is_gestor(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_notion_sync_config_updated_at
BEFORE UPDATE ON public.notion_sync_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();