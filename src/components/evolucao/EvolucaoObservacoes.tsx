import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegistroAvaliacaoAula {
  id: string;
  data: string;
  aap_nome: string;
  observacoes: string | null;
}

interface EvolucaoObservacoesProps {
  avaliacoes: RegistroAvaliacaoAula[];
}

const ITEMS_PER_PAGE = 5;

export function EvolucaoObservacoes({ avaliacoes }: EvolucaoObservacoesProps) {
  const [showAll, setShowAll] = useState(false);
  
  const observacoesComTexto = avaliacoes.filter(a => a.observacoes && a.observacoes.trim().length > 0);
  
  if (observacoesComTexto.length === 0) {
    return null;
  }
  
  const displayedItems = showAll 
    ? observacoesComTexto 
    : observacoesComTexto.slice(0, ITEMS_PER_PAGE);
  
  const hasMore = observacoesComTexto.length > ITEMS_PER_PAGE;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="w-5 h-5 text-primary" />
          Observações
          <span className="text-sm font-normal text-muted-foreground">
            ({observacoesComTexto.length} {observacoesComTexto.length === 1 ? 'registro' : 'registros'})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedItems.map((avaliacao, index) => (
          <div 
            key={avaliacao.id}
            className={cn(
              "border rounded-lg p-4 bg-muted/20 hover:bg-muted/40 transition-colors",
              index !== displayedItems.length - 1 && "mb-4"
            )}
          >
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{formatDate(avaliacao.data)}</span>
              {avaliacao.aap_nome && (
                <>
                  <span>•</span>
                  <span>{avaliacao.aap_nome}</span>
                </>
              )}
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {avaliacao.observacoes}
            </p>
          </div>
        ))}
        
        {hasMore && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Ver menos
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Ver mais ({observacoesComTexto.length - ITEMS_PER_PAGE} restantes)
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
