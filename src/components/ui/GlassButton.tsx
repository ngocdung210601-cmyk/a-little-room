import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon'
  fullWidth?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 font-arima transition-all duration-200 ease-out active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none select-none'

const variantClass: Record<NonNullable<GlassButtonProps['variant']>, string> = {
  primary:
    'px-6 py-3 rounded-pill text-[#3E3832] bg-[rgba(255,255,255,0.55)] border border-white/60 shadow-soft hover:bg-[rgba(255,255,255,0.7)] hover:-translate-y-[1px] backdrop-blur-soft text-[15px]',
  secondary:
    'px-6 py-3 rounded-pill text-[#3E3832] bg-[rgba(255,255,255,0.22)] border border-white/40 hover:bg-[rgba(255,255,255,0.34)] hover:-translate-y-[1px] backdrop-blur-soft text-[15px]',
  ghost:
    'px-4 py-2 rounded-pill text-[#5c5147] hover:bg-[rgba(255,255,255,0.25)] text-[14px]',
  icon: 'h-10 w-10 rounded-full text-[#5c5147] hover:bg-[rgba(255,255,255,0.35)] hover:-translate-y-[1px]',
}

export default function GlassButton({
  children,
  variant = 'primary',
  fullWidth,
  className = '',
  ...rest
}: GlassButtonProps) {
  return (
    <button className={`${base} ${variantClass[variant]} ${fullWidth ? 'w-full' : ''} ${className}`} {...rest}>
      {children}
    </button>
  )
}
