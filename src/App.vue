<script setup lang="tsx">
import el_zh from 'element-plus/es/locale/lang/zh-cn'
import Chat from './pages/chat/index.vue'

defineRender(() => (
  <ElConfigProvider
    locale={el_zh}
  >
    <Chat />
  </ElConfigProvider>
))
</script>

<style lang="scss">
html,
body,
#app {
  height: 100%;
  min-height: 600px;
  min-width: 800px;
  background-color: #f4f4f4;
}
</style>
