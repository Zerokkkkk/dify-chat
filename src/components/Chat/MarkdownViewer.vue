<script setup lang="tsx">
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import { nextTick, ref, watch } from 'vue'
import 'highlight.js/styles/github.css'

const props = defineProps<{
  content: string
}>()

const htmlContent = ref('')

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    },
  }),
)

watch(
  () => props.content,
  async (newContent) => {
    const dirtyHtml = marked.parse(newContent || '', { async: false })
    htmlContent.value = DOMPurify.sanitize(dirtyHtml)

    await nextTick()
    addCopyButtons()
  },
  { immediate: true },
)

function addCopyButtons() {
  const codeBlocks = document.querySelectorAll('.markdown-body pre')

  codeBlocks.forEach((pre) => {
    if (pre.querySelector('.copy-btn')) return

    const div = document.createElement('div')
    div.className = 'code-tools-wrapper'

    pre.prepend(div)

    const codeEl = pre.querySelector('code')
    const langMatch = codeEl?.className.match(/language-(\w+)/)
    if (langMatch) {
      const langTag = document.createElement('div')
      langTag.className = 'language-tag'
      langTag.textContent = langMatch[1]
      div.appendChild(langTag)
    }

    const cpBtn = document.createElement('button')
    cpBtn.className = 'copy-btn'
    cpBtn.textContent = '复制'
    cpBtn.onclick = () => {
      const code = pre.querySelector('code')?.textContent || ''
      navigator.clipboard.writeText(code).then(() => {
        cpBtn.textContent = '已复制'
        setTimeout(() => {
          cpBtn.textContent = '复制'
        }, 2000)
      })
    }
    div.appendChild(cpBtn)
  })
}

defineRender(() => (
  <div
    class="markdown-body"
    v-html={htmlContent.value}
    onClick={(ev) => {
      if ((ev.target as HTMLElement).tagName === 'A') {
        ev.preventDefault()
        window.open((ev.target as HTMLElement).getAttribute('href')!)
      }
    }}
  />
))
</script>

<style lang="scss">
.markdown-body {
  pre {
    position: relative;
    padding: 42px 12px 12px;
    border-radius: 12px;
    background: #f9f9f9;
    border: 1px solid #00000026;

    code {
      overflow: auto;
      display: block;
    }
  }

  .code-tools-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    padding: 10px 14px;
    background: #f6f8fa;
    border-radius: 12px 12px 0 0;
  }

  .language-tag {
    color: #fff;
    font-size: 12px;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.5);
  }

  .copy-btn {
    cursor: pointer;
    color: #fff;
    font-size: 12px;
    margin-left: auto;
    padding: 4px 8px;
    opacity: 0.8;
    border: none;
    border-radius: 4px;
    background: var(--el-color-primary);
  }
}
</style>
