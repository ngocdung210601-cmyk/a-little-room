import { generateId } from '../utils/id'

const SESSION_KEY = 'glasschat:session-id'

/** Returns a stable anonymous id for this browser, creating one on first use. */
export function getLocalSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = generateId()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

interface StoredMembership {
  participantId: string
  displayName: string
  avatarUrl?: string | null
}

function membershipKey(roomId: string) {
  return `glasschat:membership:${roomId}`
}

export function getRoomMembership(roomId: string): StoredMembership | null {
  const raw = localStorage.getItem(membershipKey(roomId))
  return raw ? JSON.parse(raw) : null
}

export function saveRoomMembership(roomId: string, membership: StoredMembership) {
  localStorage.setItem(membershipKey(roomId), JSON.stringify(membership))
}
