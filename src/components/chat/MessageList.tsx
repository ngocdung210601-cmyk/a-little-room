import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../../types'
import ChatBubble from './ChatBubble'
import EmptyState from './EmptyState'
import Lightbox from './Lightbox'
import Avatar from '../ui/Avatar'

interface MessageListProps {
  messages: ChatMessage[]
  currentParticipantId: string
  otherAvatarUrl?: string | null
  otherName: string
  onRetry: (message: ChatMessage) => void
}

const GROUP_WINDOW_MS = 5 * 60 * 1000

export default function MessageList({ messages, currentParticipantId, otherAvatarUrl, otherName, onRetry }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const lastCount = useRef(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 240
    if (messages.length !== lastCount.current) {
      if (isNearBottom || lastCount.current === 0) {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight
        })
      }
      lastCount.current = messages.length
    }
  }, [messages])

  if (messages.length === 0) return <EmptyState />

  return (
    <div ref={scrollRef} className="flex h-full flex-col gap-1.5 overflow-y-auto px-4 py-5 sm:px-7">
      {messages.map((message, i) => {
        const isOwn = message.senderId === currentParticipantId
        const prev = messages[i - 1]
        const next = messages[i + 1]
        const isNewCluster =
          !prev || prev.senderId !== message.senderId || new Date(message.createdAt).getTime() - new Date(prev.createdAt).getTime() > GROUP_WINDOW_MS
        const endsCluster =
          !next || next.senderId !== message.senderId || new Date(next.createdAt).getTime() - new Date(message.createdAt).getTime() > GROUP_WINDOW_MS

        return (
          <div key={message.id} className={`flex items-end gap-2 ${isNewCluster ? 'mt-3' : ''}`}>
            {!isOwn && (
              <div className="w-7 shrink-0">
                {endsCluster && <Avatar name={otherName} src={otherAvatarUrl} size={26} />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <ChatBubble
                message={message}
                isOwn={isOwn}
                showTail={endsCluster}
                onRetry={onRetry}
                onOpenImage={setLightboxSrc}
              />
            </div>
            {isOwn && <div className="w-7 shrink-0" />}
          </div>
        )
      })}
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  )
}
