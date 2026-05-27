import 'font-awesome-animation/css/font-awesome-animation.min.css';
import './assets/common.css';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

import {
  faPenToSquare,
  faPen,
  faComputer,
  faPalette,
  faTriangleExclamation,
  faCircleExclamation,
  faArrowRight,
  faCheck,
  faArrowLeft,
  faPrint,
  faArrowUpRightFromSquare,
  faBriefcase,
  faSquarePollVertical,
  faFileCsv,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import {
  faHandPointer,
  faLightbulb,
  faClipboard,
  faHouse,
  faCopy,
} from '@fortawesome/free-regular-svg-icons';

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
);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate); // localStorage自動永続化
const app = createApp(App);
app.component('font-awesome-icon', FontAwesomeIcon);
app.use(router);
app.use(pinia);
app.mount('#app');
