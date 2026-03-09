import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { generateUsername, generateColor } from '../lib/awareness'

export interface UserInfo {
  name: string
  color: string
  clientId: number
}

export function useCollaboration(roomId: string) {
  const docRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const [connected, setConnected] = useState(false)
  const [users, setUsers] = useState<UserInfo[]>([])

  useEffect(() => {
    if (!roomId) return

    const doc = new Y.Doc()
    docRef.current = doc

    const isDev = import.meta.env.DEV
    const serverUrl = isDev
      ? 'ws://localhost:8787'
      : `wss://${location.host}`
    const roomName = `r/${roomId}/ws`

    const provider = new WebsocketProvider(serverUrl, roomName, doc, {
      connect: true,
    })
    providerRef.current = provider

    const username = generateUsername()
    const color = generateColor()

    provider.awareness.setLocalStateField('user', {
      name: username,
      color,
    })

    provider.on('status', ({ status }: { status: string }) => {
      setConnected(status === 'connected')
    })

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().entries())
      const userList: UserInfo[] = states
        .filter(([, state]) => state.user)
        .map(([clientId, state]) => ({
          name: state.user.name,
          color: state.user.color,
          clientId,
        }))
      setUsers(userList)
    }

    provider.awareness.on('change', updateUsers)
    updateUsers()

    return () => {
      provider.awareness.off('change', updateUsers)
      provider.destroy()
      doc.destroy()
      docRef.current = null
      providerRef.current = null
    }
  }, [roomId])

  return {
    doc: docRef.current,
    provider: providerRef.current,
    connected,
    users,
  }
}
