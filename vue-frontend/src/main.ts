import { createApp } from 'vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faCopy, faHouse, faLightbulb } from '@fortawesome/free-regular-svg-icons'
import {
  faArrowLeft,
  faArrowRight,
  faArrowUpRightFromSquare,
  faCheck,
  faCircleExclamation,
  faPen,
  faPrint,
  faSpinner,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import './assets/index.css'
import './assets/print.css'
import router from './router'

library.add(
  faPen,
  faTriangleExclamation,
  faCircleExclamation,
  faLightbulb,
  faArrowRight,
  faArrowLeft,
  faPrint,
  faArrowUpRightFromSquare,
  faHouse,
  faCheck,
  faCopy,
  faSpinner,
)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate) // localStorage自動永続化
const app = createApp(App)
app.component('FontAwesomeIcon', FontAwesomeIcon)
app.use(router)
app.use(pinia)
app.mount('#app')
