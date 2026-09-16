import type { ChatMessage, MessageType, Participant, PresenceState, Room } from '../types'

export interface CreateRoomInput {
  displayName: string
  avatarUrl?: string | null
}

export interface JoinRoomInput {
  inviteCode: string
  displayName: string
  avatarUrl?: string | null
}

export interface SendMessageInput {
  roomId: string
  senderId: string
  senderName: string
  type: MessageType
  content: string
  imageUrl?: string | null
  stickerId?: string | null
  clientId: string
}

export type Unsubscribe = () => void

/**
 * Everything the UI needs from a realtime chat backend. `mockChatService`
 * implements this against localStorage + BroadcastChannel so the whole app
 * works before Supabase is connected; `supabaseChatService` implements the
 * same contract against a real Supabase project. Swapping one for the other
 * (see services/index.ts) is the entire migration.
 */
export interface ChatService {
  createRoom(input: CreateRoomInput): Promise<{ room: Room; participant: Participant }>
  getRoomByInviteCode(inviteCode: string): Promise<Room | null>
  joinRoom(input: JoinRoomInput): Promise<{ room: Room; participant: Participant }>
  rejoinRoom(roomId: string, participantId: string): Promise<Participant | null>

  getMessages(roomId: string): Promise<ChatMessage[]>
  sendMessage(input: SendMessageInput): Promise<ChatMessage>
  retryMessage(message: ChatMessage): Promise<ChatMessage>
  subscribeMessages(roomId: string, onMessage: (message: ChatMessage) => void): Unsubscribe

  uploadImage(roomId: string, file: File): Promise<string>

  subscribePresence(
    roomId: string,
    participant: Participant,
    onChange: (state: PresenceState) => void
  ): Unsubscribe
}

export class RoomNotFoundError extends Error {
  constructor() {
    super('Room not found')
    this.name = 'RoomNotFoundError'
  }
}
