import { RoomDO } from './RoomDO'

export { RoomDO }

interface Env {
  ROOMS: DurableObjectNamespace
  ENVIRONMENT: string
}

const ROOM_ID_RE = /^[a-z0-9-]{4,64}$/

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function isValidRoomId(id: string): boolean {
  return ROOM_ID_RE.test(id)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') || '*'

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    // Route: GET /r/:roomId/ws -> WebSocket upgrade -> forward to RoomDO
    const wsMatch = url.pathname.match(/^\/r\/([^/]+)\/ws$/)
    if (wsMatch) {
      const roomId = wsMatch[1]
      if (!isValidRoomId(roomId)) {
        return new Response('Invalid room ID', { status: 400 })
      }
      const doId = env.ROOMS.idFromName(roomId)
      const roomDO = env.ROOMS.get(doId)
      return roomDO.fetch(request)
    }

    // Route: GET /api/room/:roomId -> validate room exists
    const apiMatch = url.pathname.match(/^\/api\/room\/([^/]+)$/)
    if (apiMatch) {
      const roomId = apiMatch[1]
      if (!isValidRoomId(roomId)) {
        return new Response(JSON.stringify({ error: 'Invalid room ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        })
      }
      return new Response(JSON.stringify({ roomId, valid: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      })
    }

    return new Response('Not found', { status: 404 })
  },
}
