import { Link2 } from 'lucide-react'
import { domainFromUrl } from '../../utils/linkify'

interface LinkPreviewProps {
  url: string
}

export default function LinkPreview({ url }: LinkPreviewProps) {
  const domain = domainFromUrl(url)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-soft mt-1 flex max-w-[280px] items-center gap-3 rounded-2xl px-3.5 py-3 transition-transform hover:-translate-y-[1px]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/40 text-[#8B7968]">
        <Link2 size={16} strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13.5px] text-[#3E3832]">{domain}</span>
        <span className="block truncate text-[12px] text-[#8B7968]">{url}</span>
      </span>
    </a>
  )
}
