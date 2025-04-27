import authService from '@/services/auth.service';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

const state = {
  user: null,
  token: null,
  loading: false,
  error: null
};

const getters = {
  isAuthenticated: (state) => !!state.token,
  currentUser: (state) => state.user,
  userRole: (state) => state.user ? state.user.role : null,
  token: (state) => state.token,
  authError: (state) => state.error,
  isAuthLoading: (state) => state.loading
};

const mutations = {
  AUTH_REQUEST(state) {
    state.loading = true;
    state.error = null;
  },
  AUTH_SUCCESS(state, { user, token }) {
    state.loading = false;
    state.user = user;
    state.token = token;
    state.error = null;
  },
  AUTH_ERROR(state, error) {
    state.loading = false;
    state.error = error;
  },
  LOGOUT(state) {
    state.user = null;
    state.token = null;
  },
  UPDATE_USER(state, user) {
    state.user = { ...state.user, ...user };
  }
};

const actions = {
  async login({ commit }, credentials) {
    commit('AUTH_REQUEST');
    try {
      const response = await authService.login(credentials);
      const { user, token } = response.data;
      
      // Store the JWT token for API calls
      localStorage.setItem('flakies-token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      commit('AUTH_SUCCESS', { user, token });
      return user;
    } catch (error) {
      commit('AUTH_ERROR', error.response?.data?.message || 'Authentication failed');
      localStorage.removeItem('flakies-token');
      throw error;
    }
  },
  
  async register({ commit }, userData) {
    commit('AUTH_REQUEST');
    try {
      const response = await authService.register(userData);
      const { user, token } = response.data;
      
      localStorage.setItem('flakies-token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      commit('AUTH_SUCCESS', { user, token });
      return user;
    } catch (error) {
      commit('AUTH_ERROR', error.response?.data?.message || 'Registration failed');
      throw error;
    }
  },
  
  logout({ commit }) {
    // Remove JWT token from storage and headers
    localStorage.removeItem('flakies-token');
    delete axios.defaults.headers.common['Authorization'];
    
    commit('LOGOUT');
  },
  
  checkAuth({ commit, state }) {
    // Check if we have a token stored
    const token = localStorage.getItem('flakies-token') || state.token;
    
    if (!token) {
      return;
    }
    
    try {
      // Verify token expiration
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        // Token expired
        commit('LOGOUT');
        localStorage.removeItem('flakies-token');
        return;
      }
      
      // Token still valid - restore auth state
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch current user info if we don't have it
      if (!state.user) {
        authService.getCurrentUser().then(response => {
          commit('AUTH_SUCCESS', { 
            user: response.data.user, 
            token 
          });
        }).catch(() => {
          commit('LOGOUT');
          localStorage.removeItem('flakies-token');
        });
      }
    } catch (error) {
      // Invalid token format
      commit('LOGOUT');
      localStorage.removeItem('flakies-token');
    }
  },
  
  async updateProfile({ commit }, userData) {
    try {
      const response = await authService.updateProfile(userData);
      commit('UPDATE_USER', response.data.user);
      return response.data.user;
    } catch (error) {
      throw error;
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};