import type { Message, Session } from '@/service/chat'
import { defineStore } from 'pinia'
import {
  deleteConversation,
  fetchConversations,
  fetchMessages,
} from '@/service/chat'

export const useSessionStore = defineStore('session', () => {
  const user = ref('admin')
  const apiKey = ref(import.meta.env.VITE_CHAT_API_KEY || '')
  const sessions = ref<Session[]>([])
  const sessionId = ref('')
  const sessionLoading = ref(false)
  const messages = ref<Message[]>([])
  const enableSuggestions = ref(false)
  const chatAborter = ref()

  const updateSessions = async () => {
    if (!apiKey.value) return

    const res = await fetchConversations()
    sessions.value = res.data || []
  }

  const deleteSession = async (id: string, waitUpdate = false) => {
    if (!id) return

    await deleteConversation(id)

    if (id === sessionId.value) {
      chatAborter.value?.abort()
      clearMessages()
    }

    if (waitUpdate) {
      return updateSessions()
    }
    else {
      updateSessions()
    }
  }

  const updateMessages = async (silent?: boolean) => {
    if (!apiKey.value) return

    if (!silent) {
      sessionLoading.value = true
    }

    fetchMessages({
      conversation_id: sessionId.value,
      limit: 100,
    })
      .then((res) => {
        messages.value = res.data.sort((a, b) => {
          return a.created_at - b.created_at
        })
      })
      .finally(() => {
        sessionLoading.value = false
      })
  }

  const clearMessages = () => {
    sessionId.value = ''
    messages.value = []
  }

  const setApiKey = (key: string) => {
    apiKey.value = key
  }

  return {
    user,
    apiKey,
    /** 当前会话 ID */
    sessionId,
    /** 会话消息加载中 */
    sessionLoading,
    sessions,
    messages,
    updateSessions,
    deleteSession,
    updateMessages,
    clearMessages,
    chatAborter,
    enableSuggestions,
    setApiKey,
  }
})
