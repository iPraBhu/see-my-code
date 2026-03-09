const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function generateRoomId(): string {
  let id = ''
  for (let i = 0; i < 10; i++) {
    id += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return id
}

export function isValidRoomId(id: string): boolean {
  return /^[a-z0-9-]{4,64}$/.test(id)
}
