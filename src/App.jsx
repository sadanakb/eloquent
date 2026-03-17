import { useState, useCallback } from 'react';
import { EinstellungenModal } from './components/EinstellungenModal.jsx';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { NavBar } from './components/NavBar.jsx';
import { SetupWizard } from './components/SetupWizard.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { PageTransition } from './components/PageTransition.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import { HeroPage } from './pages/HeroPage.jsx';
import { DuellPage } from './pages/DuellPage.jsx';
import { UebungPage } from './pages/UebungPage.jsx';
import { WoerterbuchPage } from './pages/WoerterbuchPage.jsx';
import { RanglistePage } from './pages/RanglistePage.jsx';
import { RegelnPage } from './pages/RegelnPage.jsx';
import { StoryPage } from './pages/StoryPage.jsx';
import { AchievementPage } from './pages/AchievementPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { OnlineDuellPage } from './pages/OnlineDuellPage.jsx';
import './styles.css';

// Map route paths to page IDs for NavBar/BottomNav
const routeToPage = {
  '/': 'home',
  '/duell': 'duell',
  '/uebung': 'uebung',
  '/woerterbuch': 'woerterbuch',
  '/rangliste': 'rangliste',
  '/regeln': 'regeln',
  '/story': 'story',
  '/achievements': 'achievements',
  '/profil': 'profil',
  '/online': 'online',
};

const pageToRoute = Object.fromEntries(
  Object.entries(routeToPage).map(([k, v]) => [v, k])
);

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = routeToPage[location.pathname] || 'home';

  const onNavigate = useCallback((page) => {
    const route = pageToRoute[page] || '/';
    navigate(route);
    window.scrollTo(0, 0);
  }, [navigate]);

  const [setupDone, setSetupDone] = useState(() => localStorage.getItem('eloquent_setup_done') === '1');
  const [showSettings, setShowSettings] = useState(false);

  if (!setupDone) {
    return <SetupWizard onComplete={() => setSetupDone(true)} />;
  }

  return (
    <div className="texture-paper" style={{ minHeight: "100vh", paddingBottom: 72 }}>
      {currentPage !== "home" && <NavBar current={currentPage} onNavigate={onNavigate} />}
      <PageTransition pageKey={currentPage}>
        <Routes>
          <Route path="/" element={<HeroPage onNavigate={onNavigate} />} />
          <Route path="/duell" element={<DuellPage onNavigate={onNavigate} />} />
          <Route path="/uebung" element={<UebungPage onNavigate={onNavigate} />} />
          <Route path="/woerterbuch" element={<WoerterbuchPage onNavigate={onNavigate} />} />
          <Route path="/rangliste" element={<RanglistePage onNavigate={onNavigate} />} />
          <Route path="/regeln" element={<RegelnPage onNavigate={onNavigate} />} />
          <Route path="/story" element={<StoryPage onNavigate={onNavigate} />} />
          <Route path="/achievements" element={<AchievementPage onNavigate={onNavigate} />} />
          <Route path="/profil" element={<ProfilePage onNavigate={onNavigate} />} />
          <Route path="/online" element={<OnlineDuellPage onNavigate={onNavigate} />} />
          <Route path="/duell/:code" element={<OnlineDuellPage onNavigate={onNavigate} />} />
          <Route path="*" element={<HeroPage onNavigate={onNavigate} />} />
        </Routes>
      </PageTransition>
      <BottomNav activePage={currentPage} onNavigate={onNavigate} onOpenSettings={() => setShowSettings(true)} />
      {showSettings && <EinstellungenModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
