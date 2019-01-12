import Vue from 'vue'
import App from './App'
import router from './router'

Vue.config.productionTip = false

Vue.prototype.order = [
  'background', 'hair_back', 'body', 'cloths', 'nose', 'eyes', 'mouth', 'hair_front', 'eyebrows'
]

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
