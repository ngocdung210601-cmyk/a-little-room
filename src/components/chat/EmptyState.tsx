export default function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center animate-fade-in">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="opacity-70">
        <circle cx="22" cy="28" r="16" stroke="#8B7968" strokeWidth="1.2" fill="rgba(255,255,255,0.25)" />
        <circle cx="36" cy="20" r="9" stroke="#8B7968" strokeWidth="1.2" fill="rgba(255,255,255,0.35)" />
      </svg>
      <div>
        <p className="font-arima text-[19px] text-[#3E3832]">Nothing here yet.</p>
        <p className="mt-1 text-[14.5px] text-[#8B7968]">Say something.</p>
      </div>
    </div>
  )
}
