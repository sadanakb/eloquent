import { useState, useCallback, lazy, Suspense } from 'react';
import { EinstellungenModal } from './components/EinstellungenModal.jsx';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { NavBar } from './components/NavBar.jsx';
import { SetupWizard } from './components/SetupWizard.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { PageTransition } from './components/PageTransition.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import { PageLoader } from './components/PageLoader.jsx';
import './styles.css';

// Keep HeroPage eager (landing page, first paint)
import { HeroPage } from './pages/HeroPage.jsx';

// Lazy load all other pages
const DuellPage = lazy(() => import('./pages/DuellPage.jsx').then(m => ({ default: m.DuellPage })));
const UebungPage = lazy(() => import('./pages/UebungPage.jsx').then(m => ({ default: m.UebungPage })));
const WoerterbuchPage = lazy(() => import('./pages/WoerterbuchPage.jsx').then(m => ({ default: m.WoerterbuchPage })));
const RanglistePage = lazy(() => import('./pages/RanglistePage.jsx').then(m => ({ default: m.RanglistePage })));
const RegelnPage = lazy(() => import('./pages/RegelnPage.jsx').then(m => ({ default: m.RegelnPage })));
const StoryPage = lazy(() => import('./pages/StoryPage.jsx').then(m => ({ default: m.StoryPage })));
const AchievementPage = lazy(() => import('./pages/AchievementPage.jsx').then(m => ({ default: m.AchievementPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx').then(m => ({ default: m.ProfilePage })));
const OnlineDuellPage = lazy(() => import('./pages/OnlineDuellPage.jsx').then(m => ({ default: m.OnlineDuellPage })));

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
  const { isAuthenticated, profile } = useAuth();

  const onNavigate = useCallback((page, state) => {
    const route = pageToRoute[page] || '/';
    navigate(route, { state });
    window.scrollTo(0, 0);
  }, [navigate]);

  const [setupDone, setSetupDone] = useState(() => localStorage.getItem('eloquent_setup_done') === '1');
  const [showSettings, setShowSettings] = useState(false);

  if (!setupDone) {
    return <SetupWizard onComplete={() => setSetupDone(true)} />;
  }

  return (
    <div className="texture-paper app-shell">
      <NavBar current={currentPage} onNavigate={onNavigate} />
      {isAuthenticated && profile && !profile.username && (
        <AuthModal onClose={() => {}} forceOpen />
      )}
      <PageTransition pageKey={currentPage}>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </PageTransition>
      <BottomNav activePage={currentPage} onNavigate={onNavigate} onOpenSettings={() => setShowSettings(true)} />
      {showSettings && <EinstellungenModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
