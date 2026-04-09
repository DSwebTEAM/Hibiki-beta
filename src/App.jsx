import { Routes, Route, Navigate } from 'react-router-dom'
import { useStorage } from './lib/storage'
import EntryPage    from './pages/EntryPage'
import HomePage     from './pages/HomePage'
import ChatsPage    from './pages/ChatsPage'
import StudioPage   from './pages/StudioPage'
import SettingsPage from './pages/SettingsPage'
import StatusPage   from './pages/StatusPage'

export default function App() {
  const hasKey = useStorage(s => s.hasApiKey())
  return (
    <Routes>
      <Route path="/"        element={<EntryPage />} />
      <Route path="/home"    element={hasKey ? <HomePage />    : <Navigate to="/" replace />} />
      <Route path="/chats"   element={hasKey ? <ChatsPage />   : <Navigate to="/" replace />} />
      <Route path="/studio"  element={hasKey ? <StudioPage />  : <Navigate to="/" replace />} />
      <Route path="/settings"element={hasKey ? <SettingsPage />: <Navigate to="/" replace />} />
      <Route path="/status"  element={hasKey ? <StatusPage />  : <Navigate to="/" replace />} />
      <Route path="*"        element={<Navigate to="/" replace />} />
    </Routes>
  )
}
