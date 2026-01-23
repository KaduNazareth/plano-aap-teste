import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTour, PageTourType } from '@/hooks/useTour';
import { useLocation } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function TourButton() {
  const { startTour, tourType } = useTour();
  const location = useLocation();

  if (!tourType) return null;

  // Determine which page tour to start based on current route
  const getPageTourType = (): PageTourType => {
    const path = location.pathname;
    if (path.includes('/programacao') || path.includes('/calendario')) return 'programacao';
    if (path.includes('/registros') || path.includes('/historico')) return 'registros';
    if (path.includes('/relatorios')) return 'relatorios';
    if (path.includes('/evolucao')) return 'evolucao';
    return 'dashboard';
  };

  const getTourLabel = () => {
    const pageTour = getPageTourType();
    switch (pageTour) {
      case 'programacao':
        return 'Tour da Programação';
      case 'registros':
        return 'Tour dos Registros';
      case 'relatorios':
        return 'Tour dos Relatórios';
      case 'evolucao':
        return 'Tour de Evolução';
      default:
        switch (tourType) {
          case 'admin':
            return 'Tour do Administrador';
          case 'gestor':
            return 'Tour do Gestor';
          case 'aap':
            return 'Tour do AAP';
          default:
            return 'Tour Guiado';
        }
    }
  };

  const handleStartTour = () => {
    const pageTour = getPageTourType();
    startTour(pageTour);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleStartTour}
          className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105 transition-all"
          aria-label={getTourLabel()}
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>{getTourLabel()}</p>
      </TooltipContent>
    </Tooltip>
  );
}
