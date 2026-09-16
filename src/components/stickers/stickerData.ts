export interface Sticker {
  id: string
  emoji: string
  label: string
}

export interface StickerCategory {
  id: string
  label: string
  icon: string
  stickers: Sticker[]
}

/**
 * MVP stickers are emoji rendered large — no external sticker API or asset
 * pipeline required. To add an image-based pack later, give a Sticker an
 * optional `imageUrl` and render that instead of `emoji` in StickerBubble.
 */
export const STICKER_CATEGORIES: StickerCategory[] = [
  {
    id: 'love',
    label: 'Love',
    icon: '❤️',
    stickers: [
      { id: 'love-1', emoji: '❤️', label: 'Heart' },
      { id: 'love-2', emoji: '🥰', label: 'In love' },
      { id: 'love-3', emoji: '💕', label: 'Two hearts' },
      { id: 'love-4', emoji: '😘', label: 'Kiss' },
    ],
  },
  {
    id: 'funny',
    label: 'Funny',
    icon: '😂',
    stickers: [
      { id: 'funny-1', emoji: '😂', label: 'Crying laughing' },
      { id: 'funny-2', emoji: '🤣', label: 'Rolling laughing' },
      { id: 'funny-3', emoji: '😜', label: 'Cheeky' },
      { id: 'funny-4', emoji: '🙃', label: 'Upside down' },
    ],
  },
  {
    id: 'cute',
    label: 'Cute',
    icon: '🥺',
    stickers: [
      { id: 'cute-1', emoji: '🥺', label: 'Pleading' },
      { id: 'cute-2', emoji: '🐻', label: 'Bear' },
      { id: 'cute-3', emoji: '🌸', label: 'Blossom' },
      { id: 'cute-4', emoji: '🫶', label: 'Heart hands' },
    ],
  },
  {
    id: 'mood',
    label: 'Mood',
    icon: '✨',
    stickers: [
      { id: 'mood-1', emoji: '✨', label: 'Sparkles' },
      { id: 'mood-2', emoji: '🌙', label: 'Moon' },
      { id: 'mood-3', emoji: '☕', label: 'Coffee' },
      { id: 'mood-4', emoji: '😴', label: 'Sleepy' },
    ],
  },
  {
    id: 'reaction',
    label: 'Reaction',
    icon: '👋',
    stickers: [
      { id: 'reaction-1', emoji: '👋', label: 'Wave' },
      { id: 'reaction-2', emoji: '👀', label: 'Eyes' },
      { id: 'reaction-3', emoji: '🙌', label: 'Celebrate' },
      { id: 'reaction-4', emoji: '🤔', label: 'Thinking' },
    ],
  },
]

export function findSticker(stickerId: string): Sticker | undefined {
  for (const category of STICKER_CATEGORIES) {
    const found = category.stickers.find((s) => s.id === stickerId)
    if (found) return found
  }
  return undefined
}
