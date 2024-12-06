import {createApp } from 'vue'
import './style.css'
import App from './App.vue'

import { createPinia, PiniaVuePlugin } from 'pinia'
import router from './router';

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { md3 } from 'vuetify/blueprints'


const vuetify = createVuetify({
    components,
    directives,
    blueprint: md3,
})
  
const pinia = createPinia();

const app = createApp(App);
app.use(vuetify)
app.use(router)
app.use(createPinia())
app.mount('#app')
