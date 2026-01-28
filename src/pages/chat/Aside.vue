<script setup lang="tsx">
import type { Session } from '@/service/chat'
import {
  Check,
  Close,
  Delete,
  Edit,
  MoreFilled,
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { NDropdown, NEllipsis } from 'naive-ui'
import { renameConversation } from '@/service/chat'
import { useSessionStore } from '@/stores/modules/session'

const session = useSessionStore()

session.updateSessions()

const titleValue = ref('')
const renameId = ref('')
const deletingId = ref('')

const handleRename = (item: Session) => {
  if (!titleValue.value) {
    renameId.value = ''
    return
  }

  renameConversation(item.id, titleValue.value)
    .then(async () => {
      await session.updateSessions()
      titleValue.value = ''
      renameId.value = ''
    })
}

defineRender(() => (
  <aside class="session-aside">
    <ElButton
      type="primary"
      size="large"
      class="w-full"
      onClick={() => {
        session.chatAborter?.abort()
        session.clearMessages()
      }}
    >
      新建问答
    </ElButton>

    <h4 class="leading-24">历史记录</h4>
    <ul class="flex-col flex-1 overflow-y-auto">
      {session.sessions.map(item => (
        <li
          key={item.id}
          class={{
            'session-item': true,
            'active': session.sessionId === item.id || renameId.value === item.id,
            'disabled': deletingId.value === item.id,
          }}
          onClick={() => {
            if (deletingId.value === item.id || renameId.value === item.id) {
              return
            }

            session.chatAborter?.abort()
            session.sessionId = item.id
            session.updateMessages()
          }}
        >
          <template v-if={renameId.value !== item.id}>
            <span class="w-[calc(100%-30px)]">
              <h4 class="mb-4 text-[#4B5563] leading-20">
                <NEllipsis>
                  {item.name}
                </NEllipsis>
              </h4>
              <p class="text-12 text-[#9CA3AF] leading-16">
                {dayjs(item.created_at * 1000).format('YYYY-MM-DD HH:mm:ss')}
              </p>
            </span>
            <span
              onClick={(ev) => {
                ev.stopPropagation()
              }}
            >
              <NDropdown
                trigger="click"
                options={[
                  {
                    label: '重命名',
                    key: 'rename',
                    icon: () => <ElIcon size={16}><Edit /></ElIcon>,
                  },
                  {
                    label: '删除',
                    key: 'delete',
                    icon: () => <ElIcon size={16}><Delete /></ElIcon>,
                  },
                ]}
                onSelect={(v) => {
                  switch (v) {
                    case 'rename':
                      titleValue.value = item.name
                      renameId.value = item.id
                      break

                    case 'delete':
                      deletingId.value = item.id
                      session.deleteSession(item.id, true)
                        .finally(() => {
                          if (deletingId.value === item.id) {
                            deletingId.value = ''
                          }
                        })
                      break
                  }
                }}
              >
                <ElIcon class="box-content hover:bg-[#bec0c5] p-4 rounded-3xl">
                  <MoreFilled />
                </ElIcon>
              </NDropdown>
            </span>
          </template>

          <template v-else>
            <ElInput
              maxlength={50}
              v-model={titleValue.value}
              placeholder="请输入标题"
              // @ts-ignore
              onKeydown_enter={() => handleRename(item)}
            />
            <span class="ml-10 f-c-c gap-4 hover:*:color-[var(--el-color-primary)]">
              <ElIcon
                size={16}
                // @ts-ignore
                onClick={() => handleRename(item)}
              >
                <Check />
              </ElIcon>
              <ElIcon
                size={16}
                // @ts-ignore
                onClick_stop={() => {
                  renameId.value = ''
                }}
              >
                <Close />
              </ElIcon>
            </span>
          </template>
        </li>
      ))}
      {session.sessions.length === 0 && (
        <ElEmpty
          class="m-auto"
        />
      )}
    </ul>
  </aside>
))
</script>

<style lang="scss">
.session-aside {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  height: 100%;
  width: 256px;
  flex-shrink: 0;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0px 0px 2px 0px rgba(0, 0, 0, 0.2);

  * {
    transition: all 0.3s ease;
  }
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;

  cursor: pointer;
  margin-bottom: 8px;
  padding: 8px 12px;
  border-radius: var(--el-border-radius-base);

  &:hover,
  &.active {
    background: #f1f1f1;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  :deep(.el-input__wrapper) {
    box-shadow: none;
    border: none;
  }
}
</style>
