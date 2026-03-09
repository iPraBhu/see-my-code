import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateRoomId } from '../lib/roomId'

const LANGUAGES = ['javascript', 'typescript', 'python', 'rust', 'go', 'html', 'css', 'json', 'markdown']

export default function HomePage() {
  const [language, setLanguage] = useState('typescript')
  const navigate = useNavigate()

  const createRoom = () => {
    const roomId = generateRoomId()
    navigate(`/r/${roomId}?lang=${language}`)
  }

  return (
    <div className="home-page">
      <div className="home-card">
        <h1 className="home-title">see-my-code</h1>
        <p className="home-subtitle">Collaborative code editing in real time</p>
        <div className="home-controls">
          <select
            className="select select-lg"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <button className="btn btn-primary btn-lg" onClick={createRoom}>
            New Room →
          </button>
        </div>
      </div>
    </div>
  )
}
