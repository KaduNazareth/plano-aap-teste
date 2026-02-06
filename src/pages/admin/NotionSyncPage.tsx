import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, RefreshCw, Search, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotionSyncConfig {
  id: string;
  notion_user_email: string;
  notion_user_id: string | null;
  system_user_id: string;
  escola_padrao_id: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  profiles?: { nome: string; email: string } | null;
  escolas?: { nome: string } | null;
}

interface NotionSyncLog {
  id: string;
  notion_page_id: string;
  notion_database_id: string | null;
  tabela_destino: string;
  registro_id: string | null;
  operacao: string;
  status: string;
  erro_mensagem: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  nome: string;
  email: string;
}

interface Escola {
  id: string;
  nome: string;
}

export default function NotionSyncPage() {
  const { isAdmin } = useAuth();
  const [configs, setConfigs] = useState<NotionSyncConfig[]>([]);
  const [logs, setLogs] = useState<NotionSyncLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<NotionSyncConfig | null>(null);
  const [formData, setFormData] = useState({
    notion_user_email: '',
    system_user_id: '',
    escola_padrao_id: '',
    ativo: true,
  });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingConfig, setDeletingConfig] = useState<NotionSyncConfig | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configsRes, logsRes, profilesRes, escolasRes] = await Promise.all([
        supabase
          .from('notion_sync_config')
          .select(`
            *,
            profiles:system_user_id(nome, email),
            escolas:escola_padrao_id(nome)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('notion_sync_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('profiles')
          .select('id, nome, email')
          .order('nome'),
        supabase
          .from('escolas')
          .select('id, nome')
          .eq('ativa', true)
          .order('nome'),
      ]);

      if (configsRes.error) throw configsRes.error;
      if (logsRes.error) throw logsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (escolasRes.error) throw escolasRes.error;

      setConfigs(configsRes.data || []);
      setLogs(logsRes.data || []);
      setProfiles(profilesRes.data || []);
      setEscolas(escolasRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('notion-sync');
      
      if (error) throw error;
      
      toast.success(`Sincronização concluída: ${data?.processed || 0} tarefas processadas`);
      loadData(); // Reload to show new logs
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro ao sincronizar com Notion');
    } finally {
      setSyncing(false);
    }
  };

  const openCreateDialog = () => {
    setEditingConfig(null);
    setFormData({
      notion_user_email: '',
      system_user_id: '',
      escola_padrao_id: '',
      ativo: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (config: NotionSyncConfig) => {
    setEditingConfig(config);
    setFormData({
      notion_user_email: config.notion_user_email,
      system_user_id: config.system_user_id,
      escola_padrao_id: config.escola_padrao_id || '',
      ativo: config.ativo,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.notion_user_email || !formData.system_user_id || !formData.escola_padrao_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      if (editingConfig) {
        // Update
        const { error } = await supabase
          .from('notion_sync_config')
          .update({
            notion_user_email: formData.notion_user_email,
            system_user_id: formData.system_user_id,
            escola_padrao_id: formData.escola_padrao_id,
            ativo: formData.ativo,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingConfig.id);

        if (error) throw error;
        toast.success('Mapeamento atualizado com sucesso');
      } else {
        // Create
        const { error } = await supabase
          .from('notion_sync_config')
          .insert({
            notion_user_email: formData.notion_user_email,
            system_user_id: formData.system_user_id,
            escola_padrao_id: formData.escola_padrao_id,
            ativo: formData.ativo,
          });

        if (error) {
          if (error.code === '23505') {
            toast.error('Este email do Notion já está cadastrado');
            return;
          }
          throw error;
        }
        toast.success('Mapeamento criado com sucesso');
      }

      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar mapeamento');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingConfig) return;

    try {
      const { error } = await supabase
        .from('notion_sync_config')
        .delete()
        .eq('id', deletingConfig.id);

      if (error) throw error;
      
      toast.success('Mapeamento excluído com sucesso');
      setDeleteDialogOpen(false);
      setDeletingConfig(null);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir mapeamento');
    }
  };

  const filteredConfigs = configs.filter(config =>
    config.notion_user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.profiles?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.escolas?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sucesso':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'erro':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'ignorado':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sucesso':
        return <Badge variant="default" className="bg-success">Sucesso</Badge>;
      case 'erro':
        return <Badge variant="destructive">Erro</Badge>;
      case 'ignorado':
        return <Badge variant="secondary">Ignorado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integração Notion</h1>
          <p className="text-muted-foreground">
            Configure o mapeamento entre usuários do Notion e do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sincronizar Agora
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Mapeamento
          </Button>
        </div>
      </div>

      {/* Config Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mapeamentos Configurados</CardTitle>
          <CardDescription>
            Vincule emails do Notion a usuários e escolas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, usuário ou escola..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredConfigs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum mapeamento encontrado.' : 'Nenhum mapeamento configurado. Clique em "Novo Mapeamento" para começar.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Email Notion</TableHead>
                    <TableHead>Usuário Sistema</TableHead>
                    <TableHead>Escola Padrão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>
                        <Badge variant={config.ativo ? 'default' : 'secondary'}>
                          {config.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {config.notion_user_email}
                      </TableCell>
                      <TableCell>
                        {config.profiles?.nome || '-'}
                      </TableCell>
                      <TableCell>
                        {config.escolas?.nome || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(config)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingConfig(config);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Sincronizações</CardTitle>
          <CardDescription>
            Histórico das últimas 20 operações de sincronização
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma sincronização realizada ainda.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Operação</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          {getStatusBadge(log.status)}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {log.operacao}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.tabela_destino}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {log.erro_mensagem || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Editar Mapeamento' : 'Novo Mapeamento'}
            </DialogTitle>
            <DialogDescription>
              Configure a correspondência entre um usuário do Notion e do sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notion_email">Email do Notion *</Label>
              <Input
                id="notion_email"
                type="email"
                placeholder="usuario@email.com"
                value={formData.notion_user_email}
                onChange={(e) => setFormData({ ...formData, notion_user_email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="system_user">Usuário do Sistema *</Label>
              <Select
                value={formData.system_user_id}
                onValueChange={(value) => setFormData({ ...formData, system_user_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.nome} ({profile.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="escola_padrao">Escola Padrão *</Label>
              <Select
                value={formData.escola_padrao_id}
                onValueChange={(value) => setFormData({ ...formData, escola_padrao_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma escola" />
                </SelectTrigger>
                <SelectContent>
                  {escolas.map((escola) => (
                    <SelectItem key={escola.id} value={escola.id}>
                      {escola.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Ativo</Label>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o mapeamento para "{deletingConfig?.notion_user_email}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
