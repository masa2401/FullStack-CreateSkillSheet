import { createApp } from 'vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faClipboard,
  faCopy,
  faHandPointer,
  faHouse,
  faLightbulb,
} from '@fortawesome/free-regular-svg-icons'
import {
  faArrowLeft,
  faArrowRight,
  faArrowUpRightFromSquare,
  faBriefcase,
  faCheck,
  faCircleExclamation,
  faComputer,
  faFileCsv,
  faMagnifyingGlass,
  faPalette,
  faPen,
  faPenToSquare,
  faPrint,
  faSpinner,
  faSquarePollVertical,
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
  faPenToSquare,
  faPen,
  faHandPointer,
  faComputer,
  faPalette,
  faTriangleExclamation,
  faCircleExclamation,
  faLightbulb,
  faArrowRight,
  faBriefcase,
  faSquarePollVertical,
  faArrowLeft,
  faPrint,
  faArrowUpRightFromSquare,
  faClipboard,
  faHouse,
  faCheck,
  faCopy,
  faFileCsv,
  faMagnifyingGlass,
  faSpinner,
)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate) // localStorage自動永続化
const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.use(router)
app.use(pinia)
app.mount('#app')
