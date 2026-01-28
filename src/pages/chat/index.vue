<script setup lang="tsx">
import { ElMessageBox } from 'element-plus'
import { useSessionStore } from '@/stores/modules/session'
import Aside from './Aside.vue'
import Main from './Main.vue'

const session = useSessionStore()

// 检查 API Key，如果没有则弹窗让开发者输入
onMounted(async () => {
  if (!session.apiKey) {
    try {
      const { value } = await ElMessageBox.prompt(
        '请输入用于调用 Dify 后端服务 API 的 API Key',
        '缺少 API Key',
        {
          inputPlaceholder: 'app-xxx',
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputType: 'password',
        },
      )

      if (value) {
        session.setApiKey(value)
        await session.updateSessions()
      }
    }
    catch {
      // 取消输入，不设置 API Key
    }
  }
  else {
    // 有环境变量，直接拉取会话
    await session.updateSessions()
  }
})

defineRender(() => (
  <div class="f-c-c py-24 px-12 h-full">
    <Aside class="mr-16" />
    <Main />
  </div>
))
</script>
