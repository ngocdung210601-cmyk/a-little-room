import { Image, Camera, FileUp } from 'lucide-react'
import GlassCard from '../ui/GlassCard'

interface AttachPopoverProps {
  onPickPhoto: () => void
  onPickCamera: () => void
  onPickFile: () => void
  onClose: () => void
}

export default function AttachPopover({ onPickPhoto, onPickCamera, onPickFile, onClose }: AttachPopoverProps) {
  const items = [
    { icon: Image, label: 'Photo', onClick: onPickPhoto },
    { icon: Camera, label: 'Camera', onClick: onPickCamera },
    { icon: FileUp, label: 'File', onClick: onPickFile },
  ]
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <GlassCard
        rounded="glass"
        className="absolute bottom-full left-0 z-40 mb-3 w-52 animate-pop-in origin-bottom-left p-2"
      >
        {items.map(({ icon: Icon, label, onClick }) => (
          <button
            key={label}
            onClick={() => {
              onClick()
              onClose()
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[14.5px] text-[#3E3832] transition-colors hover:bg-white/30"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/40 text-[#8B7968]">
              <Icon size={15} strokeWidth={1.75} />
            </span>
            {label}
          </button>
        ))}
      </GlassCard>
    </>
  )
}
