import { useState } from 'react'
import GlassCard from '../ui/GlassCard'
import { STICKER_CATEGORIES } from './stickerData'

interface StickerPickerProps {
  onPick: (stickerId: string) => void
  onClose: () => void
}

export default function StickerPicker({ onPick, onClose }: StickerPickerProps) {
  const [activeCategory, setActiveCategory] = useState(STICKER_CATEGORIES[0].id)
  const category = STICKER_CATEGORIES.find((c) => c.id === activeCategory) ?? STICKER_CATEGORIES[0]

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <GlassCard
        rounded="glass"
        className="absolute bottom-full right-0 z-40 mb-3 w-[280px] animate-pop-in origin-bottom-right p-4 sm:w-[320px]"
      >
        <div className="grid grid-cols-4 gap-2">
          {category.stickers.map((sticker) => (
            <button
              key={sticker.id}
              onClick={() => onPick(sticker.id)}
              aria-label={sticker.label}
              className="flex aspect-square items-center justify-center rounded-2xl text-[32px] transition-transform hover:scale-110 hover:bg-white/25 active:scale-95"
            >
              {sticker.emoji}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-1 border-t border-white/30 pt-3">
          {STICKER_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-[17px] transition-colors ${
                c.id === activeCategory ? 'bg-white/45' : 'hover:bg-white/20'
              }`}
              aria-label={c.label}
            >
              {c.icon}
            </button>
          ))}
        </div>
      </GlassCard>
    </>
  )
}
