import Vue from 'vue';
import paymentService from '@/services/payment.service';

const state = {
  cart: {
    items: [],
    taxRate: 0.16 // 16% VAT in Kenya
  },
  transactions: [],
  offlineTransactions: [], // For offline mode
  loading: false,
  error: null
};

const getters = {
  cartItems: state => state.cart.items,
  hasItems: state => state.cart.items.length > 0,
  itemCount: state => state.cart.items.reduce((sum, item) => sum + item.quantity, 0),
  
  subtotal: state => {
    return state.cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },
  
  tax: (state, getters) => {
    return getters.subtotal * state.cart.taxRate;
  },
  
  discount: state => {
    // Implement discount logic here
    return 0;
  },
  
  total: (state, getters) => {
    return getters.subtotal + getters.tax - getters.discount;
  },
  
  recentTransactions: state => state.transactions.slice(0, 10)
};

const mutations = {
  ADD_ITEM(state, item) {
    // Check if item already exists in cart
    const existingItem = state.cart.items.find(i => i.id === item.id);
    
    if (existingItem) {
      // Update quantity
      existingItem.quantity += item.quantity;
    } else {
      // Add new item
      state.cart.items.push(item);
    }
  },
  
  UPDATE_ITEM_QUANTITY(state, { index, quantity }) {
    if (index >= 0 && index < state.cart.items.length) {
      state.cart.items[index].quantity = quantity;
    }
  },
  
  REMOVE_ITEM(state, index) {
    if (index >= 0 && index < state.cart.items.length) {
      state.cart.items.splice(index, 1);
    }
  },
  
  RESET_CART(state) {
    state.cart.items = [];
  },
  
  SET_LOADING(state, status) {
    state.loading = status;
  },
  
  SET_ERROR(state, error) {
    state.error = error;
  },
  
  ADD_TRANSACTION(state, transaction) {
    state.transactions.unshift(transaction);
  },
  
  ADD_OFFLINE_TRANSACTION(state, transaction) {
    state.offlineTransactions.push(transaction);
  },
  
  REMOVE_OFFLINE_TRANSACTION(state, index) {
    state.offlineTransactions.splice(index, 1);
  }
};

const actions = {
  addItemToCart({ commit }, item) {
    commit('ADD_ITEM', item);
  },
  
  updateItemQuantity({ commit }, payload) {
    commit('UPDATE_ITEM_QUANTITY', payload);
  },
  
  removeItemFromCart({ commit }, index) {
    commit('REMOVE_ITEM', index);
  },
  
  resetCart({ commit }) {
    commit('RESET_CART');
  },
  
  async processTransaction({ commit, getters, rootState }, payload) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    const transaction = {
      items: payload.items,
      subtotal: payload.subtotal,
      tax: payload.tax,
      discount: payload.discount,
      total: payload.total,
      paymentMethod: payload.paymentMethod,
      customer: payload.customer,
      timestamp: new Date().toISOString(),
      businessId: rootState.auth.user?.businessId,
      userId: rootState.auth.user?.id,
      status: 'completed',
      reference: payload.paymentReference || null
    };
    
    try {
      if (rootState.offlineMode) {
        // Save transaction for later sync
        transaction.id = Date.now().toString();
        transaction.synced = false;
        commit('ADD_OFFLINE_TRANSACTION', transaction);
        commit('ADD_TRANSACTION', transaction);
        commit('SET_LOADING', false);
        return transaction;
      }
      
      // Process transaction through API
      const response = await paymentService.processTransaction(transaction);
      const processedTransaction = response.data;
      
      commit('ADD_TRANSACTION', processedTransaction);
      commit('SET_LOADING', false);
      return processedTransaction;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Transaction failed');
      commit('SET_LOADING', false);
      throw error;
    }
  },
  
  async syncOfflineTransactions({ commit, state, rootState }) {
    if (state.offlineTransactions.length === 0 || rootState.offlineMode) {
      return;
    }
    
    // Clone the transactions to avoid mutations during iteration
    const transactions = [...state.offlineTransactions];
    
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      
      try {
        // Sync with server
        const response = await paymentService.processTransaction(transaction);
        const syncedTransaction = response.data;
        
        // Update the transaction in the main list
        const index = state.transactions.findIndex(t => t.id === transaction.id);
        if (index !== -1) {
          Vue.set(state.transactions, index, syncedTransaction);
        }
        
        // Remove from offline list
        commit('REMOVE_OFFLINE_TRANSACTION', i);
        i--; // Adjust index after removal
      } catch (error) {
        console.error('Failed to sync transaction:', error);
        // Will try again later
      }
    }
  },
  
  async fetchTransactions({ commit }) {
    commit('SET_LOADING', true);
    
    try {
      const response = await paymentService.getTransactions();
      const transactions = response.data;
      
      // Replace all transactions
      state.transactions = transactions;
      
      commit('SET_LOADING', false);
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch transactions');
      commit('SET_LOADING', false);
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