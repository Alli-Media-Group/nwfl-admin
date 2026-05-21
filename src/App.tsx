import { AnimatePresence } from 'motion/react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { PageWrapper } from './components/layout/PageWrapper'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { Spinner } from './components/ui/Spinner'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import { DashboardPage } from './pages/Dashboard/index'
import { LoginPage } from './pages/Login/index'
import { MatchesPage } from './pages/Matches/index'
import { StandingsPage } from './pages/Standings/index'
import { TeamsPage } from './pages/Teams/index'
import { WhatsAppParserPage } from './pages/WhatsAppParser/index'

function ProtectedApp() {
  const { loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <Spinner label="Loading admin portal" size="lg" />
      </div>
    )
  }

  // Save current location so login can redirect back after auth
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <Sidebar />
      <TopBar />
      <main className="lg:pl-60">
        <Routes>
          <Route path="/" element={<PageWrapper title="Newsroom Overview" eyebrow="Dashboard"><DashboardPage /></PageWrapper>} />
          <Route path="/matches" element={<PageWrapper title="Match Operations" eyebrow="Matches"><MatchesPage /></PageWrapper>} />
          <Route path="/teams" element={<PageWrapper title="Club Profiles" eyebrow="Teams"><TeamsPage /></PageWrapper>} />
          <Route path="/standings" element={<PageWrapper title="Table Control" eyebrow="Standings"><StandingsPage /></PageWrapper>} />
          <Route path="/whatsapp-parser" element={<PageWrapper title="WhatsApp Intake" eyebrow="Parser"><WhatsAppParserPage /></PageWrapper>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  useTheme()

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </AnimatePresence>
  )
}
