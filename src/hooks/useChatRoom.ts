import { useCallback, useEffect, useRef, useState } from 'react'
import { chatService } from '../services'
import type { ChatMessage, Participant, Room } from '../types'
import { generateId } from '../utils/id'
import { extractFirstUrl } from '../utils/linkify'

export function useChatRoom(room: Room, participant: Participant) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [onlineCount, setOnlineCount] = useState(1)
  const [loading, setLoading] = useState(true)
  const messagesRef = useRef<ChatMessage[]>([])
  messagesRef.current = messages

  const upsertLocal = useCallback((message: ChatMessage, matchClientId?: string) => {
    setMessages((prev) => {
      if (matchClientId) {
        const idx = prev.findIndex((m) => m.clientId === matchClientId)
        if (idx !== -1) {
          const next = [...prev]
          next[idx] = message
          return next
        }
      }
      if (prev.some((m) => m.id === message.id)) return prev
      return [...prev, message]
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    chatService.getMessages(room.id).then((history) => {
      if (!cancelled) {
        setMessages(history)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [room.id])

  useEffect(() => {
    const unsubscribe = chatService.subscribeMessages(room.id, (message) => {
      // Our own outgoing messages are reconciled directly in sendText/sendImage/sendSticker;
      // the subscription is only needed for messages from the other participant.
      if (message.senderId === participant.id) return
      upsertLocal(message)
    })
    return unsubscribe
  }, [room.id, participant.id, upsertLocal])

  useEffect(() => {
    const unsubscribe = chatService.subscribePresence(room.id, participant, (state) => {
      setOnlineCount(state.onlineCount)
    })
    return unsubscribe
  }, [room.id, participant])

  const sendText = useCallback(
    async (text: string) => {
      const clientId = generateId()
      const isPureLink = extractFirstUrl(text) === text.trim()
      const optimistic: ChatMessage = {
        id: clientId,
        roomId: room.id,
        senderId: participant.id,
        senderName: participant.displayName,
        type: isPureLink ? 'link' : 'text',
        content: text,
        imageUrl: null,
        stickerId: null,
        linkMeta: null,
        createdAt: new Date().toISOString(),
        status: 'sending',
        clientId,
      }
      upsertLocal(optimistic)
      const result = await chatService.sendMessage({
        roomId: room.id,
        senderId: participant.id,
        senderName: participant.displayName,
        type: optimistic.type,
        content: text,
        clientId,
      })
      upsertLocal({ ...result, clientId }, clientId)
    },
    [room.id, participant, upsertLocal]
  )

  const sendImage = useCallback(
    async (file: File, caption: string) => {
      const clientId = generateId()
      const localPreview = URL.createObjectURL(file)
      const optimistic: ChatMessage = {
        id: clientId,
        roomId: room.id,
        senderId: participant.id,
        senderName: participant.displayName,
        type: 'image',
        content: caption,
        imageUrl: localPreview,
        stickerId: null,
        linkMeta: null,
        createdAt: new Date().toISOString(),
        status: 'sending',
        clientId,
      }
      upsertLocal(optimistic)
      try {
        const uploadedUrl = await chatService.uploadImage(room.id, file)
        const result = await chatService.sendMessage({
          roomId: room.id,
          senderId: participant.id,
          senderName: participant.displayName,
          type: 'image',
          content: caption,
          imageUrl: uploadedUrl,
          clientId,
        })
        upsertLocal({ ...result, clientId }, clientId)
      } catch {
        upsertLocal({ ...optimistic, status: 'failed' }, clientId)
      } finally {
        URL.revokeObjectURL(localPreview)
      }
    },
    [room.id, participant, upsertLocal]
  )

  const sendSticker = useCallback(
    async (stickerId: string) => {
      const clientId = generateId()
      const optimistic: ChatMessage = {
        id: clientId,
        roomId: room.id,
        senderId: participant.id,
        senderName: participant.displayName,
        type: 'sticker',
        content: '',
        imageUrl: null,
        stickerId,
        linkMeta: null,
        createdAt: new Date().toISOString(),
        status: 'sending',
        clientId,
      }
      upsertLocal(optimistic)
      const result = await chatService.sendMessage({
        roomId: room.id,
        senderId: participant.id,
        senderName: participant.displayName,
        type: 'sticker',
        content: '',
        stickerId,
        clientId,
      })
      upsertLocal({ ...result, clientId }, clientId)
    },
    [room.id, participant, upsertLocal]
  )

  const retry = useCallback(
    async (message: ChatMessage) => {
      upsertLocal({ ...message, status: 'sending' })
      try {
        const result = await chatService.retryMessage(message)
        upsertLocal({ ...result, clientId: message.clientId }, message.clientId)
      } catch {
        upsertLocal({ ...message, status: 'failed' })
      }
    },
    [upsertLocal]
  )

  return { messages, onlineCount, loading, sendText, sendImage, sendSticker, retry }
}
