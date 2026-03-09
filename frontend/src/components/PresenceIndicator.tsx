import { UserInfo } from '../hooks/useCollaboration'

interface Props {
  users: UserInfo[]
  connected: boolean
}

export default function PresenceIndicator({ users, connected }: Props) {
  return (
    <div className="presence-indicator">
      <span className={`connection-dot ${connected ? 'connected' : 'disconnected'}`} title={connected ? 'Connected' : 'Disconnected'} />
      <span className="user-count">{users.length} online</span>
      <div className="user-dots">
        {users.slice(0, 5).map((user) => (
          <span
            key={user.clientId}
            className="user-dot"
            title={user.name}
            style={{ backgroundColor: user.color }}
          />
        ))}
        {users.length > 5 && <span className="user-more">+{users.length - 5}</span>}
      </div>
    </div>
  )
}
