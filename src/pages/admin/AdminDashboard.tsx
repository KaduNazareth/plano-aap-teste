import { useState, useEffect } from 'react';
import { 
  School, 
  Users, 
  UserCheck, 
  Calendar,
  Filter,
  Loader2,
  ClipboardCheck,
  Star,
  AlertTriangle
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database } from '@/integrations/supabase/types';

type ProgramaType = Database['public']['Enums']['programa_type'];

const programaLabels: Record<ProgramaType, string> = {
  escolas: 'Programa de Escolas',
  regionais: 'Programa de Regionais de Ensino',
  redes_municipais: 'Programa de Redes Municipais'
};

interface AvaliacaoAula {
  clareza_objetivos: number;
  dominio_conteudo: number;
  estrategias_didaticas: number;
  engajamento_turma: number;
  gestao_tempo: number;
}

interface AAPWithPrograma {
  user_id: string;
  programas: ProgramaType[];
}

interface AvaliacaoWithEscola extends AvaliacaoAula {
  escola_id: string;
}

interface RegistroPendente {
  id: string;
  data: string;
  tipo: string;
  escola_id: string;
  programa: string[] | null;
  status: string;
  dias_atraso: number;
}

export default function AdminDashboard() {
  const [programaFilter, setProgramaFilter] = useState<ProgramaType | 'todos'>('todos');
  const [escolas, setEscolas] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [aaps, setAaps] = useState<AAPWithPrograma[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoWithEscola[]>([]);
  const [registrosPendentes, setRegistrosPendentes] = useState<RegistroPendente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch escolas
      const { data: escolasData } = await supabase
        .from('escolas')
        .select('*')
        .eq('ativa', true);
      
      // Fetch professores
      const { data: professoresData } = await supabase
        .from('professores')
        .select('*')
        .eq('ativo', true);
      
      // Fetch AAPs with their programs
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['aap_inicial', 'aap_portugues', 'aap_matematica']);
      
      // Fetch AAP programs
      const { data: aapProgramasData } = await supabase
        .from('aap_programas')
        .select('aap_user_id, programa');
      
      // Map AAPs with their programs
      const aapsWithProgramas: AAPWithPrograma[] = (rolesData || []).map(role => {
        const programas = (aapProgramasData || [])
          .filter(p => p.aap_user_id === role.user_id)
          .map(p => p.programa as ProgramaType);
        return { user_id: role.user_id, programas };
      });
      
      // Fetch avaliacoes de aula with escola_id
      const { data: avaliacoesData } = await supabase
        .from('avaliacoes_aula')
        .select('clareza_objetivos, dominio_conteudo, estrategias_didaticas, engajamento_turma, gestao_tempo, escola_id');
      
      // Fetch registros pendentes (agendados há mais de 2 dias e não realizados)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
      
      const { data: registrosPendentesData } = await supabase
        .from('registros_acao')
        .select('id, data, tipo, escola_id, programa, status')
        .eq('status', 'agendada')
        .lte('data', twoDaysAgoStr);
      
      // Calculate days overdue for each pending registro
      const today = new Date();
      const pendentesComAtraso: RegistroPendente[] = (registrosPendentesData || []).map(reg => {
        const dataAgendada = new Date(reg.data);
        const diffTime = today.getTime() - dataAgendada.getTime();
        const diasAtraso = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return { ...reg, dias_atraso: diasAtraso };
      });
      
      setEscolas(escolasData || []);
      setProfessores(professoresData || []);
      setAaps(aapsWithProgramas);
      setAvaliacoes(avaliacoesData || []);
      setRegistrosPendentes(pendentesComAtraso);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Filter data based on selected program
  const filteredEscolas = programaFilter === 'todos' 
    ? escolas 
    : escolas.filter(e => e.programa?.includes(programaFilter));
  
  const filteredProfessores = programaFilter === 'todos'
    ? professores
    : professores.filter(p => p.programa?.includes(programaFilter));

  // Filter AAPs based on selected program
  const filteredAAPs = programaFilter === 'todos'
    ? aaps
    : aaps.filter(aap => aap.programas.includes(programaFilter));

  // Get escola IDs for the filtered program to filter avaliacoes
  const filteredEscolaIds = filteredEscolas.map(e => e.id);
  
  // Filter avaliacoes based on escola program
  const filteredAvaliacoes = programaFilter === 'todos'
    ? avaliacoes
    : avaliacoes.filter(av => filteredEscolaIds.includes(av.escola_id));

  // Filter registros pendentes based on selected program
  const filteredRegistrosPendentes = programaFilter === 'todos'
    ? registrosPendentes
    : registrosPendentes.filter(r => r.programa && r.programa.includes(programaFilter));

  // Calculate stats from real data
  const totalEscolas = filteredEscolas.length;
  const totalProfessores = filteredProfessores.length;
  const totalAAPs = filteredAAPs.length;
  const totalAvaliacoes = filteredAvaliacoes.length;
  const totalPendentes = filteredRegistrosPendentes.length;

  // Calculate average ratings for radar chart using filtered avaliacoes
  const calcularMediaDimensao = (dimensao: keyof AvaliacaoAula) => {
    if (filteredAvaliacoes.length === 0) return 0;
    const soma = filteredAvaliacoes.reduce((acc, av) => acc + av[dimensao], 0);
    return Number((soma / filteredAvaliacoes.length).toFixed(2));
  };

  const radarData = [
    { dimensao: 'Clareza', valor: calcularMediaDimensao('clareza_objetivos'), fullMark: 5 },
    { dimensao: 'Domínio', valor: calcularMediaDimensao('dominio_conteudo'), fullMark: 5 },
    { dimensao: 'Didática', valor: calcularMediaDimensao('estrategias_didaticas'), fullMark: 5 },
    { dimensao: 'Engajamento', valor: calcularMediaDimensao('engajamento_turma'), fullMark: 5 },
    { dimensao: 'Tempo', valor: calcularMediaDimensao('gestao_tempo'), fullMark: 5 },
  ];

  // Chart data based on real data
  const segmentoData = [
    { name: 'Anos Iniciais', value: filteredProfessores.filter(p => p.segmento === 'anos_iniciais').length, color: 'hsl(215, 70%, 35%)' },
    { name: 'Anos Finais', value: filteredProfessores.filter(p => p.segmento === 'anos_finais').length, color: 'hsl(160, 60%, 45%)' },
    { name: 'Ensino Médio', value: filteredProfessores.filter(p => p.segmento === 'ensino_medio').length, color: 'hsl(38, 92%, 50%)' },
  ];

  const componenteData = [
    { name: 'Polivalente', value: filteredProfessores.filter(p => p.componente === 'polivalente').length },
    { name: 'Português', value: filteredProfessores.filter(p => p.componente === 'lingua_portuguesa').length },
    { name: 'Matemática', value: filteredProfessores.filter(p => p.componente === 'matematica').length },
  ];

  const cargoData = [
    { name: 'Professores', value: filteredProfessores.filter(p => p.cargo === 'professor').length },
    { name: 'Coordenadores', value: filteredProfessores.filter(p => p.cargo === 'coordenador').length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Dashboard</h1>
          <p className="page-subtitle">
            {programaFilter === 'todos' 
              ? 'Visão geral de todos os programas' 
              : `Visão do ${programaLabels[programaFilter]}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-muted-foreground" />
          <Select value={programaFilter} onValueChange={(value) => setProgramaFilter(value as ProgramaType | 'todos')}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Filtrar por programa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Programas</SelectItem>
              <SelectItem value="escolas">Programa de Escolas</SelectItem>
              <SelectItem value="regionais">Programa de Regionais de Ensino</SelectItem>
              <SelectItem value="redes_municipais">Programa de Redes Municipais</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Escolas"
          value={totalEscolas}
          icon={<School size={24} />}
          variant="primary"
        />
        <StatCard
          title="Professores"
          value={totalProfessores}
          icon={<Users size={24} />}
        />
        <StatCard
          title="AAPs / Formadores"
          value={totalAAPs}
          icon={<UserCheck size={24} />}
        />
        <StatCard
          title="Coordenadores"
          value={filteredProfessores.filter(p => p.cargo === 'coordenador').length}
          icon={<Calendar size={24} />}
          variant="accent"
        />
        <StatCard
          title="Avaliações de Aula"
          value={totalAvaliacoes}
          icon={<ClipboardCheck size={24} />}
          variant="primary"
        />
        <StatCard
          title="Ações Pendentes"
          value={totalPendentes}
          icon={<AlertTriangle size={24} />}
          variant={totalPendentes > 0 ? "destructive" : "default"}
        />
      </div>

      {/* Pending Actions Alert */}
      {totalPendentes > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-destructive/20 rounded-lg">
              <AlertTriangle className="text-destructive" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-destructive mb-2">
                {totalPendentes} {totalPendentes === 1 ? 'ação pendente' : 'ações pendentes'} há mais de 2 dias
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                As seguintes ações estão agendadas há mais de 2 dias e ainda não foram atualizadas:
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredRegistrosPendentes.slice(0, 10).map((reg) => {
                  const escola = escolas.find(e => e.id === reg.escola_id);
                  return (
                    <div 
                      key={reg.id} 
                      className="flex items-center justify-between bg-background/50 rounded-lg p-3 text-sm"
                    >
                      <div>
                        <span className="font-medium">{reg.tipo}</span>
                        <span className="text-muted-foreground"> em </span>
                        <span className="font-medium">{escola?.nome || 'Escola não encontrada'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {new Date(reg.data).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="px-2 py-1 bg-destructive/20 text-destructive text-xs font-medium rounded">
                          {reg.dias_atraso} {reg.dias_atraso === 1 ? 'dia' : 'dias'} de atraso
                        </span>
                      </div>
                    </div>
                  );
                })}
                {totalPendentes > 10 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    ... e mais {totalPendentes - 10} {totalPendentes - 10 === 1 ? 'ação pendente' : 'ações pendentes'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalEscolas === 0 && totalProfessores === 0 && (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <School size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhum dado cadastrado</h3>
          <p className="text-muted-foreground">
            Comece cadastrando escolas e professores para visualizar os dados no dashboard.
          </p>
        </div>
      )}

      {/* Avaliacoes de Aula Chart */}
      {totalAvaliacoes > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="card-title mb-6 flex items-center gap-2">
            <Star className="text-warning" size={20} />
            Média das Avaliações de Acompanhamento de Aula
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="dimensao" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Radar 
                name="Média" 
                dataKey="valor" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.5} 
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [value.toFixed(2), 'Média']}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm text-muted-foreground">
            {radarData.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-medium">{d.dimensao}:</span>
                <span className="text-foreground">{d.valor.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Distribution Charts */}
      {(totalEscolas > 0 || totalProfessores > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Segmentos */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="card-title mb-6">Professores por Segmento</h3>
            {totalProfessores > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={segmentoData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {segmentoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Cadastre professores para visualizar
              </div>
            )}
          </div>

          {/* Bar Chart - Componentes */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="card-title mb-6">Professores por Componente</h3>
            {totalProfessores > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={componenteData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={90} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" name="Quantidade" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Cadastre professores para visualizar
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cargo Distribution */}
      {totalProfessores > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="card-title mb-6">Distribuição por Cargo</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cargoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" name="Quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Escolas por Programa */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="card-title mb-6">Escolas por Programa</h3>
            <div className="space-y-4">
              {(['escolas', 'regionais', 'redes_municipais'] as ProgramaType[]).map(prog => {
                const count = escolas.filter(e => e.programa?.includes(prog)).length;
                const percentage = totalEscolas > 0 ? (count / escolas.length) * 100 : 0;
                return (
                  <div key={prog} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{programaLabels[prog]}</span>
                      <span className="font-medium">{count} escolas</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
