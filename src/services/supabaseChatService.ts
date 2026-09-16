import { supabase, STORAGE_BUCKET, getSupabaseSessionId } from '../lib/supabase/client'
import type { ChatMessage, MessageType, Participant, PresenceState, Room } from '../types'
import { generateId, generateInviteCode } from '../utils/id'
import { validateImageFile, compressImageIfNeeded } from '../utils/image'
import type {
  ChatService,
  CreateRoomInput,
  JoinRoomInput,
  SendMessageInput,
  Unsubscribe,
} from './chatService'
import { RoomNotFoundError } from './chatService'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  return supabase
}

// ---- row <-> domain mapping -------------------------------------------------

interface RoomRow {
  id: string
  invite_code: string
  name: string
  created_at: string
  created_by: string
}
function roomFromRow(row: RoomRow): Room {
  return { id: row.id, inviteCode: row.invite_code, name: row.name, createdAt: row.created_at, createdBy: row.created_by }
}

interface ParticipantRow {
  id: string
  room_id: string
  display_name: string
  avatar_url: string | null
  session_id: string
  joined_at: string
  last_seen: string
}
function participantFromRow(row: ParticipantRow): Participant {
  return {
    id: row.id,
    roomId: row.room_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    sessionId: row.session_id,
    joinedAt: row.joined_at,
    lastSeen: row.last_seen,
  }
}

interface MessageRow {
  id: string
  room_id: string
  sender_id: string
  sender_name: string
  type: MessageType
  content: string
  image_url: string | null
  sticker_id: string | null
  created_at: string
}
function messageFromRow(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    roomId: row.room_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    type: row.type,
    content: row.content,
    imageUrl: row.image_url,
    stickerId: row.sticker_id,
    linkMeta: null,
    createdAt: row.created_at,
    status: 'sent',
  }
}

export const supabaseChatService: ChatService = {
  async createRoom({ displayName, avatarUrl }: CreateRoomInput) {
    const db = requireClient()
    const sessionId = await getSupabaseSessionId()
    const inviteCode = generateInviteCode()

    const { data: roomRow, error: roomError } = await db
      .from('rooms')
      .insert({ invite_code: inviteCode, name: 'our little room', created_by: sessionId })
      .select()
      .single()
    if (roomError || !roomRow) throw roomError ?? new Error('Could not create room')

    const { data: participantRow, error: participantError } = await db
      .from('participants')
      .insert({
        room_id: roomRow.id,
        display_name: displayName,
        avatar_url: avatarUrl ?? null,
        session_id: sessionId,
      })
      .select()
      .single()
    if (participantError || !participantRow) throw participantError ?? new Error('Could not join room')

    return { room: roomFromRow(roomRow), participant: participantFromRow(participantRow) }
  },

  async getRoomByInviteCode(inviteCode: string) {
    const db = requireClient()
    const { data, error } = await db.from('rooms').select().eq('invite_code', inviteCode).maybeSingle()
    if (error) throw error
    return data ? roomFromRow(data) : null
  },

  async joinRoom({ inviteCode, displayName, avatarUrl }: JoinRoomInput) {
    const db = requireClient()
    const sessionId = await getSupabaseSessionId()
    const room = await this.getRoomByInviteCode(inviteCode)
    if (!room) throw new RoomNotFoundError()

    const { data: existing } = await db
      .from('participants')
      .select()
      .eq('room_id', room.id)
      .eq('session_id', sessionId)
      .maybeSingle()

    if (existing) {
      const { data: updated, error } = await db
        .from('participants')
        .update({ display_name: displayName, avatar_url: avatarUrl ?? existing.avatar_url, last_seen: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
      if (error || !updated) throw error ?? new Error('Could not update participant')
      return { room, participant: participantFromRow(updated) }
    }

    const { data: participantRow, error } = await db
      .from('participants')
      .insert({ room_id: room.id, display_name: displayName, avatar_url: avatarUrl ?? null, session_id: sessionId })
      .select()
      .single()
    if (error || !participantRow) throw error ?? new Error('Could not join room')
    return { room, participant: participantFromRow(participantRow) }
  },

  async rejoinRoom(roomId: string, participantId: string) {
    const db = requireClient()
    const { data, error } = await db.from('participants').select().eq('id', participantId).eq('room_id', roomId).maybeSingle()
    if (error) throw error
    return data ? participantFromRow(data) : null
  },

  async getMessages(roomId: string) {
    const db = requireClient()
    const { data, error } = await db
      .from('messages')
      .select()
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(messageFromRow)
  },

  async sendMessage(input: SendMessageInput) {
    const db = requireClient()
    const { data, error } = await db
      .from('messages')
      .insert({
        room_id: input.roomId,
        sender_id: input.senderId,
        sender_name: input.senderName,
        type: input.type,
        content: input.content,
        image_url: input.imageUrl ?? null,
        sticker_id: input.stickerId ?? null,
      })
      .select()
      .single()
    if (error || !data) {
      return {
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
        status: 'failed' as const,
        clientId: input.clientId,
      }
    }
    return { ...messageFromRow(data), clientId: input.clientId }
  },

  async retryMessage(message: ChatMessage) {
    return this.sendMessage({
      roomId: message.roomId,
      senderId: message.senderId,
      senderName: message.senderName,
      type: message.type,
      content: message.content,
      imageUrl: message.imageUrl,
      stickerId: message.stickerId,
      clientId: message.clientId ?? generateId(),
    })
  },

  subscribeMessages(roomId: string, onMessage: (message: ChatMessage) => void): Unsubscribe {
    const db = requireClient()
    const channel = db
      .channel(`messages:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => onMessage(messageFromRow(payload.new as MessageRow))
      )
      .subscribe()
    return () => {
      db.removeChannel(channel)
    }
  },

  async uploadImage(roomId: string, file: File) {
    const db = requireClient()
    const validationError = validateImageFile(file)
    if (validationError) throw new Error(validationError)
    const compressed = await compressImageIfNeeded(file)
    const path = `${roomId}/${generateId()}-${file.name}`
    const { error } = await db.storage.from(STORAGE_BUCKET).upload(path, compressed, {
      cacheControl: '3600',
      upsert: false,
      contentType: compressed.type,
    })
    if (error) throw error
    const { data } = db.storage.from(STORAGE_BUCKET).getPublicUrl(path)
    return data.publicUrl
  },

  subscribePresence(roomId: string, participant: Participant, onChange: (state: PresenceState) => void): Unsubscribe {
    const db = requireClient()
    const channel = db.channel(`presence:${roomId}`, {
      config: { presence: { key: participant.sessionId } },
    })

    const emit = () => {
      const state = channel.presenceState()
      const ids = Object.keys(state)
      onChange({ onlineCount: ids.length, onlineSessionIds: ids })
    }

    channel
      .on('presence', { event: 'sync' }, emit)
      .on('presence', { event: 'join' }, emit)
      .on('presence', { event: 'leave' }, emit)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ displayName: participant.displayName, online_at: new Date().toISOString() })
        }
      })

    return () => {
      db.removeChannel(channel)
    }
  },
}
