import type { ChatMessage, Participant, PresenceState, Room } from '../types'
import { generateId, generateInviteCode } from '../utils/id'
import { getLocalSessionId } from '../hooks/useLocalSession'
import { fileToDataUrl, compressImageIfNeeded } from '../utils/image'
import type {
  ChatService,
  CreateRoomInput,
  JoinRoomInput,
  SendMessageInput,
  Unsubscribe,
} from './chatService'
import { RoomNotFoundError } from './chatService'

const ROOMS_KEY = 'glasschat:mock:rooms'
const PARTICIPANTS_PREFIX = 'glasschat:mock:participants:'
const MESSAGES_PREFIX = 'glasschat:mock:messages:'
const PRESENCE_TTL_MS = 12_000
const PRESENCE_HEARTBEAT_MS = 4_000

type WireEvent =
  | { kind: 'message'; message: ChatMessage }
  | { kind: 'presence'; sessionId: string; displayName: string; ts: number; leaving?: boolean }

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function getRooms(): Record<string, Room> {
  return readJson(ROOMS_KEY, {})
}

function saveRoom(room: Room) {
  const rooms = getRooms()
  rooms[room.inviteCode] = room
  writeJson(ROOMS_KEY, rooms)
}

function getParticipants(roomId: string): Participant[] {
  return readJson(PARTICIPANTS_PREFIX + roomId, [])
}

function saveParticipants(roomId: string, participants: Participant[]) {
  writeJson(PARTICIPANTS_PREFIX + roomId, participants)
}

function getMessages(roomId: string): ChatMessage[] {
  return readJson(MESSAGES_PREFIX + roomId, [])
}

function saveMessages(roomId: string, messages: ChatMessage[]) {
  writeJson(MESSAGES_PREFIX + roomId, messages)
}

function channelFor(roomId: string): BroadcastChannel {
  return new BroadcastChannel(`glasschat-room-${roomId}`)
}

/** Simulated network latency + small failure chance, purely to exercise real UI states. */
async function withNetworkQuirks<T>(fn: () => T): Promise<T> {
  await new Promise((r) => setTimeout(r, 180 + Math.random() * 220))
  return fn()
}

export const mockChatService: ChatService = {
  async createRoom({ displayName, avatarUrl }: CreateRoomInput) {
    const sessionId = getLocalSessionId()
    const room: Room = {
      id: generateId(),
      inviteCode: generateInviteCode(),
      name: 'our little room',
      createdAt: new Date().toISOString(),
      createdBy: sessionId,
    }
    const participant: Participant = {
      id: generateId(),
      roomId: room.id,
      displayName,
      avatarUrl: avatarUrl ?? null,
      sessionId,
      joinedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    }
    return withNetworkQuirks(() => {
      saveRoom(room)
      saveParticipants(room.id, [participant])
      saveMessages(room.id, [])
      return { room, participant }
    })
  },

  async getRoomByInviteCode(inviteCode: string) {
    return withNetworkQuirks(() => getRooms()[inviteCode] ?? null)
  },

  async joinRoom({ inviteCode, displayName, avatarUrl }: JoinRoomInput) {
    return withNetworkQuirks(() => {
      const room = getRooms()[inviteCode]
      if (!room) throw new RoomNotFoundError()
      const sessionId = getLocalSessionId()
      const participants = getParticipants(room.id)
      const existing = participants.find((p) => p.sessionId === sessionId)
      const participant: Participant = existing
        ? { ...existing, displayName, avatarUrl: avatarUrl ?? existing.avatarUrl, lastSeen: new Date().toISOString() }
        : {
            id: generateId(),
            roomId: room.id,
            displayName,
            avatarUrl: avatarUrl ?? null,
            sessionId,
            joinedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
          }
      const next = existing
        ? participants.map((p) => (p.id === participant.id ? participant : p))
        : [...participants, participant]
      saveParticipants(room.id, next)
      return { room, participant }
    })
  },

  async rejoinRoom(roomId: string, participantId: string) {
    return withNetworkQuirks(() => getParticipants(roomId).find((p) => p.id === participantId) ?? null)
  },

  async getMessages(roomId: string) {
    return withNetworkQuirks(() => getMessages(roomId))
  },

  async sendMessage(input: SendMessageInput) {
    const message: ChatMessage = {
      id: generateId(),
      roomId: input.roomId,
      senderId: input.senderId,
      senderName: input.senderName,
      type: input.type,
      content: input.content,
      imageUrl: input.imageUrl ?? null,
      stickerId: input.stickerId ?? null,
      linkMeta: null,
      createdAt: new Date().toISOString(),
      status: 'sent',
      clientId: input.clientId,
    }
    // Small, rare simulated failure so retry UX is real and testable.
    const shouldFail = Math.random() < 0.04
    await new Promise((r) => setTimeout(r, 250 + Math.random() * 350))
    if (shouldFail) {
      const failed = { ...message, status: 'failed' as const }
      return failed
    }
    const messages = getMessages(input.roomId)
    saveMessages(input.roomId, [...messages, message])
    const channel = channelFor(input.roomId)
    channel.postMessage({ kind: 'message', message } satisfies WireEvent)
    channel.close()
    return message
  },

  async retryMessage(message: ChatMessage) {
    await new Promise((r) => setTimeout(r, 200))
    const messages = getMessages(message.roomId)
    const sent = { ...message, status: 'sent' as const, createdAt: new Date().toISOString() }
    saveMessages(message.roomId, [...messages, sent])
    const channel = channelFor(message.roomId)
    channel.postMessage({ kind: 'message', message: sent } satisfies WireEvent)
    channel.close()
    return sent
  },

  subscribeMessages(roomId: string, onMessage: (message: ChatMessage) => void): Unsubscribe {
    const channel = channelFor(roomId)
    const handler = (event: MessageEvent<WireEvent>) => {
      if (event.data.kind === 'message') onMessage(event.data.message)
    }
    channel.addEventListener('message', handler)
    return () => {
      channel.removeEventListener('message', handler)
      channel.close()
    }
  },

  async uploadImage(_roomId: string, file: File) {
    const compressed = await compressImageIfNeeded(file)
    // No real object storage in mock mode: images live as data URLs in localStorage.
    return fileToDataUrl(compressed)
  },

  subscribePresence(roomId: string, participant: Participant, onChange: (state: PresenceState) => void): Unsubscribe {
    const channel = channelFor(roomId)
    const seen = new Map<string, number>()
    seen.set(participant.sessionId, Date.now())

    const emit = () => {
      const now = Date.now()
      const online = [...seen.entries()].filter(([, ts]) => now - ts < PRESENCE_TTL_MS).map(([id]) => id)
      onChange({ onlineCount: online.length, onlineSessionIds: online })
    }

    const handler = (event: MessageEvent<WireEvent>) => {
      if (event.data.kind !== 'presence') return
      if (event.data.leaving) {
        seen.delete(event.data.sessionId)
      } else {
        seen.set(event.data.sessionId, event.data.ts)
      }
      emit()
    }
    channel.addEventListener('message', handler)

    const announce = () => {
      channel.postMessage({
        kind: 'presence',
        sessionId: participant.sessionId,
        displayName: participant.displayName,
        ts: Date.now(),
      } satisfies WireEvent)
    }
    announce()
    emit()
    const heartbeat = setInterval(announce, PRESENCE_HEARTBEAT_MS)
    const pruneInterval = setInterval(emit, 3000)

    const handleUnload = () => {
      channel.postMessage({
        kind: 'presence',
        sessionId: participant.sessionId,
        displayName: participant.displayName,
        ts: Date.now(),
        leaving: true,
      } satisfies WireEvent)
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      handleUnload()
      clearInterval(heartbeat)
      clearInterval(pruneInterval)
      channel.removeEventListener('message', handler)
      channel.close()
      window.removeEventListener('beforeunload', handleUnload)
    }
  },
}
