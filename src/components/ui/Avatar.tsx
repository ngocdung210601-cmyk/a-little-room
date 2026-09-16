import { avatarHue, initials } from '../../utils/format'

interface AvatarProps {
  name: string
  src?: string | null
  size?: number
  ring?: boolean
}

export default function Avatar({ name, src, size = 36, ring = false }: AvatarProps) {
  const hue = avatarHue(name)
  const style = {
    width: size,
    height: size,
    fontSize: size * 0.38,
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={style}
        className={`rounded-full object-cover ${ring ? 'ring-2 ring-white/70' : ''}`}
      />
    )
  }

  return (
    <div
      style={{
        ...style,
        background: `linear-gradient(140deg, hsl(${hue} 35% 82%), hsl(${hue} 30% 68%))`,
      }}
      className={`flex items-center justify-center rounded-full font-medium text-[#3E3832]/80 ${
        ring ? 'ring-2 ring-white/70' : ''
      }`}
    >
      {initials(name)}
    </div>
  )
}
