import { createRouter, createWebHistory } from 'vue-router';
import ScatterPlot from './components/ScatterPlot.vue';
import DetailPlot from './components/DetailPlot.vue';

const routes = [
  { path: '/', name: 'Home', component: ScatterPlot },
  { path: '/details/:genre', name: 'DetailPlot', component: DetailPlot, props: true },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;