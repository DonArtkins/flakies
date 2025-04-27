import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';

// Import modules
import auth from './modules/auth';
import sales from './modules/sales';
import inventory from './modules/inventory';
import ai from './modules/ai';

Vue.use(Vuex);

// Create store with modules
export default new Vuex.Store({
  modules: {
    auth,
    sales,
    inventory,
    ai
  },
  // Global state for app-wide concerns
  state: {
    appReady: false,
    businessType: null, // 'restaurant', 'retail', 'hotel'
    offlineMode: false,
    appVersion: '1.0.0',
    theme: 'light',
    language: 'en'
  },
  getters: {
    isOffline: state => state.offlineMode,
    currentBusinessType: state => state.businessType,
    appLanguage: state => state.language
  },
  mutations: {
    SET_APP_READY(state, value) {
      state.appReady = value;
    },
    SET_BUSINESS_TYPE(state, type) {
      state.businessType = type;
    },
    SET_OFFLINE_MODE(state, status) {
      state.offlineMode = status;
    },
    SET_THEME(state, theme) {
      state.theme = theme;
    },
    SET_LANGUAGE(state, lang) {
      state.language = lang;
    }
  },
  actions: {
    initializeApp({ commit, dispatch }) {
      // Check network status
      commit('SET_OFFLINE_MODE', !navigator.onLine);
      
      // Load business settings
      dispatch('loadBusinessSettings');
      
      // Mark app as ready
      commit('SET_APP_READY', true);
    },
    loadBusinessSettings({ commit }) {
      // This would typically fetch from API, but for now we'll use localStorage
      const savedSettings = localStorage.getItem('flakies-business-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        commit('SET_BUSINESS_TYPE', settings.businessType);
      }
    },
    changeLanguage({ commit }, lang) {
      localStorage.setItem('flakies-language', lang);
      commit('SET_LANGUAGE', lang);
    },
    changeTheme({ commit }, theme) {
      localStorage.setItem('flakies-theme', theme);
      commit('SET_THEME', theme);
    }
  },
  // Use persisted state for offline capability
  plugins: [
    createPersistedState({
      key: 'flakies-pos',
      paths: ['auth.user', 'auth.token', 'sales.cart', 'sales.offlineTransactions', 'appVersion', 'businessType', 'language', 'theme']
    })
  ]
});