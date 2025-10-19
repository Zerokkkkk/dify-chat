<script setup lang="tsx">
import { Close, FullScreen } from '@element-plus/icons-vue'
import { NFloatButton } from 'naive-ui'
import { fetchSuggestions } from '@/service'
import Assi from '@/shared/assets/icons/avatar-assi.svg'
import User from '@/shared/assets/icons/avatar-user.svg'
import Robot from '@/shared/assets/icons/robot.svg'
import Send from '@/shared/assets/icons/send.svg'
import Stop from '@/shared/assets/icons/stop.svg'
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
    class={{
      'chat-list': true,
      '!py-2vh !px-25vw !gap-32': fullScreen.value,
    }}
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
        class="flex gap-10"
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

        <template v-if={item.content !== ''}>
          <MarkdownViewer
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
        </template>
      </div>
    </li>
  </div>
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
      `https://api.dify.ai/v1/chat-messages`,
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
      throw new Error(`${res.status} ${res.statusText}`)
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
            }
            pending.value = false
            inputValue.value = ''
            session.updateMessages()
            chatListRef.value?.removeEventListener('scroll', handleScroll)

            fetchSuggestions(
              { user: session.user },
              { message_id: data.message_id },
            ).then((res) => {
              suggests.value = res.data
            })
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
  catch (e) {
    chatListRef.value?.removeEventListener('scroll', handleScroll)
    chatItems.value.pop()
    pending.value = false

    console.error('消息流获取出错', e)
  }
}

const showBackBottom = ref(false)
const inputValue = ref('')

const ChatFooter = () => (
  <div
    class={{
      'chat-footer': true,
      '!px-25vw': fullScreen.value,
    }}
  >
    <div class="flex gap-12 pl-16 pt-12 *:w-a">
      <ElCheckTag
        checked
        class="!bg-[#22d3ee1a] !text-#22d3ee rounded-32"
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
      <ElInput
        type="textarea"
        resize="none"
        autosize={{
          minRows: 1,
          maxRows: 5,
        }}
        placeholder="有什么可以帮您的？"
        maxlength={10000}
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

      <div class="f-e-c h-36 *:!p-0">
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
          class="!bg-[#22D3EE] !border-none !text-black"
          disabled={!inputValue.value || pending.value}
          onClick={handleSend}
        >
          <Send />
        </ElButton>
      </div>
    </div>
  </div>
)

const fullScreen = ref(false)
const visible = ref(false)

defineRender(() => (
  <ElPopover
    popperClass="!w-auto !p-0 !shadow-none"
    trigger="click"
    placement="left-end"
    showArrow={false}
    visible={visible.value}
  >
    <template v-slot:reference>
      <NFloatButton
        class="bg-[var(--el-color-primary)]"
        bottom={24}
        right={24}
        // @ts-ignore
        onClick={() => (visible.value = !visible.value)}
      >
        <ElIcon
          color="#fff"
          size={18}
        >
          <Robot />
        </ElIcon>
      </NFloatButton>
    </template>

    <div class={{
      'chat-wrapper': true,
      'fixed inset-0 !w-100vw !h-100vh': fullScreen.value,
    }}
    >
      <div class="chat-header">
        <div class="text-#22D3EE text-20 font-bold">资产问答</div>

        <div>
          <ElButton
            circle
            icon={FullScreen}
            class="!bg-[rgba(34,211,238,0.2)] !border-none !color-#22D3EE"
            onClick={() => (fullScreen.value = !fullScreen.value)}
          />
          <ElButton
            circle
            icon={Close}
            class="!bg-[rgba(34,211,238,0.2)] !border-none !color-#22D3EE"
            onClick={() => (visible.value = false)}
          />
        </div>
      </div>

      <ChatList />

      <ChatFooter />
    </div>
  </ElPopover>
))
</script>

<style scoped lang="scss">
.chat-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 500px;
  height: 800px;
  border: 1px solid #5eead44d;
  backdrop-filter: blur(10px);
  background: rgba(15, 23, 42, 0.7);
  box-shadow: 0 4px 30px 0 rgba(0, 0, 0, 0.1);

  .el-loading-mask {
    border-radius: 16px;
  }
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 16px;
  line-height: 28px;
  border-bottom: 0.76px solid #22d3ee4d;
}

:deep(.chat-list) {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  padding: 16px;

  .chat-item {
    .chat-avatar {
      height: 32px;
      width: 32px;
    }

    .chat-content {
      color: #fff;
      padding: 16px;
      width: auto;
      border-radius: 18px;

      &:empty {
        padding: 0;
      }
    }

    &.chat-item-user {
      .chat-content {
        border-top-right-radius: 0;
        background: rgba(100, 149, 237, 0.2);
      }
    }

    &.chat-item-assistant {
      .chat-content {
        border-top-left-radius: 0;
        background: rgba(144, 238, 144, 0.2);
      }
    }
  }
}

:deep(.chat-footer) {
  .chat-input {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;

    .el-textarea__inner {
      color: #fff;
      flex: 1;
      padding: 10px;
      line-height: 20px;
      border: 1px solid #22d3ee4d;
      border-radius: 16px;
      background: #0f172ab3;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 30px 0 #0000001a;
      transition: height 0.3s ease;
    }
  }
}
</style>
