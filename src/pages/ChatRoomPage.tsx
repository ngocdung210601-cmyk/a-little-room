import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import GlassCard from '../components/ui/GlassCard'
import NameEntry from '../components/onboarding/NameEntry'
import ChatHeader from '../components/chat/ChatHeader'
import MessageList from '../components/chat/MessageList'
import MessageComposer, { type MessageComposerHandle } from '../components/composer/MessageComposer'
import { chatService, isUsingMockBackend, RoomNotFoundError } from '../services'
import { getSupabaseSessionId } from '../lib/supabase/client'
import { getRoomMembership, saveRoomMembership } from '../hooks/useLocalSession'
import { useChatRoom } from '../hooks/useChatRoom'
import { useToast } from '../components/ui/Toast'
import type { Participant, Room } from '../types'

type Status = 'loading' | 'not-found' | 'join' | 'ready' | 'error'

export default function ChatRoomPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()

  const [status, setStatus] = useState<Status>('loading')
  const [room, setRoom] = useState<Room | null>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [joinBusy, setJoinBusy] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)
  const composerRef = useRef<MessageComposerHandle>(null)

  useEffect(() => {
    let cancelled = false
    async function resolve() {
      if (!code) return
      setStatus('loading')
      try {
        await getSupabaseSessionId()
	const foundRoom = await chatService.getRoomByInviteCode(code)
        if (cancelled) return
        if (!foundRoom) {
          setStatus('not-found')
          return
        }
        setRoom(foundRoom)

        const membership = getRoomMembership(foundRoom.id)
        if (membership) {
          const existingParticipant = await chatService.rejoinRoom(foundRoom.id, membership.participantId)
          if (cancelled) return
          if (existingParticipant) {
            setParticipant(existingParticipant)
            setStatus('ready')
            return
          }
        }
        setStatus('join')
      } catch (err) {
        if (cancelled) return
        setStatus(err instanceof RoomNotFoundError ? 'not-found' : 'error')
      }
    }
    resolve()
    return () => {
      cancelled = true
    }
  }, [code])

  async function handleJoin(displayName: string, avatarUrl: string | null) {
    if (!code) return
    setJoinBusy(true)
    setJoinError(null)
    try {
      const { room: joinedRoom, participant: joinedParticipant } = await chatService.joinRoom({
        inviteCode: code,
        displayName,
        avatarUrl,
      })
      saveRoomMembership(joinedRoom.id, {
        participantId: joinedParticipant.id,
        displayName: joinedParticipant.displayName,
        avatarUrl: joinedParticipant.avatarUrl,
      })
      setRoom(joinedRoom)
      setParticipant(joinedParticipant)
      setStatus('ready')
      showToast("You're in.")
    } catch (err) {
      setJoinError(
        err instanceof RoomNotFoundError
          ? "This little room doesn't exist anymore."
          : "Couldn't join right now. Try again."
      )
    } finally {
      setJoinBusy(false)
    }
  }

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/chat/${code}`
    const shareData = { title: 'a little room', text: 'Join our private chat', url }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // user cancelled the native sheet — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      showToast('Invite link copied ✨')
    } catch {
      showToast('Could not copy the link — copy it from the address bar.')
    }
  }, [code, showToast])

  function handleDragEnter(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes('Files')) return
    e.preventDefault()
    dragCounter.current += 1
    setIsDragging(true)
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) setIsDragging(false)
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    const file = [...e.dataTransfer.files].find((f) => f.type.startsWith('image/'))
    if (file) composerRef.current?.addImageFile(file)
  }

  if (status === 'loading') {
    return (
      <div className="atmosphere flex min-h-dvh items-center justify-center p-5">
        <p className="animate-fade-in text-[15px] text-[#5c5147]">Finding your room…</p>
      </div>
    )
  }

  if (status === 'not-found' || status === 'error') {
    return (
      <div className="atmosphere flex min-h-dvh items-center justify-center p-5">
        <GlassCard className="w-full max-w-sm p-8 text-center animate-fade-slide-in">
          <p className="font-arima text-[20px] text-[#3E3832]">
            {status === 'not-found' ? "Oops, this little room doesn't exist." : 'Something went sideways.'}
          </p>
          <p className="mt-2 text-[14.5px] text-[#8B7968]">
            {status === 'not-found' ? 'Try checking the invite link.' : 'Give it another try in a moment.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 text-[14px] text-[#3E3832] underline underline-offset-2"
          >
            Back to start
          </button>
        </GlassCard>
      </div>
    )
  }

  if (status === 'join' && room) {
    return (
      <div className="atmosphere flex min-h-dvh items-center justify-center p-5">
        <NameEntry
          title="Join the conversation"
          subtitle={`You're about to enter ${room.name}.`}
          confirmLabel="Join chat"
          busy={joinBusy}
          error={joinError}
          onSubmit={handleJoin}
        />
      </div>
    )
  }

  if (status === 'ready' && room && participant) {
    return (
      <RoomView
        room={room}
        participant={participant}
        onShare={handleShare}
        isDragging={isDragging}
        composerRef={composerRef}
        dragHandlers={{
          onDragEnter: handleDragEnter,
          onDragLeave: handleDragLeave,
          onDragOver: handleDragOver,
          onDrop: handleDrop,
        }}
        justCreated={Boolean((location.state as { justCreated?: boolean } | null)?.justCreated)}
      />
    )
  }

  return null
}

interface RoomViewProps {
  room: Room
  participant: Participant
  onShare: () => void
  isDragging: boolean
  composerRef: React.RefObject<MessageComposerHandle | null>
  dragHandlers: {
    onDragEnter: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
  }
  justCreated: boolean
}

function RoomView({ room, participant, onShare, isDragging, composerRef, dragHandlers, justCreated }: RoomViewProps) {
  const { messages, onlineCount, sendText, sendImage, sendSticker, retry } = useChatRoom(room, participant)
  const { showToast } = useToast()
  const announcedRef = useRef(false)

  useEffect(() => {
    if (justCreated && !announcedRef.current) {
      announcedRef.current = true
      showToast(isUsingMockBackend ? 'Room ready — open the link in another tab to test' : 'Room ready ✨')
    }
  }, [justCreated, showToast])

  const otherName = onlineCount > 1 ? 'them' : 'waiting…'

  return (
    <div className="atmosphere flex min-h-dvh items-center justify-center p-0 sm:p-6" {...dragHandlers}>
      <GlassCard
        rounded="glass"
        className="relative flex h-dvh w-full flex-col overflow-hidden sm:h-[85vh] sm:max-w-[900px]"
      >
        <ChatHeader
          roomName={room.name}
          otherName={otherName}
          onlineCount={onlineCount}
          onShare={onShare}
        />
        <div className="min-h-0 flex-1">
          <MessageList
            messages={messages}
            currentParticipantId={participant.id}
            otherName="them"
            onRetry={retry}
          />
        </div>
        <MessageComposer
          ref={composerRef}
          onSendText={sendText}
          onSendImage={sendImage}
          onSendSticker={sendSticker}
        />

        {isDragging && (
          <div className="glass pointer-events-none absolute inset-3 z-50 flex animate-fade-in items-center justify-center rounded-[28px] border-2 border-dashed border-white/70">
            <p className="font-arima text-[20px] text-[#3E3832]">Drop image to send</p>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
