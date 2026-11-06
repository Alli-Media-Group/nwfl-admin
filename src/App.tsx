import { MotionConfig } from 'motion/react'
import { useState } from 'react'
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
import { MediaLibraryPage } from './pages/MediaLibrary/index'
import { MissingLogosPage } from './pages/MissingLogos/index'
import { SyncPage } from './pages/Sync/index'
import { TeamsPage } from './pages/Teams/index'
import { BlogPage } from './pages/Blog/index'
import { WhatsAppParserPage } from './pages/WhatsAppParser/index'
import { InvitationsPage } from './pages/Invitations/index'
import { AcceptInvitePage } from './pages/AcceptInvite/index'
import { ApiAccessPage } from './pages/ApiAccess/index'
import { PlayersPage } from './pages/Players/index'

function ProtectedApp() {
  const { loading, user } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

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
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-[248px]">
      <TopBar onOpenMenu={() => setMenuOpen(true)} />
      <main>
        <Routes>
          <Route path="/" element={<PageWrapper><DashboardPage /></PageWrapper>} />
          <Route path="/matches" element={<PageWrapper><MatchesPage /></PageWrapper>} />
          <Route path="/teams" element={<PageWrapper><TeamsPage /></PageWrapper>} />
          <Route path="/players" element={<PageWrapper><PlayersPage /></PageWrapper>} />
          <Route path="/standings" element={<PageWrapper><StandingsPage /></PageWrapper>} />
          <Route path="/whatsapp-parser" element={<PageWrapper><WhatsAppParserPage /></PageWrapper>} />
          <Route path="/sync" element={<PageWrapper><SyncPage /></PageWrapper>} />
          <Route path="/blog" element={<PageWrapper><BlogPage /></PageWrapper>} />
          <Route path="/media-library" element={<PageWrapper><MediaLibraryPage /></PageWrapper>} />
          <Route path="/missing-logos" element={<PageWrapper><MissingLogosPage /></PageWrapper>} />
          <Route path="/invitations" element={<PageWrapper><InvitationsPage /></PageWrapper>} />
          <Route path="/api-access" element={<PageWrapper><ApiAccessPage /></PageWrapper>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      </div>
    </div>
  )
}

export default function App() {
  useTheme()

  return (
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </MotionConfig>
  )
}
