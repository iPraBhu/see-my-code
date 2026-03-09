import { useState } from 'react'
import PresenceIndicator from './PresenceIndicator'
import { UserInfo } from '../hooks/useCollaboration'

const LANGUAGES = ['javascript', 'typescript', 'python', 'rust', 'go', 'html', 'css', 'json', 'markdown']

interface Props {
  roomId: string
  language: string
  theme: string
  users: UserInfo[]
  connected: boolean
  onLanguageChange: (lang: string) => void
  onThemeToggle: () => void
}

export default function TopBar({ roomId, language, theme, users, connected, onLanguageChange, onThemeToggle }: Props) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    await navigator.clipboard.writeText(location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="logo">see-my-code</span>
        <span className="room-id" title={roomId}>{roomId}</span>
        <button className="btn btn-secondary" onClick={copyLink}>
          {copied ? '✓ Copied' : 'Copy Link'}
        </button>
      </div>
      <div className="topbar-right">
        <select
          className="select"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
        <button className="btn btn-secondary" onClick={onThemeToggle}>
          {theme === 'vs-dark' ? '☀️' : '🌙'}
        </button>
        <PresenceIndicator users={users} connected={connected} />
      </div>
    </div>
  )
}
