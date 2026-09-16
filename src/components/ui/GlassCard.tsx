import type { HTMLAttributes, ReactNode } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  intensity?: 'light' | 'regular' | 'dim'
  rounded?: 'glass' | 'bubble' | 'pill' | 'full'
}

const intensityClass: Record<NonNullable<GlassCardProps['intensity']>, string> = {
  light: 'glass-soft',
  regular: 'glass',
  dim: 'glass-dim',
}

const roundedClass: Record<NonNullable<GlassCardProps['rounded']>, string> = {
  glass: 'rounded-glass',
  bubble: 'rounded-bubble',
  pill: 'rounded-pill',
  full: 'rounded-full',
}

export default function GlassCard({
  children,
  intensity = 'regular',
  rounded = 'glass',
  className = '',
  ...rest
}: GlassCardProps) {
  return (
    <div className={`${intensityClass[intensity]} ${roundedClass[rounded]} ${className}`} {...rest}>
      {children}
    </div>
  )
}
