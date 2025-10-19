import presetRemToPx from '@unocss/preset-rem-to-px'
import {
  defineConfig,
  presetAttributify,
  presetTagify,
  presetUno,
} from 'unocss'

export default defineConfig({
  presets: [
    presetAttributify(),
    presetTagify(),
    presetUno(),
    // @ts-ignore
    presetRemToPx({
      baseFontSize: 4,
    }),
  ],
  shortcuts: [
    ['f-c-c', 'flex justify-center items-center'],
    ['f-b-c', 'flex justify-between items-center'],
    ['f-s-c', 'flex justify-start items-center'],
    ['f-e-c', 'flex justify-end items-center'],
    ['flex-col', 'flex flex-col'],
    ['wh-full', 'w-full h-full'],
  ],
})
