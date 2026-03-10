export interface RoomStorage {
  loadSnapshot(roomId: string): Promise<Uint8Array | null>
  saveSnapshot(roomId: string, data: Uint8Array): Promise<void>
  deleteRoom(roomId: string): Promise<void>
}

// Phase 1: No persistence
export class NoOpStorage implements RoomStorage {
  async loadSnapshot(_roomId: string): Promise<Uint8Array | null> {
    return null
  }
  async saveSnapshot(_roomId: string, _data: Uint8Array): Promise<void> {}
  async deleteRoom(_roomId: string): Promise<void> {}
}

// Phase 2: Persist to Durable Object storage (future implementation)
export class DurableObjectStorageImpl implements RoomStorage {
  constructor(private storage: DurableObjectStorage) {}

  async loadSnapshot(roomId: string): Promise<Uint8Array | null> {
    const data = await this.storage.get<ArrayBuffer>(`snapshot:${roomId}`)
    return data ? new Uint8Array(data) : null
  }

  async saveSnapshot(roomId: string, data: Uint8Array): Promise<void> {
    await this.storage.put(`snapshot:${roomId}`, data.buffer)
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.storage.delete(`snapshot:${roomId}`)
  }
}
