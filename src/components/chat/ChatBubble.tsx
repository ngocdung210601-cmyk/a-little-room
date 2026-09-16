import { RefreshCw, Clock } from 'lucide-react'
import type { ChatMessage } from '../../types'
import { formatTimestamp } from '../../utils/format'
import { splitTextWithLinks } from '../../utils/linkify'
import { findSticker } from '../stickers/stickerData'
import ImageMessage from './ImageMessage'
import LinkPreview from './LinkPreview'

interface ChatBubbleProps {
  message: ChatMessage
  isOwn: boolean
  showTail: boolean
  onRetry?: (message: ChatMessage) => void
  onOpenImage?: (src: string) => void
}

function TextContent({ content }: { content: string }) {
  const parts = splitTextWithLinks(content)
  return (
    <p className="whitespace-pre-wrap break-words text-[15.5px] leading-relaxed text-[#3E3832]">
      {parts.map((part, i) =>
        part.isLink ? (
          <a
            key={i}
            href={part.text}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[#8B7968]/50 underline-offset-2 hover:decoration-[#8B7968]"
          >
            {part.text}
          </a>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </p>
  )
}

export default function ChatBubble({ message, isOwn, showTail, onRetry, onOpenImage }: ChatBubbleProps) {
  const isSticker = message.type === 'sticker'
  const sticker = isSticker && message.stickerId ? findSticker(message.stickerId) : undefined

  const bubbleShape = isOwn
    ? `rounded-bubble ${showTail ? 'rounded-br-[8px]' : ''}`
    : `rounded-bubble ${showTail ? 'rounded-bl-[8px]' : ''}`

  const bubbleTone = isOwn
    ? 'bg-[rgba(250,246,239,0.55)] border border-white/50'
    : 'bg-[rgba(139,121,104,0.16)] border border-white/35'

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[78%] flex-col ${isOwn ? 'items-end' : 'items-start'} sm:max-w-[65%]`}>
        {isSticker ? (
          <div className="animate-pop-in px-1 py-1 text-[64px] leading-none">{sticker?.emoji ?? '❔'}</div>
        ) : message.type === 'image' && message.imageUrl ? (
          <div className={`animate-fade-slide-in overflow-hidden p-1 backdrop-blur-soft ${bubbleShape} ${bubbleTone}`}>
            <ImageMessage src={message.imageUrl} onOpen={() => onOpenImage?.(message.imageUrl!)} />
          </div>
        ) : message.type === 'link' ? (
          <div className={`animate-fade-slide-in px-4 py-3 backdrop-blur-soft ${bubbleShape} ${bubbleTone}`}>
            <TextContent content={message.content} />
            <LinkPreview url={message.content.trim()} />
          </div>
        ) : (
          <div className={`animate-fade-slide-in px-4 py-2.5 backdrop-blur-soft ${bubbleShape} ${bubbleTone}`}>
            <TextContent content={message.content} />
          </div>
        )}

        <div className="mt-1 flex items-center gap-1.5 px-1.5 text-[11px] text-[#8B7968]">
          {message.status === 'sending' && (
            <>
              <Clock size={11} />
              <span>sending…</span>
            </>
          )}
          {message.status === 'failed' && (
            <button
              onClick={() => onRetry?.(message)}
              className="flex items-center gap-1 text-[#9c5b4a] hover:underline"
            >
              <RefreshCw size={11} />
              couldn't send · retry
            </button>
          )}
          {message.status === 'sent' && <span>{formatTimestamp(message.createdAt)}</span>}
        </div>
      </div>
    </div>
  )
}
