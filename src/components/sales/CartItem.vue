<template>
    <v-card class="mb-2 cart-item" flat outlined>
      <v-card-text class="py-2 px-3">
        <v-row no-gutters align="center">
          <v-col cols="8">
            <div class="text-subtitle-1">{{ item.name }}</div>
            <div class="text-caption text-right">
              {{ formatCurrency(item.price) }} each
            </div>
          </v-col>
          
          <v-col cols="4" class="d-flex align-center">
            <v-btn 
              icon 
              x-small 
              @click="decrementQuantity"
              :disabled="item.quantity <= 1"
            >
              <v-icon>mdi-minus</v-icon>
            </v-btn>
            
            <span class="mx-2 text-subtitle-2">{{ item.quantity }}</span>
            
            <v-btn 
              icon 
              x-small 
              @click="incrementQuantity"
              :disabled="isMaxQuantity"
            >
              <v-icon>mdi-plus</v-icon>
            </v-btn>
            
            <v-spacer></v-spacer>
            
            <v-btn 
              icon 
              color="error" 
              x-small 
              @click="$emit('remove')"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        
        <v-row no-gutters>
          <v-col cols="12" class="text-subtitle-1 text-right primary--text font-weight-bold">
            {{ formatCurrency(item.price * item.quantity) }}
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </template>
  
  <script>
  export default {
    name: 'CartItem',
    props: {
      item: {
        type: Object,
        required: true
      }
    },
    computed: {
      isMaxQuantity() {
        // Check if quantity is at maximum allowed by stock
        return this.item.quantity >= this.item.available;
      }
    },
    methods: {
      incrementQuantity() {
        if (!this.isMaxQuantity) {
          this.$emit('update:quantity', this.item.quantity + 1);
        }
      },
      decrementQuantity() {
        if (this.item.quantity > 1) {
          this.$emit('update:quantity', this.item.quantity - 1);
        }
      },
      formatCurrency(amount) {
        return new Intl.NumberFormat('en-KE', {
          style: 'currency',
          currency: 'KES'
        }).format(amount);
      }
    }
  };
  </script>
  
  <style scoped>
  .cart-item {
    transition: background-color 0.3s;
  }
  
  .cart-item:hover {
    background-color: #f5f5f5;
  }
  </style>