import { createApp } from 'vue'
import App from './App.vue'
// import router from './router'

// import Vuep from 'vuep'
// import 'vuep/dist/vuep.css'

// import Example from './components/Example.vue'
import VueSlider from '../lib/VueSlider.vue'
import { getTheme } from './utils'

const theme = getTheme()
switch (theme) {
  case 'antd':
    import('../lib/theme/antd.scss')
    break
  case 'material':
    import('../lib/theme/material.scss')
    break
  default:
    import('../lib/theme/default.scss')
}

const app = createApp(App)

app
  // .component('Example', Example)
  .component('VueSlider', VueSlider)
  // .use(router)
  .mount('#app')
