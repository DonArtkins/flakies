import Vue from 'vue';
import VueRouter from 'vue-router';
import store from '@/store';

Vue.use(VueRouter);

// Lazy load components for better performance
const LoginView = () => import('@/views/auth/LoginView.vue');
const DashboardView = () => import('@/views/dashboard/DashboardView.vue');
const PosView = () => import('@/views/sales/PosView.vue');
const InventoryView = () => import('@/views/inventory/InventoryView.vue');
const ProductDetailsView = () => import('@/views/inventory/ProductDetailsView.vue');
const TransactionsView = () => import('@/views/sales/TransactionsView.vue');
const BusinessSettingsView = () => import('@/views/settings/BusinessSettingsView.vue');
const UserManagementView = () => import('@/views/settings/UserManagementView.vue');
const SalesReportView = () => import('@/views/reports/SalesReportView.vue');

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { 
      layout: 'minimal-layout',
      requiresAuth: false 
    }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    meta: { 
      requiresAuth: true,
      title: 'Dashboard'
    }
  },
  {
    path: '/pos',
    name: 'POS',
    component: PosView,
    meta: { 
      requiresAuth: true,
      title: 'Point of Sale'
    }
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: InventoryView,
    meta: { 
      requiresAuth: true,
      title: 'Inventory Management'
    }
  },
  {
    path: '/inventory/product/:id',
    name: 'ProductDetails',
    component: ProductDetailsView,
    meta: { 
      requiresAuth: true,
      title: 'Product Details'
    }
  },
  {
    path: '/transactions',
    name: 'Transactions',
    component: TransactionsView,
    meta: { 
      requiresAuth: true,
      title: 'Transactions'
    }
  },
  {
    path: '/settings/business',
    name: 'BusinessSettings',
    component: BusinessSettingsView,
    meta: { 
      requiresAuth: true,
      title: 'Business Settings',
      permissions: ['admin']
    }
  },
  {
    path: '/settings/users',
    name: 'UserManagement',
    component: UserManagementView,
    meta: { 
      requiresAuth: true,
      title: 'User Management',
      permissions: ['admin']
    }
  },
  {
    path: '/reports/sales',
    name: 'SalesReport',
    component: SalesReportView,
    meta: { 
      requiresAuth: true,
      title: 'Sales Reports',
      permissions: ['admin', 'manager']
    }
  },
  {
    path: '*',
    redirect: '/'
  }
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

// Navigation guards
router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters['auth/isAuthenticated'];
  const userRole = store.getters['auth/userRole'];
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
    return;
  }
  
  // Check if route requires specific permissions
  if (to.meta.permissions && !to.meta.permissions.includes(userRole)) {
    next({ name: 'Dashboard' });
    return;
  }
  
  // Update document title
  if (to.meta.title) {
    document.title = `Flakies POS - ${to.meta.title}`;
  }
  
  next();
});

export default router;