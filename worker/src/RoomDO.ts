import { NoOpStorage } from './storage'

interface Env {
  ROOMS: DurableObjectNamespace
  ENVIRONMENT: string
}

export class RoomDO implements DurableObject {
  private sessions: Set<WebSocket> = new Set()
  private storage: NoOpStorage

  constructor(private state: DurableObjectState, private env: Env) {
    this.storage = new NoOpStorage()
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.endsWith('/ws')) {
      return this.handleWebSocket(request)
    }

    if (url.pathname.endsWith('/info')) {
      return Response.json({ clients: this.sessions.size })
    }

    return new Response('Not found', { status: 404 })
  }

  private handleWebSocket(request: Request): Response {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    this.state.acceptWebSocket(server)
    this.sessions.add(server)

    return new Response(null, { status: 101, webSocket: client })
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    // TODO: Add rate limiting per client
    // Broadcast to all other connected clients
    const data = typeof message === 'string'
      ? new TextEncoder().encode(message)
      : message

    for (const session of this.sessions) {
      if (session !== ws && session.readyState === WebSocket.OPEN) {
        try {
          session.send(data)
        } catch {
          this.sessions.delete(session)
        }
      }
    }
  }

  webSocketClose(ws: WebSocket, _code: number, _reason: string, _wasClean: boolean): void {
    this.sessions.delete(ws)
    ws.close()
  }

  webSocketError(ws: WebSocket, _error: unknown): void {
    this.sessions.delete(ws)
    ws.close()
  }
}
