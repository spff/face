import Vue from 'vue'
import App from './App'
import router from './router'

import 'normalize.css'

Vue.config.productionTip = false

const layers = ['background', 'hair_back', 'body', 'ears', 'clothes', 'face', 'blush_n_beard', 'nose', 'eyes', 'mouth', 'hair_front', 'eyebrows', 'glasses']
const layerMap = new Map()
layers.forEach((it, index) => { layerMap.set(it, index) })

const options = [
  ['face', '01', true],
  ['eyebrows', null, true],
  ['eyes', '01', true],
  ['nose', null, true],
  ['mouth', '01', true],
  ['hair', '01', true, ['hair_back', 'hair_front']],
  ['clothes', null, true],
  ['accessories', null, true, ['blush_n_beard', 'glasses']],
  ['background', null, true],
  ['body', '01', false],
  ['ears', '01', false]
]

const optionMap = new Map()
options.forEach((it, index) => {
  optionMap.set(
    it[0],
    {
      key: it[0],
      index: index,
      default: it[1],
      showInOption: it[2],
      target: (it[3] == null) ? [it[0]] : it[3]
    }
  )
})

Vue.prototype.sortedLayerMap = layerMap
Vue.prototype.sortedOptionMap = optionMap
console.log(Vue.prototype.sortedLayerMap)
console.log(Vue.prototype.sortedOptionMap)

Vue.prototype.getRender = (path) => {
  try {
    // https://vuejs-templates.github.io/webpack/static.html
    // Note this will include every image under ./assets/render/ in the final build. This is because Webpack cannot guess which of them will be used at runtime, so it includes them all.
    return require('@/assets/render/' + path)
  } catch (e) {
    return null
  }
}

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
