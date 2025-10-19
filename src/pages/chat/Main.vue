<script setup lang="tsx">
import { Bottom } from '@element-plus/icons-vue'
import { useClipboard } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import { debounce } from 'lodash-es'
import { feedbackMessage, fetchSuggestions } from '@/service/chat'
import Assi from '@/shared/assets/icons/avatar-assi.svg'
import User from '@/shared/assets/icons/avatar-user.svg'
import Copy from '@/shared/assets/icons/copy.svg'
import Dislike from '@/shared/assets/icons/dislike.svg'
import Like from '@/shared/assets/icons/like.svg'
import Stop from '@/shared/assets/icons/stop.svg'
import Top from '@/shared/assets/icons/top.svg'
import { useSessionStore } from '@/stores/modules/session'
import MarkdownViewer from './MarkdownViewer.vue'

const session = useSessionStore()
const pending = ref(false)

interface ChatItem {
  id: string
  key: string
  role: 'user' | 'assistant' | string
  content: string
  feedback?: string
}

const chatItems = ref<ChatItem[]>([])
const suggests = ref<string[]>([])

watchEffect(() => {
  chatItems.value = []
  suggests.value = []

  session.messages.forEach((m) => {
    chatItems.value.push({
      id: m.id,
      key: `${m.id}-u`,
      role: 'user',
      content: m.query,
    })

    if (m.answer) {
      chatItems.value.push({
        id: m.id,
        key: `${m.id}-a`,
        role: 'assistant',
        content: m.answer,
        feedback: m.feedback?.rating,
      })
    }
  })
})

const scrollToBottom = (smooth = true) => {
  chatListRef.value?.scrollTo({
    top: chatListRef.value.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto',
  })
}

watchEffect(async () => {
  if (chatItems.value.length) {
    await nextTick()
    scrollToBottom(false)
  }
})

const chatListRef = ref<HTMLDivElement>()
const ChatList = () => (
  <div
    ref={el => chatListRef.value = el}
    class="chat-list"
    onScroll={(ev) => {
      const { scrollTop, clientHeight, scrollHeight } = ev.target as HTMLDivElement

      if (scrollTop + clientHeight >= scrollHeight - 10) {
        showBackBottom.value = false
      }
      else {
        showBackBottom.value = true
      }
    }}
  >
    <li
      v-for={(item, idx) in chatItems.value}
      key={item.key}
      class={{
        'chat-item group': true,
        'chat-item-user': item.role === 'user',
        'chat-item-assistant': item.role === 'assistant',
      }}
    >
      <div
        class="flex gap-16"
        style={{
          'flex-direction': item.role === 'user' ? 'row-reverse' : 'row',
        }}
      >
        <div class="chat-avatar sticky top-0">
          <template v-if={item.role === 'assistant'}>
            <span v-if={idx === chatItems.value.length - 1 && pending.value} class="absolute top--2 flex size-12">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
              <span class="relative inline-flex size-12 rounded-full bg-sky-500"></span>
            </span>
            <Assi />
          </template>
          <User v-else />
        </div>
        <MarkdownViewer
          v-loading={item.role === 'assistant' && item.content === ''}
          v-if={item.role === 'assistant'}
          class="chat-content"
          style={{
            '--el-loading-spinner-size': '24px',
          }}
          content={item.content}
        />
        <div
          v-else
          class="chat-content"
        >
          {item.content}
        </div>
      </div>

      <div class={`group-hover:visible !*:m-0 invisible flex mt-6 ${item.role === 'user' ? 'flex-row-reverse mr-50' : 'ml-50'} hover:*:text-[var(--el-color-primary)]`}>
        <ElButton
          text
          class="p-6 h-auto"
          type="default"
          onClick={() => {
            const { copy, copied } = useClipboard({
              legacy: true,
            })

            copy(item.content)
              .then(() => {
                copied && ElMessage.success('复制成功')
              })
              .catch((err) => {
                ElMessage.error('复制失败')
                console.error(err)
              })
          }}
        >
          <Copy />
        </ElButton>

        <ElButton
          text
          class="p-6 h-auto"
          v-if={item.role === 'assistant'}
          type={item.feedback === 'like' ? 'primary' : 'default'}
          onClick={debounce(() => handleFeedback(item, 'like'), 500)}
        >
          <Like />
        </ElButton>

        <ElButton
          text
          class="p-6 h-auto"
          v-if={item.role === 'assistant'}
          type={item.feedback === 'dislike' ? 'primary' : 'default'}
          onClick={debounce(() => handleFeedback(item, 'dislike'), 500)}
        >
          <Dislike />
        </ElButton>
      </div>
    </li>
  </div>
)

const handleFeedback = async (item: ChatItem, type: 'like' | 'dislike') => {
  if (item.feedback === type) return

  await feedbackMessage(
    {
      rating: type,
      content: '',
    },
    {
      message_id: item.id,
    },
  )
  ElMessage.success('反馈成功')
  session.updateMessages(true)
}

const showBackBottom = ref(false)
const inputValue = ref('')

const ChatInput = () => (
  <>
    <div class="flex gap-12 mb-10 px-60 *:w-a">
      <ElCheckTag
        checked
        type="success"
        v-for={item in suggests.value}
        key={item}
        onChange={() => {
          inputValue.value = item
          handleSend()
        }}
      >
        {item}
      </ElCheckTag>
    </div>

    <div class="chat-input">
      <ElButton
        circle
        class="absolute z-10 top--15 left-50% translate-x--50% transition-opacity duration-300"
        style={{
          opacity: showBackBottom.value ? 1 : 0,
        }}
        icon={Bottom}
        onClick={() => {
          scrollToBottom()
        }}
        v-if={session.sessionId}
      />

      <ElInput
        resize="none"
        type="textarea"
        placeholder="有什么可以帮您的？"
        maxlength={10000}
        autosize={{
          minRows: 1,
          maxRows: 5,
        }}
        v-model={inputValue.value}
        onKeydown_enter={(ev: any) => {
          if (pending.value) return

          if (!ev.shiftKey) {
            ev.preventDefault()

            if (inputValue.value && !inputValue.value.replaceAll(' ', '')) {
              inputValue.value = ''
            }
            else {
              handleSend()
            }
          }
        }}
      />

      <div class="f-e-c mt-6 h-36 *:!p-0">
        <ElButton
          circle
          type="danger"
          class="text-20"
          v-if={pending.value}
          onClick={() => {
            session.chatAborter?.abort()
          }}
        >
          <Stop />
        </ElButton>

        <ElButton
          circle
          type="primary"
          disabled={!inputValue.value || pending.value}
          onClick={handleSend}
        >
          <Top />
        </ElButton>
      </div>
    </div>
  </>
)

const handleSend = async () => {
  if (!inputValue.value) return

  suggests.value = []

  pending.value = true

  const userMsg = {
    id: '',
    key: `${Date.now()}0`,
    role: 'user',
    content: inputValue.value,
  }

  const assistantMsg = {
    id: '',
    key: `${Date.now()}1`,
    role: 'assistant',
    content: '',
  }

  chatItems.value.push(userMsg, assistantMsg)

  let lastScrollTop = chatListRef.value?.scrollTop || 0
  let stopAutoScroll = false

  const handleScroll = () => {
    const currectScrollTop = chatListRef.value?.scrollTop || 0

    if (currectScrollTop && currectScrollTop - lastScrollTop < 0) {
      chatListRef.value?.removeEventListener('scroll', handleScroll)
      stopAutoScroll = true
    }
    else {
      lastScrollTop = currectScrollTop
    }
  }

  chatListRef.value?.addEventListener('scroll', handleScroll)

  try {
    session.chatAborter = new AbortController()

    const res = await fetch(
      `${import.meta.env.VITE_CHAT_BASE}/chat-messages`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_CHAT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          conversation_id: session.sessionId,
          response_mode: 'streaming',
          query: inputValue.value,
          user: session.user,
          inputs: {},
        }),
        signal: session.chatAborter.signal,
      },
    )

    if (!res.ok) {
      const body = await new Response(res.body, { headers: { 'Content-Type': 'application/json' } }).json()
      console.error(body)
      throw new Error(`${res.status} ${body.message || res.statusText}`)
    }

    if (!session.sessionId) {
      session.updateSessions()
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder('utf-8')

    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 解析流数据
      const lines = buffer.split('\n')

      for (const line of lines) {
        const trimmed = line.trim()

        if (trimmed === '' || !trimmed.startsWith('data:')) {
          continue
        }

        let data = {} as any

        try {
          data = JSON.parse(trimmed.slice(5).trim())
        }
        // eslint-disable-next-line unused-imports/no-unused-vars
        catch (e) {}

        switch (data.event) {
          case 'message_end':
            if (!session.sessionId) {
              session.sessionId = data.conversation_id
              session.updateMessages(true)
            }
            pending.value = false
            inputValue.value = ''
            chatListRef.value?.removeEventListener('scroll', handleScroll)

            if (session.enableSuggestions) {
              fetchSuggestions(data.message_id)
                .then((res) => {
                  suggests.value = res.data
                })
            }
            break

          case 'message':
            {
              const text = assistantMsg.content + (data.answer || '')

              chatItems.value[chatItems.value.length - 1].content = text

              !stopAutoScroll && scrollToBottom()
            }
            break

          case 'error':
            throw new Error(data.message)
            break
        }
      }

      // 保留最后一行不完整的片段
      buffer = lines[lines.length - 1]
    }
  }
  catch (e: any) {
    chatListRef.value?.removeEventListener('scroll', handleScroll)
    chatItems.value.pop()
    pending.value = false

    if (e.name !== 'AbortError') {
      ElMessage.error(e.message)
    }
    console.error('消息流获取出错', e)
  }
}

defineRender(() => (
  <div
    v-loading={session.sessionLoading}
    class="chat-main"
  >
    <template v-if={session.sessionId || chatItems.value.length}>
      <ChatList />
      <ElDivider class="my-10 mx-60 w-a" />
    </template>
    <h2
      v-else
      class="mb-18 text-30 text-center"
    >
      Dify Chat
    </h2>

    <ChatInput />
  </div>
))
</script>

<style lang="scss">
.chat-main {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  width: 1000px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0px 0px 2px 0px rgba(0, 0, 0, 0.2);

  .el-loading-mask {
    border-radius: 16px;
  }
}

.chat-list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  padding: 32px 60px;

  .chat-item {
    &.chat-item-user {
      .chat-content {
        background: rgba(79, 70, 229, 0.1);
      }
    }

    &.chat-item-assistant {
      .chat-content {
        padding: 6px;
        max-width: calc(100% - 48px);
      }
    }

    .chat-avatar {
      height: 32px;
      width: 32px;
    }

    .chat-content {
      padding: 12px 16px;
      border-radius: 16px;
    }
  }
}

.chat-input {
  position: relative;
  display: flex;
  flex-direction: column;
  margin: 0 60px 24px;
  padding: 18px 16px 14px;
  border-radius: 16px;
  border: 1px solid #0000001a;
  box-shadow:
    0 10px 15px -3px #0000001a,
    0 4px 6px -4px #0000001a;

  .el-textarea {
    color: #000;
    flex: 1;

    .el-textarea__wrapper,
    .el-textarea__inner {
      font-size: 16px;
      padding: 0;
      background: transparent;
      box-shadow: none;
      border-radius: 0;
      border: none;
      transition: all 0.2s ease-in-out;
    }
  }
}
</style>
