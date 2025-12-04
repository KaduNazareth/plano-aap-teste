import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { programacoes, escolas, professores, aaps, segmentoLabels, componenteLabels } from '@/data/mockData';
import { Programacao, Professor } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Check, 
  X, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface PresencaItem {
  professorId: string;
  presente: boolean;
}

export default function AAPRegistrarAcaoPage() {
  const { user } = useAuth();
  const [selectedProgramacao, setSelectedProgramacao] = useState<Programacao | null>(null);
  const [presencaList, setPresencaList] = useState<PresencaItem[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [avancos, setAvancos] = useState('');
  const [dificuldades, setDificuldades] = useState('');
  const [turma, setTurma] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current AAP based on logged user
  const currentAAP = useMemo(() => {
    return aaps.find(aap => aap.userId === user?.id);
  }, [user]);

  // Get pending programações for current AAP
  const pendingProgramacoes = useMemo(() => {
    if (!currentAAP) return [];
    return programacoes.filter(p => 
      p.aapId === currentAAP.id && 
      p.status === 'prevista'
    ).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [currentAAP]);

  // Get professors for selected escola and segmento
  const availableProfessors = useMemo(() => {
    if (!selectedProgramacao) return [];
    return professores.filter(p => 
      p.escolaId === selectedProgramacao.escolaId &&
      p.segmento === selectedProgramacao.segmento
    );
  }, [selectedProgramacao]);

  const handleSelectProgramacao = (prog: Programacao) => {
    setSelectedProgramacao(prog);
    // Initialize presence list with all professors as absent
    const profs = professores.filter(p => 
      p.escolaId === prog.escolaId &&
      p.segmento === prog.segmento
    );
    setPresencaList(profs.map(p => ({ professorId: p.id, presente: false })));
    setObservacoes('');
    setAvancos('');
    setDificuldades('');
    setTurma('');
  };

  const handleTogglePresenca = (professorId: string) => {
    setPresencaList(prev => 
      prev.map(item => 
        item.professorId === professorId 
          ? { ...item, presente: !item.presente }
          : item
      )
    );
  };

  const handleMarcarTodos = (presente: boolean) => {
    setPresencaList(prev => prev.map(item => ({ ...item, presente })));
  };

  const handleSubmit = async () => {
    if (!selectedProgramacao) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const presentes = presencaList.filter(p => p.presente).length;
    const total = presencaList.length;
    
    toast.success('Registro salvo com sucesso!', {
      description: `${presentes} de ${total} professores presentes`
    });
    
    setSelectedProgramacao(null);
    setPresencaList([]);
    setIsSubmitting(false);
  };

  const getEscolaNome = (escolaId: string) => {
    return escolas.find(e => e.id === escolaId)?.nome || '-';
  };

  const presentes = presencaList.filter(p => p.presente).length;
  const totalProfessores = presencaList.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-header">Registrar Ação</h1>
        <p className="page-subtitle">Selecione uma programação e registre a presença dos professores</p>
      </div>

      {/* Pending Programações */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="text-primary" size={20} />
          Programações Pendentes
        </h2>

        {pendingProgramacoes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 size={48} className="mx-auto mb-3 text-success" />
            <p>Nenhuma programação pendente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingProgramacoes.map(prog => (
              <button
                key={prog.id}
                onClick={() => handleSelectProgramacao(prog)}
                className={`w-full p-4 rounded-xl border transition-all text-left hover:border-primary hover:bg-primary/5 ${
                  selectedProgramacao?.id === prog.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge variant={prog.tipo === 'formacao' ? 'primary' : 'info'}>
                        {prog.tipo === 'formacao' ? 'Formação' : 'Visita'}
                      </StatusBadge>
                      <span className="text-sm text-muted-foreground">
                        {segmentoLabels[prog.segmento]}
                      </span>
                    </div>
                    <h3 className="font-medium truncate">{prog.titulo}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {format(new Date(prog.data), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {prog.horarioInicio} - {prog.horarioFim}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {getEscolaNome(prog.escolaId)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-muted-foreground flex-shrink-0 mt-2" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <Dialog open={!!selectedProgramacao} onOpenChange={() => setSelectedProgramacao(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Ação</DialogTitle>
          </DialogHeader>

          {selectedProgramacao && (
            <div className="space-y-6 mt-4">
              {/* Action Info */}
              <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <StatusBadge variant={selectedProgramacao.tipo === 'formacao' ? 'primary' : 'info'}>
                    {selectedProgramacao.tipo === 'formacao' ? 'Formação' : 'Visita'}
                  </StatusBadge>
                  <span className="font-medium">{selectedProgramacao.titulo}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{format(new Date(selectedProgramacao.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                  <span>•</span>
                  <span>{getEscolaNome(selectedProgramacao.escolaId)}</span>
                  <span>•</span>
                  <span>{segmentoLabels[selectedProgramacao.segmento]} - {selectedProgramacao.anoSerie}</span>
                </div>
              </div>

              {/* Turma */}
              <div>
                <label className="block text-sm font-medium mb-2">Turma (opcional)</label>
                <input
                  type="text"
                  value={turma}
                  onChange={(e) => setTurma(e.target.value)}
                  placeholder="Ex: Turma A"
                  className="input-field"
                />
              </div>

              {/* Presence List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users size={18} className="text-primary" />
                    Lista de Presença
                    <span className="text-sm font-normal text-muted-foreground">
                      ({presentes}/{totalProfessores})
                    </span>
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarcarTodos(true)}
                    >
                      <Check size={14} className="mr-1" />
                      Todos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarcarTodos(false)}
                    >
                      <X size={14} className="mr-1" />
                      Nenhum
                    </Button>
                  </div>
                </div>

                {availableProfessors.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border border-dashed border-border rounded-lg">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhum professor encontrado para este segmento</p>
                  </div>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden">
                    {availableProfessors.map((professor, index) => {
                      const presencaItem = presencaList.find(p => p.professorId === professor.id);
                      const isPresente = presencaItem?.presente || false;
                      
                      return (
                        <div 
                          key={professor.id}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                            index < availableProfessors.length - 1 ? 'border-b border-border' : ''
                          } ${isPresente ? 'bg-success/5' : ''}`}
                          onClick={() => handleTogglePresenca(professor.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={isPresente}
                              onCheckedChange={() => handleTogglePresenca(professor.id)}
                            />
                            <div>
                              <p className="text-sm font-medium">{professor.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {componenteLabels[professor.componente]} • {professor.anoSerie}
                              </p>
                            </div>
                          </div>
                          <StatusBadge variant={isPresente ? 'success' : 'default'} size="sm">
                            {isPresente ? 'Presente' : 'Ausente'}
                          </StatusBadge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Observations */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-muted-foreground" />
                  Observações
                </label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Descreva como foi a ação, pontos relevantes..."
                  rows={3}
                />
              </div>

              {/* Advances */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <TrendingUp size={16} className="text-success" />
                  Avanços Observados
                </label>
                <Textarea
                  value={avancos}
                  onChange={(e) => setAvancos(e.target.value)}
                  placeholder="Quais avanços foram observados..."
                  rows={2}
                />
              </div>

              {/* Difficulties */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertCircle size={16} className="text-warning" />
                  Dificuldades Encontradas
                </label>
                <Textarea
                  value={dificuldades}
                  onChange={(e) => setDificuldades(e.target.value)}
                  placeholder="Quais dificuldades foram encontradas..."
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedProgramacao(null)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Registro'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
