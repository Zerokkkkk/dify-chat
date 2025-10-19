import { defineStore } from 'pinia'
import {
  deleteConversation,
  fetchConversations,
  fetchMessages,
  type Message,
  type Session,
} from '@/service/chat'

export const useSessionStore = defineStore('session', () => {
  const user = ref('admin')
  const sessions = ref<Session[]>([])
  const sessionId = ref('')
  const sessionLoading = ref(false)
  const messages = ref<Message[]>([])
  const enableSuggestions = ref(false)
  const chatAborter = ref()

  const updateSessions = async () => {
    const res = await fetchConversations()
    sessions.value = res.data || []
  }

  const deleteSession = async (id: string) => {
    if (!id) return

    await deleteConversation(id)

    if (id === sessionId.value) {
      chatAborter.value?.abort()
      clearMessages()
    }

    updateSessions()
  }

  const updateMessages = async (silent?: boolean) => {
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

  return {
    user,
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
  }
})
