import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Navigate } from 'react-router-dom'
import { isValidRoomId } from '../lib/roomId'
import { useCollaboration } from '../hooks/useCollaboration'
import TopBar from '../components/TopBar'
import Editor from '../components/Editor'

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [searchParams] = useSearchParams()
  const [language, setLanguage] = useState(searchParams.get('lang') || 'typescript')
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('theme') || 'vs-dark'
  })

  const { doc, provider, connected, users } = useCollaboration(roomId || '')

  useEffect(() => {
    localStorage.setItem('theme', theme)
  }, [theme])

  if (!roomId || !isValidRoomId(roomId)) {
    return <Navigate to="/" replace />
  }

  const toggleTheme = () => {
    setTheme((t) => (t === 'vs-dark' ? 'light' : 'vs-dark'))
  }

  return (
    <div className="room-page">
      <TopBar
        roomId={roomId}
        language={language}
        theme={theme}
        users={users}
        connected={connected}
        onLanguageChange={setLanguage}
        onThemeToggle={toggleTheme}
      />
      <div className="editor-wrapper">
        <Editor
          doc={doc}
          provider={provider}
          language={language}
          theme={theme}
        />
      </div>
    </div>
  )
}
