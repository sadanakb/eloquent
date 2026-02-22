import { useState } from 'react';
import { NavBar } from './components/NavBar.jsx';
import { SetupWizard } from './components/SetupWizard.jsx';
import { HeroPage } from './pages/HeroPage.jsx';
import { DuellPage } from './pages/DuellPage.jsx';
import { UebungPage } from './pages/UebungPage.jsx';
import { WoerterbuchPage } from './pages/WoerterbuchPage.jsx';
import { RanglistePage } from './pages/RanglistePage.jsx';
import { RegelnPage } from './pages/RegelnPage.jsx';
import { StoryPage } from './pages/StoryPage.jsx';
import { Button } from './components/Button.jsx';
import './styles.css';

export default function App() {
  const [page, setPage] = useState("home");
  const [setupDone, setSetupDone] = useState(() => localStorage.getItem('eloquent_setup_done') === '1');

  if (!setupDone) {
    return <SetupWizard onComplete={() => setSetupDone(true)} />;
  }

  return (
    <div className="texture-paper" style={{ minHeight: "100vh" }}>
      {page !== "home" && <NavBar current={page} onNavigate={setPage} />}
      {page === "home" && <HeroPage onNavigate={setPage} />}
      {page === "duell" && <DuellPage onNavigate={setPage} />}
      {page === "uebung" && <UebungPage />}
      {page === "woerterbuch" && <WoerterbuchPage />}
      {page === "rangliste" && <RanglistePage />}
      {page === "regeln" && <RegelnPage />}
      {page === "story" && <StoryPage onNavigate={setPage} />}
    </div>
  );
}
