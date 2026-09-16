export type MessageType = 'text' | 'image' | 'sticker' | 'link'
export type MessageStatus = 'sending' | 'sent' | 'failed'

export interface Room {
  id: string
  inviteCode: string
  name: string
  createdAt: string
  createdBy: string
}

export interface Participant {
  id: string
  roomId: string
  displayName: string
  avatarUrl?: string | null
  sessionId: string
  joinedAt: string
  lastSeen: string
}

export interface LinkMeta {
  url: string
  title?: string
  domain?: string
  image?: string
}

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  senderName: string
  type: MessageType
  content: string
  imageUrl?: string | null
  stickerId?: string | null
  linkMeta?: LinkMeta | null
  createdAt: string
  status: MessageStatus
  /** Present only on the client that sent it, before the server/mock ack arrives. */
  clientId?: string
}

export interface PresenceState {
  onlineCount: number
  onlineSessionIds: string[]
}

/** Local, per-device identity used before any account system exists. */
export interface LocalSession {
  sessionId: string
}

export interface RoomMembership {
  roomId: string
  displayName: string
  avatarUrl?: string | null
  participantId: string
}
