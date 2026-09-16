import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ClipboardEvent,
  type CompositionEvent,
  type KeyboardEvent,
} from 'react'
import { Plus, Send, Smile, X, Loader2 } from 'lucide-react'
import GlassCard from '../ui/GlassCard'
import AttachPopover from './AttachPopover'
import StickerPicker from '../stickers/StickerPicker'
import { fileToDataUrl, validateImageFile } from '../../utils/image'

export interface MessageComposerHandle {
  addImageFile: (file: File) => void
}

interface MessageComposerProps {
  onSendText: (text: string) => void
  onSendImage: (file: File, caption: string) => Promise<void> | void
  onSendSticker: (stickerId: string) => void
  disabled?: boolean
}

interface PendingImage {
  file: File
  previewUrl: string
}

const MessageComposer = forwardRef<MessageComposerHandle, MessageComposerProps>(
  ({ onSendText, onSendImage, onSendSticker, disabled }, ref) => {
    const [text, setText] = useState('')
    const [pendingImage, setPendingImage] = useState<PendingImage | null>(null)
    const [imageError, setImageError] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [showAttach, setShowAttach] = useState(false)
    const [showStickers, setShowStickers] = useState(false)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const photoInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    // Tracks whether an IME (Vietnamese Telex/VNI, Chinese Pinyin, Japanese, etc.)
    // is mid-composition, so the Enter it uses internally to confirm a tone
    // mark / candidate isn't misread as "send message".
    const isComposingRef = useRef(false)
    const compositionEndedAtRef = useRef(0)

    async function addImageFile(file: File) {
      const err = validateImageFile(file)
      if (err) {
        setImageError(err)
        return
      }
      setImageError(null)
      const previewUrl = await fileToDataUrl(file)
      setPendingImage({ file, previewUrl })
    }

    useImperativeHandle(ref, () => ({ addImageFile }))

    function autoResize() {
      const el = textareaRef.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 140)}px`
    }

    async function handleSend() {
      if (disabled || uploading) return
      const trimmed = text.trim()
      if (pendingImage) {
        setUploading(true)
        try {
          await onSendImage(pendingImage.file, trimmed)
          setPendingImage(null)
          setText('')
        } finally {
          setUploading(false)
        }
        return
      }
      if (!trimmed) return
      onSendText(trimmed)
      setText('')
      requestAnimationFrame(autoResize)
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
      if (e.key !== 'Enter' || e.shiftKey) return
      // e.nativeEvent.isComposing covers most browsers; keyCode 229 and the
      // "just finished composing" window cover Safari/older engines, where
      // isComposing can already read false on the very keydown that closed
      // the composition (common with Vietnamese Telex/VNI input).
      const composing =
        isComposingRef.current ||
        e.nativeEvent.isComposing ||
        e.keyCode === 229 ||
        Date.now() - compositionEndedAtRef.current < 50
      if (composing) return
      e.preventDefault()
      handleSend()
    }

    function handleCompositionStart() {
      isComposingRef.current = true
    }

    function handleCompositionEnd(_e: CompositionEvent<HTMLTextAreaElement>) {
      isComposingRef.current = false
      compositionEndedAtRef.current = Date.now()
    }

    async function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
      const item = [...e.clipboardData.items].find((i) => i.type.startsWith('image/'))
      if (!item) return
      const file = item.getAsFile()
      if (!file) return
      e.preventDefault()
      await addImageFile(file)
    }

    const canSend = !disabled && !uploading && (Boolean(pendingImage) || text.trim().length > 0)

    return (
      <div
        className="px-4 pt-2 sm:px-7 sm:pb-6"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {pendingImage && (
          <div className="mb-2 flex animate-fade-slide-in items-center gap-3 px-1">
            <div className="relative">
              <img src={pendingImage.previewUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
              {!uploading && (
                <button
                  onClick={() => setPendingImage(null)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#3E3832]/70 text-white"
                  aria-label="Remove image"
                >
                  <X size={11} />
                </button>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30">
                  <Loader2 size={18} className="animate-spin text-white" />
                </div>
              )}
            </div>
            <span className="text-[13px] text-[#8B7968]">
              {uploading ? 'Sending image…' : 'Ready to send'}
            </span>
          </div>
        )}
        {imageError && <p className="mb-2 px-1 text-[13px] text-[#9c5b4a]">{imageError}</p>}

        <GlassCard rounded="pill" intensity="light" className="relative flex items-end gap-2 px-3 py-2.5">
          <div className="relative shrink-0">
            <button
              onClick={() => setShowAttach((s) => !s)}
              disabled={disabled}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#8B7968] transition-colors hover:bg-white/35 active:scale-95"
              aria-label="Add attachment"
            >
              <Plus size={19} strokeWidth={1.75} />
            </button>
            {showAttach && (
              <AttachPopover
                onPickPhoto={() => photoInputRef.current?.click()}
                onPickCamera={() => cameraInputRef.current?.click()}
                onPickFile={() => fileInputRef.current?.click()}
                onClose={() => setShowAttach(false)}
              />
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              autoResize()
            }}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onPaste={handlePaste}
            disabled={disabled}
            placeholder="Send something…"
            rows={1}
            className="max-h-[140px] flex-1 resize-none bg-transparent py-1.5 text-[15.5px] leading-relaxed text-[#3E3832] outline-none placeholder:text-[#8B7968]/70"
          />

          <div className="relative flex shrink-0 items-center gap-1">
            <button
              onClick={() => setShowStickers((s) => !s)}
              disabled={disabled}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#8B7968] transition-colors hover:bg-white/35 active:scale-95"
              aria-label="Stickers"
            >
              <Smile size={19} strokeWidth={1.75} />
            </button>
            {showStickers && (
              <StickerPicker
                onPick={(id) => {
                  onSendSticker(id)
                  setShowStickers(false)
                }}
                onClose={() => setShowStickers(false)}
              />
            )}

            <button
              onClick={handleSend}
              disabled={!canSend}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8B7968] text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              aria-label="Send"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} strokeWidth={2} />}
            </button>
          </div>
        </GlassCard>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && addImageFile(e.target.files[0])}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && addImageFile(e.target.files[0])}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && addImageFile(e.target.files[0])}
        />
      </div>
    )
  }
)

MessageComposer.displayName = 'MessageComposer'
export default MessageComposer
