import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import GlassCard from '../ui/GlassCard'
import GlassButton from '../ui/GlassButton'
import Avatar from '../ui/Avatar'
import { fileToDataUrl, validateImageFile } from '../../utils/image'

interface NameEntryProps {
  title: string
  subtitle: string
  confirmLabel: string
  busy?: boolean
  error?: string | null
  onSubmit: (displayName: string, avatarUrl: string | null) => void
}

export default function NameEntry({ title, subtitle, confirmLabel, busy, error, onSubmit }: NameEntryProps) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleAvatarPick(file: File | undefined) {
    if (!file) return
    const err = validateImageFile(file)
    if (err) {
      setAvatarError(err)
      return
    }
    setAvatarError(null)
    setAvatar(await fileToDataUrl(file))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit(trimmed, avatar)
  }

  return (
    <GlassCard className="w-full max-w-sm p-8 animate-fade-slide-in sm:p-9">
      <h1 className="font-arima text-[26px] leading-tight text-[#3E3832]">{title}</h1>
      <p className="mt-2 text-[15px] text-[#5c5147]">{subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col items-center gap-5">
        <div className="relative">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative flex h-20 w-20 items-center justify-center rounded-full transition-transform active:scale-95"
            aria-label="Add a photo"
          >
            {avatar ? (
              <Avatar name={name || '?'} src={avatar} size={80} />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-[#8B7968]/50 bg-white/25 text-[#8B7968] transition-colors group-hover:bg-white/40">
                <Camera size={22} strokeWidth={1.5} />
              </div>
            )}
            {avatar && (
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  setAvatar(null)
                }}
                className="absolute -right-1 -top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-[#3E3832]/70 text-white"
              >
                <X size={13} />
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleAvatarPick(e.target.files?.[0])}
          />
        </div>
        {avatarError && <p className="-mt-2 text-[13px] text-[#9c5b4a]">{avatarError}</p>}

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What should we call you?"
          maxLength={30}
          className="w-full rounded-pill border border-white/50 bg-white/35 px-5 py-3 text-center text-[16px] text-[#3E3832] placeholder:text-[#8B7968]/70 outline-none backdrop-blur-soft focus:bg-white/45"
        />

        {error && <p className="text-center text-[13px] text-[#9c5b4a]">{error}</p>}

        <GlassButton type="submit" fullWidth disabled={!name.trim() || busy}>
          {busy ? 'One moment…' : confirmLabel}
        </GlassButton>
      </form>
    </GlassCard>
  )
}
