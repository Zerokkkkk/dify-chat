import { fileURLToPath, URL } from 'node:url'

import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import Unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
// import DevTools from 'vite-plugin-vue-devtools'
import svgLoader from 'vite-svg-loader'
import VueMacros from 'vue-macros/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const {
    VITE_CHAT_BASE,
    VITE_PUBLIC_PATH,
  } = loadEnv(mode, __dirname)

  return {
    base: VITE_PUBLIC_PATH,
    plugins: [
      VueMacros({
        plugins: {
          vue: Vue(),
          vueJsx: VueJsx(),
        },
      }),
      AutoImport({
        dirsScanOptions: {
          types: false,
        },
        imports: [
          'vue',
        ],
        dts: './types/auto-imports.d.ts',
      }),
      Components({
        resolvers: [
          ElementPlusResolver(),
        ],
        include: [
          /\.vue\?vue/,
          /\.vue$/,
          /\.tsx/,
        ],
        extensions: [
          'tsx',
          'vue',
        ],
        dts: false,
      }),
      Unocss({
        // hmrTopLevelAwait: false,
        inspector: false,
      }),
      svgLoader(),
      // DevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/chat': {
          target: VITE_CHAT_BASE,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/chat/, ''),
        },
      },
    },
  }
})
