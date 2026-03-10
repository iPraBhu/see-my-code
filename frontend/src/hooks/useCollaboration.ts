import { useEffect, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { generateUsername, generateColor } from '../lib/awareness'

export interface UserInfo {
  name: string
  color: string
  clientId: number
}

// In production the Worker and Pages app share the same domain.
// Override via VITE_WS_URL for custom deployments.
function getServerUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL as string
  if (import.meta.env.DEV) return 'ws://localhost:8787'
  return `wss://${location.host}`
}

export function useCollaboration(roomId: string) {
  const [doc, setDoc] = useState<Y.Doc | null>(null)
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  const [connected, setConnected] = useState(false)
  const [users, setUsers] = useState<UserInfo[]>([])

  useEffect(() => {
    if (!roomId) return

    const ydoc = new Y.Doc()

    const serverUrl = getServerUrl()
    const roomName = `r/${roomId}/ws`

    const wsProvider = new WebsocketProvider(serverUrl, roomName, ydoc, {
      connect: true,
    })

    const username = generateUsername()
    const color = generateColor()

    wsProvider.awareness.setLocalStateField('user', {
      name: username,
      color,
    })

    wsProvider.on('status', ({ status }: { status: string }) => {
      setConnected(status === 'connected')
    })

    const updateUsers = () => {
      const states = Array.from(wsProvider.awareness.getStates().entries())
      const userList: UserInfo[] = states
        .filter(([, state]) => state.user)
        .map(([clientId, state]) => ({
          name: state.user.name,
          color: state.user.color,
          clientId,
        }))
      setUsers(userList)
    }

    wsProvider.awareness.on('change', updateUsers)
    updateUsers()

    setDoc(ydoc)
    setProvider(wsProvider)

    return () => {
      wsProvider.awareness.off('change', updateUsers)
      wsProvider.destroy()
      ydoc.destroy()
      setDoc(null)
      setProvider(null)
      setConnected(false)
      setUsers([])
    }
  }, [roomId])

  return { doc, provider, connected, users }
}
