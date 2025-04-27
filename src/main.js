import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './plugins/vuetify';
import './assets/styles/global.css';
import i18n from './plugins/i18n';

// Configure axios for API calls
import axios from 'axios';
axios.defaults.baseURL = process.env.VUE_APP_API_URL || 'http://localhost:5000/api';

// Add JWT token to requests if available
axios.interceptors.request.use(config => {
  const token = store.getters['auth/token'];
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle offline mode
window.addEventListener('online', () => {
  store.dispatch('sales/syncOfflineTransactions');
});

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  i18n,
  render: h => h(App)
}).$mount('#app');