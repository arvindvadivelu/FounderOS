import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { AppShell } from './components/layout/AppShell';
import { OverviewPage } from './pages/OverviewPage';
import { MorningIntelligencePage } from './pages/MorningIntelligencePage';
import { FinancePage } from './pages/FinancePage';
import { CustomersPage } from './pages/CustomersPage';
import { SalesPage } from './pages/SalesPage';
import { ProductPage } from './pages/ProductPage';
import { EngineeringPage } from './pages/EngineeringPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { TasksPage } from './pages/TasksPage';
import { GoalsPage } from './pages/GoalsPage';
import { NotesPage } from './pages/NotesPage';
import { AICopilotPage } from './pages/AICopilotPage';
import { KpiCenterPage } from './pages/KpiCenterPage';
import { DataHealthPage } from './pages/DataHealthPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { EmployeesPage } from './pages/management/EmployeesPage';
import { DepartmentsPage } from './pages/management/DepartmentsPage';
import { CashPage } from './pages/management/CashPage';
import { BalanceSheetPage } from './pages/management/BalanceSheetPage';
import { UploadsPage } from './pages/management/UploadsPage';
import { WorkflowsPage } from './pages/WorkflowsPage';
import { ExecutiveBoardroomPage } from './pages/ExecutiveBoardroomPage';
import { FinancialForecastingPage } from './pages/FinancialForecastingPage';
import { CustomerIntelligencePage } from './pages/CustomerIntelligencePage';
import { ProductIntelligencePage } from './pages/ProductIntelligencePage';
import { AutonomousOperationsPage } from './pages/AutonomousOperationsPage';
import { V2ComingSoonPage } from './pages/V2ComingSoonPage';
import { LandingPage } from './pages/LandingPage';
import { initFreshDatabase } from './db/seed';
import { ToastProvider } from './components/common/Toast';

export function App() {
  const isDesktop = typeof window !== 'undefined' && Boolean((window as any).desktopBridge?.isDesktop);

  // Simple hash/state based client-side routing
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (window.location.hash) {
      return window.location.hash.slice(1);
    }
    return isDesktop ? '/app' : '/';
  });

  // Ensure fresh database initialization without seeding demo company records
  useEffect(() => {
    async function checkFirstRun() {
      await initFreshDatabase();
    }
    checkFirstRun();
  }, []);

  // Listen to hash change
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash ? window.location.hash.slice(1) : '/';
      setCurrentRoute(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (route: string) => {
    window.location.hash = route;
    setCurrentRoute(route);
  };

  const handleDownloadSetup = () => {
    const link = document.createElement('a');
    link.href = '/downloads/FounderOS-Setup.exe';
    link.download = 'FounderOS-Setup.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPortable = () => {
    const link = document.createElement('a');
    link.href = '/downloads/FounderOS-Portable.exe';
    link.download = 'FounderOS-Portable.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderCurrentPage = () => {
    const route = currentRoute.split('?')[0];

    switch (route) {
      case '/':
      case '/app':
      case '/overview':
        return (
          <OverviewPage
            onNavigate={handleNavigate}
            onOpenAiBriefing={() => handleNavigate('/ai?action=briefing')}
            onCreateTask={() => handleNavigate('/tasks')}
          />
        );
      case '/morning-intelligence':
      case '/briefing':
        return (
          <MorningIntelligencePage
            onNavigate={handleNavigate}
            onOpenAiAssistant={() => handleNavigate('/ai?action=briefing')}
          />
        );
      case '/kpis':
        return <KpiCenterPage onNavigate={handleNavigate} />;
      case '/management/employees':
        return <EmployeesPage />;
      case '/management/departments':
        return <DepartmentsPage />;
      case '/management/cash':
        return <CashPage />;
      case '/management/balance-sheet':
        return <BalanceSheetPage />;
      case '/management/uploads':
        return <UploadsPage />;
      case '/finance':
        return <FinancePage />;
      case '/customers':
        return <CustomersPage />;
      case '/sales':
        return <SalesPage />;
      case '/product':
        return <ProductPage />;
      case '/engineering':
        return <EngineeringPage />;
      case '/projects':
        return <ProjectsPage />;
      case '/tasks':
        return <TasksPage />;
      case '/goals':
        return <GoalsPage />;
      case '/notes':
        return <NotesPage />;
      case '/ai':
        return (
          <AICopilotPage
            onNavigateToSettings={() => handleNavigate('/settings?tab=providers')}
            initialAction={currentRoute.includes('action=briefing') ? 'briefing' : undefined}
          />
        );
      case '/health':
        return <DataHealthPage onNavigate={handleNavigate} />;
      case '/integrations':
        return <IntegrationsPage onNavigate={handleNavigate} />;
      case '/v2':
        return <V2ComingSoonPage featureName="FounderOS V2" onNavigate={handleNavigate} />;
      case '/workflows':
        return <V2ComingSoonPage featureName="Automated Workflows" onNavigate={handleNavigate} />;
      case '/boardroom':
        return <V2ComingSoonPage featureName="Executive Boardroom" onNavigate={handleNavigate} />;
      case '/forecasting':
        return <V2ComingSoonPage featureName="Financial Forecasting" onNavigate={handleNavigate} />;
      case '/customer-intelligence':
        return <V2ComingSoonPage featureName="Customer Intelligence" onNavigate={handleNavigate} />;
      case '/product-intelligence':
        return <V2ComingSoonPage featureName="Product Intelligence" onNavigate={handleNavigate} />;
      case '/autopilot':
        return <V2ComingSoonPage featureName="Autonomous Operations" onNavigate={handleNavigate} />;
      case '/settings':
        return <SettingsPage initialTab={currentRoute.includes('tab=providers') ? 'providers' : 'company'} />;
      default:
        return (
          <OverviewPage
            onNavigate={handleNavigate}
            onOpenAiBriefing={() => handleNavigate('/ai?action=briefing')}
            onCreateTask={() => handleNavigate('/tasks')}
          />
        );
    }
  };

  const route = currentRoute.split('?')[0];
  const isLanding = route === '/landing' || (!isDesktop && (route === '/' || route === ''));

  if (isLanding) {
    return (
      <ToastProvider>
        <LandingPage
          onLaunchApp={() => handleNavigate('/app')}
          onDownloadSetup={handleDownloadSetup}
          onDownloadPortable={handleDownloadPortable}
        />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <AppShell
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        onRequestCreateTask={() => handleNavigate('/tasks')}
        onRequestCreateCustomer={() => handleNavigate('/customers')}
        onRequestCreateExpense={() => handleNavigate('/finance')}
      >
        {renderCurrentPage()}
      </AppShell>
    </ToastProvider>
  );
}

export default App;
