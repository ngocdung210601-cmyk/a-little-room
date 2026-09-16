import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import GlassButton from '../components/ui/GlassButton'
import NameEntry from '../components/onboarding/NameEntry'
import { chatService } from '../services'
import { saveRoomMembership } from '../hooks/useLocalSession'

type Stage = 'landing' | 'creating'

export default function Landing() {
  const navigate = useNavigate()
  const [stage, setStage] = useState<Stage>('landing')
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(displayName: string, avatarUrl: string | null) {
    setBusy(true)
    setError(null)
    try {
      const { room, participant } = await chatService.createRoom({ displayName, avatarUrl })
      saveRoomMembership(room.id, {
        participantId: participant.id,
        displayName: participant.displayName,
        avatarUrl: participant.avatarUrl,
      })
      navigate(`/chat/${room.inviteCode}`, { state: { justCreated: true } })
    } catch {
      setError("Something went wrong. Let's try that again.")
      setBusy(false)
    }
  }

  function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = joinCode.trim().replace(/^.*\/chat\//, '')
    if (!trimmed) return
    navigate(`/chat/${trimmed}`)
  }

  return (
    <div className="atmosphere flex min-h-dvh items-center justify-center p-5">
      <div className="relative z-10 w-full max-w-sm">
        {stage === 'landing' ? (
          <GlassCard className="w-full p-8 text-center animate-fade-slide-in sm:p-10">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-white/35 text-2xl">
              🫧
            </div>
            <h1 className="font-arima text-[28px] leading-tight text-[#3E3832] sm:text-[32px]">
              Somewhere between here and there.
            </h1>
            <p className="mx-auto mt-3 max-w-[280px] text-[15px] leading-relaxed text-[#5c5147]">
              Create a private space for two.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <GlassButton fullWidth onClick={() => setStage('creating')}>
                Create a little space
                <ArrowRight size={16} />
              </GlassButton>

              <form onSubmit={handleJoinSubmit} className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Have a link or code?"
                  className="min-w-0 flex-1 rounded-pill border border-white/40 bg-white/20 px-4 py-2.5 text-[14px] text-[#3E3832] placeholder:text-[#8B7968]/70 outline-none backdrop-blur-soft focus:bg-white/30"
                />
                <GlassButton type="submit" variant="secondary" disabled={!joinCode.trim()} className="!px-4">
                  Join
                </GlassButton>
              </form>
            </div>
          </GlassCard>
        ) : (
          <NameEntry
            title="Create a little space"
            subtitle="Pick a name — you can change it later."
            confirmLabel="Create chat"
            busy={busy}
            error={error}
            onSubmit={handleCreate}
          />
        )}
      </div>
    </div>
  )
}
