import { Share } from 'lucide-react'
import Avatar from '../ui/Avatar'
import GlassButton from '../ui/GlassButton'

interface ChatHeaderProps {
  roomName: string
  otherName?: string | null
  otherAvatarUrl?: string | null
  onlineCount: number
  onShare: () => void
}

export default function ChatHeader({ roomName, otherName, otherAvatarUrl, onlineCount, onShare }: ChatHeaderProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 border-b border-white/30 px-5 py-4 sm:px-7"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={otherName || roomName} src={otherAvatarUrl} size={38} ring />
        <div className="min-w-0">
          <p className="truncate font-arima text-[17px] leading-tight text-[#3E3832]">{roomName}</p>
          <p className="flex items-center gap-1.5 text-[12.5px] text-[#8B7968]">
            <span className={`h-1.5 w-1.5 rounded-full ${onlineCount > 1 ? 'bg-[#7a9b7e]' : 'bg-[#c2b6a4]'}`} />
            {onlineCount > 1 ? `${onlineCount} people online` : 'waiting for someone to join'}
          </p>
        </div>
      </div>
      <GlassButton variant="secondary" onClick={onShare} className="!px-4 !py-2.5 shrink-0">
        <Share size={15} strokeWidth={1.75} />
        <span className="hidden sm:inline">Share</span>
      </GlassButton>
    </div>
  )
}
