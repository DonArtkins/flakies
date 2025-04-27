<template>
  <v-app>
    <component :is="layout">
      <router-view />
    </component>
    <notification-center />
  </v-app>
</template>

<script>
import NotificationCenter from '@/components/common/NotificationCenter.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import MinimalLayout from '@/layouts/MinimalLayout.vue';

export default {
  name: 'App',
  components: {
    NotificationCenter,
    DefaultLayout,
    MinimalLayout
  },
  computed: {
    layout() {
      // Determine which layout to use based on route metadata
      const layout = this.$route.meta.layout || 'default-layout';
      return layout;
    }
  },
  created() {
    // Check if user is authenticated on app start
    this.$store.dispatch('auth/checkAuth');
    
    // Setup language based on saved preference or browser
    const savedLang = localStorage.getItem('flakies-language') || 'en';
    this.$i18n.locale = savedLang;
  }
};
</script>

<style>
/* Global styles can go here */
</style>