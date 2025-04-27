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
            data-testid="decrease-quantity"
          >
            <v-icon>mdi-minus</v-icon>
          </v-btn>
          
          <span class="mx-2 text-subtitle-2">{{ item.quantity }}</span>
          
          <v-btn 
            icon 
            x-small 
            @click="incrementQuantity"
            :disabled="isMaxQuantity"
            data-testid="increase-quantity"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
          
          <v-spacer></v-spacer>
          
          <v-btn 
            icon 
            color="error" 
            x-small 
            @click="confirmRemove"
            data-testid="remove-item"
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

    <!-- Confirm removal dialog -->
    <v-dialog v-model="showRemoveDialog" max-width="300">
      <v-card>
        <v-card-title class="headline">Remove Item</v-card-title>
        <v-card-text>Are you sure you want to remove this item from the cart?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showRemoveDialog = false">Cancel</v-btn>
          <v-btn color="error" text @click="removeItem">Remove</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
  data() {
    return {
      showRemoveDialog: false
    };
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
      } else {
        // Show toast notification about stock limitation
        this.$root.$emit('show-toast', {
          text: `Only ${this.item.available} items available in stock`,
          color: 'warning'
        });
      }
    },
    decrementQuantity() {
      if (this.item.quantity > 1) {
        this.$emit('update:quantity', this.item.quantity - 1);
      }
    },
    confirmRemove() {
      this.showRemoveDialog = true;
    },
    removeItem() {
      this.showRemoveDialog = false;
      this.$emit('remove');
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