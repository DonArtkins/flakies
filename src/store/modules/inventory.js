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
      commit('SET_ERROR', error.response?.data?.message || 'Faile