import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegistroAvaliacaoAula {
  id: string;
  data: string;
  clareza_objetivos: number;
  dominio_conteudo: number;
  estrategias_didaticas: number;
  engajamento_turma: number;
  gestao_tempo: number;
}

interface EvolucaoMatrixProps {
  avaliacoes: RegistroAvaliacaoAula[];
  dimensoesLabels: Record<string, string>;
}

const dimensoesKeys = [
  'clareza_objetivos',
  'dominio_conteudo',
  'estrategias_didaticas',
  'engajamento_turma',
  'gestao_tempo',
] as const;

const getColorClass = (value: number) => {
  if (value >= 4.5) return 'bg-success/90 text-success-foreground';
  if (value >= 3.5) return 'bg-success/60 text-foreground';
  if (value >= 2.5) return 'bg-warning/60 text-foreground';
  if (value >= 1.5) return 'bg-warning/90 text-foreground';
  return 'bg-destructive/60 text-destructive-foreground';
};

const getTrendIcon = (current: number, previous: number | undefined) => {
  if (previous === undefined) return null;
  const diff = current - previous;
  if (diff > 0) return <TrendingUp className="w-3 h-3 text-success inline ml-1" />;
  if (diff < 0) return <TrendingDown className="w-3 h-3 text-destructive inline ml-1" />;
  return <Minus className="w-3 h-3 text-muted-foreground inline ml-1" />;
};

export function EvolucaoMatrix({ avaliacoes, dimensoesLabels }: EvolucaoMatrixProps) {
  if (avaliacoes.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Evolução por Dimensão</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground min-w-[180px] sticky left-0 bg-card z-10">
                  Dimensão
                </th>
                {avaliacoes.map((avaliacao, idx) => (
                  <th 
                    key={avaliacao.id} 
                    className="text-center py-3 px-3 font-medium text-muted-foreground min-w-[80px]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs">{formatDate(avaliacao.data)}</span>
                      <span className="text-xs text-muted-foreground/70">#{idx + 1}</span>
                    </div>
                  </th>
                ))}
                <th className="text-center py-3 px-3 font-medium min-w-[80px] bg-muted/50">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs">Média</span>
                    <span className="text-xs text-muted-foreground/70">Geral</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {dimensoesKeys.map((dimensao) => {
                const values = avaliacoes.map(a => a[dimensao]);
                const media = values.reduce((sum, v) => sum + v, 0) / values.length;
                
                return (
                  <tr key={dimensao} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium sticky left-0 bg-card z-10">
                      {dimensoesLabels[dimensao]}
                    </td>
                    {avaliacoes.map((avaliacao, idx) => {
                      const value = avaliacao[dimensao];
                      const previousValue = idx > 0 ? avaliacoes[idx - 1][dimensao] : undefined;
                      
                      return (
                        <td key={avaliacao.id} className="text-center py-3 px-2">
                          <div className="flex items-center justify-center gap-1">
                            <span className={cn(
                              "inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-base",
                              getColorClass(value)
                            )}>
                              {value}
                            </span>
                            {getTrendIcon(value, previousValue)}
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-center py-3 px-2 bg-muted/50">
                      <span className={cn(
                        "inline-flex items-center justify-center w-12 h-10 rounded-lg font-bold text-base",
                        getColorClass(media)
                      )}>
                        {media.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/30">
                <td className="py-3 px-4 font-semibold sticky left-0 bg-muted/30 z-10">
                  Média da Visita
                </td>
                {avaliacoes.map((avaliacao, idx) => {
                  const visitaMedia = dimensoesKeys.reduce((sum, key) => sum + avaliacao[key], 0) / dimensoesKeys.length;
                  const previousAvg = idx > 0 
                    ? dimensoesKeys.reduce((sum, key) => sum + avaliacoes[idx - 1][key], 0) / dimensoesKeys.length
                    : undefined;
                  
                  return (
                    <td key={avaliacao.id} className="text-center py-3 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <span className={cn(
                          "inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-base",
                          getColorClass(visitaMedia)
                        )}>
                          {visitaMedia.toFixed(1)}
                        </span>
                        {getTrendIcon(visitaMedia, previousAvg)}
                      </div>
                    </td>
                  );
                })}
                <td className="text-center py-3 px-2 bg-muted/50">
                  {(() => {
                    const overallMedia = avaliacoes.reduce((sum, a) => 
                      sum + dimensoesKeys.reduce((s, key) => s + a[key], 0) / dimensoesKeys.length
                    , 0) / avaliacoes.length;
                    return (
                      <span className={cn(
                        "inline-flex items-center justify-center w-12 h-10 rounded-lg font-bold text-base",
                        getColorClass(overallMedia)
                      )}>
                        {overallMedia.toFixed(1)}
                      </span>
                    );
                  })()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="font-medium">Legenda:</span>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-success/90" />
            <span>5 - Excelente</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-success/60" />
            <span>4 - Bom</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-warning/60" />
            <span>3 - Adequado</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-warning/90" />
            <span>2 - Insatisfatório</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-destructive/60" />
            <span>1 - Muito Insatisfatório</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
