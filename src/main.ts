import { createApp } from 'vue'
import Root from './App.vue'

import loadPlugins from './plugins'
import { store } from './stores'

import './styles/index.scss'

const app = createApp(Root)

loadPlugins(app)

app.use(store)
app.mount('#app')
