import Vue from 'vue';
import Router from 'vue-router';
import ImagesRate from './views/ImagesRate.vue';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'imagesRate',
      component: ImagesRate,
    },
  ],
});
