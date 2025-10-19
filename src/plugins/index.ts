import type { App } from 'vue'
import loadComponents from './component'

import 'virtual:uno.css'

export default (app: App) => {
  loadComponents(app)
}
