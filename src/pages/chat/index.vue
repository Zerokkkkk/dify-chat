<script setup lang="tsx">
import Aside from './Aside.vue'
import Main from './Main.vue'

defineRender(() => (
  <div class="f-c-c py-24 px-12 h-full">
    <Aside class="mr-16" />
    <Main />
  </div>
))
</script>
