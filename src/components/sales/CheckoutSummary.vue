<template>
    <div class="checkout-summary pa-3">
      <v-row no-gutters>
        <v-col cols="6" class="text-subtitle-1">Subtotal</v-col>
        <v-col cols="6" class="text-right text-subtitle-1">
          {{ formatCurrency(subtotal) }}
        </v-col>
      </v-row>
      
      <v-row no-gutters v-if="discount > 0">
        <v-col cols="6" class="text-subtitle-1">Discount</v-col>
        <v-col cols="6" class="text-right text-subtitle-1 error--text">
          -{{ formatCurrency(discount) }}
        </v-col>
      </v-row>
      
      <v-row no-gutters>
        <v-col cols="6" class="text-subtitle-1">Tax (16%)</v-col>
        <v-col cols="6" class="text-right text-subtitle-1">
          {{ formatCurrency(tax) }}
        </v-col>
      </v-row>
      
      <v-divider class="my-2"></v-divider>
      
      <v-row no-gutters>
        <v-col cols="6" class="text-h6 font-weight-bold">Total</v-col>
        <v-col cols="6" class="text-right text-h6 font-weight-bold primary--text">
          {{ formatCurrency(total) }}
        </v-col>
      </v-row>
    </div>
  </template>
  
  <script>
  export default {
    name: 'CheckoutSummary',
    props: {
      subtotal: {
        type: Number,
        required: true
      },
      tax: {
        type: Number,
        required: true
      },
      discount: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        required: true
      }
    },
    methods: {
      formatCurrency(amount) {
        return new Intl.NumberFormat('en-KE', {
          style: 'currency',
          currency: 'KES'
        }).format(amount);
      }
    }
  };
  </script>