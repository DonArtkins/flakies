import Vue from 'vue';
import inventoryService from '@/services/inventory.service';

const state = {
  products: [],
  categories: [],
  loading: false,
  error: null,
  productStock: {}, // Map of product ID to stock count
  lowStockThreshold: 10 // Default low stock threshold
};

const getters = {
  allProducts: state => state.products,
  
  productById: state => id => {
    return state.products.find(product => product.id === id);
  },
  
  productCategories: state => state.categories,
  
  productStock: state => productId => {
    return state.productStock[productId] || 0;
  },
  
  lowStockProducts: state => {
    return state.products.filter(product => {
      const stock = state.productStock[product.id] || 0;
      return stock <= state.lowStockThreshold;
    });
  },
  
  isLoading: state => state.loading,
  
  errorMessage: state => state.error
};

const mutations = {
  SET_PRODUCTS(state, products) {
    state.products = products;
  },
  
  SET_CATEGORIES(state, categories) {
    state.categories = categories;
  },
  
  ADD_PRODUCT(state, product) {
    state.products.push(product);
  },
  
  UPDATE_PRODUCT(state, updatedProduct) {
    const index = state.products.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      state.products.splice(index, 1, updatedProduct);
    }
  },
  
  DELETE_PRODUCT(state, productId) {
    state.products = state.products.filter(p => p.id !== productId);
  },
  
  SET_PRODUCT_STOCK(state, { productId, stock }) {
    Vue.set(state.productStock, productId, stock);
  },
  
  SET_LOW_STOCK_THRESHOLD(state, threshold) {
    state.lowStockThreshold = threshold;
  },
  
  SET_LOADING(state, status) {
    state.loading = status;
  },
  
  SET_ERROR(state, error) {
    state.error = error;
  }
};

const actions = {
  async fetchProducts({ commit, rootState }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      if (rootState.offlineMode) {
        // Load from local storage if offline
        const storedProducts = localStorage.getItem('flakies-products');
        if (storedProducts) {
          commit('SET_PRODUCTS', JSON.parse(storedProducts));
          commit('SET_LOADING', false);
          return;
        }
      }
      
      const response = await inventoryService.getProducts();
      const products = response.data;
      
      // Store in local storage for offline access
      localStorage.setItem('flakies-products', JSON.stringify(products));
      
      commit('SET_PRODUCTS', products);
      
      // Initialize stock for each product
      products.forEach(product => {
        commit('SET_PRODUCT_STOCK', { 
          productId: product.id, 
          stock: product.stock 
        });
      });
      
      commit('SET_LOADING', false);
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch products');
      commit('SET_LOADING', false);
      throw error;
    }
  },
  
  async fetchCategories({ commit, rootState }) {
    commit('SET_LOADING', true);
    
    try {
      if (rootState.offlineMode) {
        // Load from local storage if offline
        const storedCategories = localStorage.getItem('flakies-categories');
        if (storedCategories) {
          commit('SET_CATEGORIES', JSON.parse(storedCategories));
          commit('SET_LOADING', false);
          return;
        }
      }
      
      const response = await inventoryService.getCategories();
      const categories = response.data;
      
      // Store for offline access
      localStorage.setItem('flakies-categories', JSON.stringify(categories));
      
      commit('SET_CATEGORIES', categories);
      commit('SET_LOADING', false);
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch categories');
      commit('SET_LOADING', false);
      throw error;
    }
  },
  
  async addProduct({ commit }, product) {
    commit('SET_LOADING', true);
    
    try {
      const response = await inventoryService.addProduct(product);
      const newProduct = response.data;
      
      commit('ADD_PRODUCT', newProduct);
      commit('SET_PRODUCT_STOCK', { 
        productId: newProduct.id, 
        stock: newProduct.stock 
      });
      
      commit('SET_LOADING', false);
      return newProduct;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to add product');
      commit('SET_LOADING', false);
      throw error;
    }
  },
  
  async updateProduct({ commit }, product) {
    commit('SET_LOADING', true);
    
    try {
      const response = await inventoryService.updateProduct(product);
      const updatedProduct = response.data;
      
      commit('UPDATE_PRODUCT', updatedProduct);
      commit('SET_PRODUCT_STOCK', { 
        productId: updatedProduct.id, 
        stock: updatedProduct.stock 
      });
      
      commit('SET_LOADING', false);
      return updatedProduct;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to update product');
      commit('SET_LOADING', false);
      throw error;
    }
  },
  
  async deleteProduct({ commit }, productId) {
    commit('SET_LOADING', true);
    
    try {
      await inventoryService.deleteProduct(productId);
      
      commit('DELETE_PRODUCT', productId);
      commit('SET_LOADING', false);
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to delete product');
      commit('SET_LOADING', false);
      throw error;
    }
  },
  
  async updateStock({ commit }, { productId, quantity, type }) {
    commit('SET_LOADING', true);
    
    try {
      const response = await inventoryService.updateStock(productId, quantity, type);
      const newStock = response.data.stock;
      
      commit('SET_PRODUCT_STOCK', { productId, stock: newStock });
      
      // Also update the product in the products array
      const product = state.products.find(p => p.id === productId);
      if (product) {
        const updatedProduct = { ...product, stock: newStock };
        commit('UPDATE_PRODUCT', updatedProduct);
      }
      
      commit('SET_LOADING', false);
      return newStock;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to update stock');
      commit('SET_LOADING', false);
      throw error;
    }
  },
  
  setLowStockThreshold({ commit }, threshold) {
    commit('SET_LOW_STOCK_THRESHOLD', threshold);
    // Save to settings or user preferences
    localStorage.setItem('flakies-low-stock-threshold', threshold);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};