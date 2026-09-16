interface ImageMessageProps {
  src: string
  onOpen: () => void
}

export default function ImageMessage({ src, onOpen }: ImageMessageProps) {
  return (
    <button
      onClick={onOpen}
      className="block max-w-[280px] overflow-hidden rounded-[18px] transition-transform hover:brightness-[1.03] active:scale-[0.99] sm:max-w-[340px]"
    >
      <img src={src} alt="Shared" className="block w-full object-cover" loading="lazy" />
    </button>
  )
}
