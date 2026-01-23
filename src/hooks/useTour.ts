import { useState, useCallback, useEffect, useRef } from 'react';
import { driver, DriveStep, Config } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '@/contexts/AuthContext';

export type TourType = 'admin' | 'gestor' | 'aap';

interface TourConfig {
  steps: DriveStep[];
  title: string;
}

// Passos do tour para Admin
const adminSteps: DriveStep[] = [
  {
    element: '[data-tour="sidebar-menu"]',
    popover: {
      title: '📋 Menu Principal',
      description: 'Este é o seu menu de navegação. Acesse todas as funcionalidades do sistema.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="user-profile"]',
    popover: {
      title: '👤 Seu Perfil',
      description: 'Clique aqui para acessar suas informações e alterar sua senha.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="stat-escolas"]',
    popover: {
      title: '🏫 Escolas / Regionais / Redes',
      description: 'Visualize o total de escolas cadastradas. Clique para gerenciar.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="stat-professores"]',
    popover: {
      title: '👩‍🏫 Professores / Coordenadores',
      description: 'Acompanhe o número de professores cadastrados no sistema.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="pending-alerts"]',
    popover: {
      title: '⚠️ Ações Pendentes',
      description: 'Ações pendentes há mais de 2 dias aparecem aqui.',
      side: 'top',
      align: 'start'
    }
  }
];

// Passos do tour para Gestor
const gestorSteps: DriveStep[] = [
  {
    element: '[data-tour="sidebar-menu"]',
    popover: {
      title: '📋 Menu Principal',
      description: 'Navegue pelas funcionalidades do sistema.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="user-profile"]',
    popover: {
      title: '👤 Seu Perfil',
      description: 'Acesse suas informações e altere sua senha.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="stat-escolas"]',
    popover: {
      title: '🏫 Suas Escolas',
      description: 'Veja as escolas vinculadas aos seus programas.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="pending-alerts"]',
    popover: {
      title: '⚠️ Ações Pendentes',
      description: 'Monitore as ações que precisam de acompanhamento.',
      side: 'top',
      align: 'start'
    }
  }
];

// Passos do tour para AAP
const aapSteps: DriveStep[] = [
  {
    element: '[data-tour="sidebar-menu"]',
    popover: {
      title: '📋 Seu Menu',
      description: 'Este é o seu painel de navegação.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="user-profile"]',
    popover: {
      title: '👤 Seu Perfil',
      description: 'Acesse seu perfil para ver suas informações.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="stat-escolas"]',
    popover: {
      title: '🏫 Suas Escolas',
      description: 'Veja as escolas sob sua responsabilidade.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="stat-pendentes"]',
    popover: {
      title: '⏳ Pendentes',
      description: 'Monitore suas ações pendentes.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="quick-actions"]',
    popover: {
      title: '⚡ Ações Rápidas',
      description: 'Use os botões para registrar novas ações.',
      side: 'top',
      align: 'center'
    }
  }
];

const tourConfigs: Record<TourType, TourConfig> = {
  admin: { steps: adminSteps, title: 'Tour do Administrador' },
  gestor: { steps: gestorSteps, title: 'Tour do Gestor' },
  aap: { steps: aapSteps, title: 'Tour do AAP / Formador' }
};

const TOUR_STORAGE_KEY = 'tour_completed';

export function useTour() {
  const { profile, isAdmin, isGestor, isAAP } = useAuth();
  const [isTourActive, setIsTourActive] = useState(false);
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  const tourType: TourType | null = isAdmin ? 'admin' : isGestor ? 'gestor' : isAAP ? 'aap' : null;

  const hasCompletedTour = useCallback((): boolean => {
    if (!tourType || !profile?.id) return true;
    const key = `${TOUR_STORAGE_KEY}_${profile.id}_${tourType}`;
    return localStorage.getItem(key) === 'true';
  }, [tourType, profile?.id]);

  const markTourAsCompleted = useCallback(() => {
    if (tourType && profile?.id) {
      const key = `${TOUR_STORAGE_KEY}_${profile.id}_${tourType}`;
      localStorage.setItem(key, 'true');
    }
  }, [tourType, profile?.id]);

  const resetTour = useCallback(() => {
    if (tourType && profile?.id) {
      localStorage.removeItem(`${TOUR_STORAGE_KEY}_${profile.id}_${tourType}`);
    }
  }, [tourType, profile?.id]);

  const cleanupDom = useCallback(() => {
    if (driverRef.current) return;
    document.querySelectorAll('.driver-overlay, .driver-popover').forEach(node => {
      try { node.remove(); } catch { /* ignore */ }
    });
    document.body.classList.remove('driver-active');
  }, []);

  const startTour = useCallback(() => {
    if (!tourType) return;

    // Cleanup any existing tour
    if (driverRef.current) {
      try { driverRef.current.destroy(); } catch { /* ignore */ }
      driverRef.current = null;
    }
    cleanupDom();

    const config = tourConfigs[tourType];
    
    // Filter steps to only include existing elements
    const availableSteps = config.steps.filter(step => {
      if (!step.element) return true;
      return document.querySelector(step.element as string);
    });

    if (availableSteps.length === 0) {
      console.warn('No tour elements found');
      return;
    }

    const driverConfig: Config = {
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      doneBtnText: 'Concluir',
      progressText: '{{current}} de {{total}}',
      steps: availableSteps,
      allowClose: true,
      stagePadding: 10,
      stageRadius: 8,
      onDestroyStarted: () => {
        markTourAsCompleted();
      },
      onDestroyed: () => {
        setIsTourActive(false);
        driverRef.current = null;
      },
      popoverClass: 'tour-popover',
    };

    const instance = driver(driverConfig);
    driverRef.current = instance;
    setIsTourActive(true);
    
    requestAnimationFrame(() => {
      instance.drive();
    });
  }, [tourType, markTourAsCompleted, cleanupDom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        try { driverRef.current.destroy(); } catch { /* ignore */ }
        driverRef.current = null;
      }
      cleanupDom();
    };
  }, [cleanupDom]);

  return {
    startTour,
    hasCompletedTour,
    resetTour,
    isTourActive,
    tourType
  };
}
