<template>
  <div class="pos-container">
    <v-row no-gutters>
      <!-- Left side: Products catalog -->
      <v-col cols="12" md="8" class="product-panel">
        <v-card flat class="fill-height">
          <v-card-title class="py-2">
            <v-row align="center" no-gutters>
              <v-col cols="auto">
                <h2>Products</h2>
              </v-col>
              <v-col>
                <v-text-field
                  v-model="searchQuery"
                  prepend-inner-icon="mdi-magnify"
                  label="Search products"
                  single-line
                  hide-details
                  outlined
                  dense
                  class="ml-4"
                  @input="searchProducts"
                ></v-text-field>
              </v-col>
              <v-col cols="auto" class="ml-auto">
                <v-btn
                  v-if="canScanBarcode"
                  icon
                  @click="showBarcodeScanner = true"
                >
                  <v-icon>mdi-barcode-scan</v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </v-card-title>

          <v-divider></v-divider>

          <!-- Category tabs -->
          <v-tabs
            v-model="selectedCategory"
            background-color="primary"
            dark
            show-arrows
          >
            <v-tab key="all">All</v-tab>
            <v-tab v-for="category in categories" :key="category.id">
              {{ category.name }}
            </v-tab>
          </v-tabs>

          <!-- Products grid -->
          <v-card-text class="products-grid">
            <v-row v-if="loading">
              <v-col class="text-center">
                <loading-spinner />
              </v-col>
            </v-row>

            <v-row v-else-if="filteredProducts.length === 0">
              <v-col class="text-center">
                <p>No products found</p>
              </v-col>
            </v-row>

            <v-row v-else>
              <v-col
                v-for="product in filteredProducts"
                :key="product.id"
                cols="6"
                sm="4"
                md="3"
                lg="2"
              >
                <v-hover v-slot="{ hover }">
                  <v-card
                    class="product-card"
                    :elevation="hover ? 8 : 2"
                    @click="addToCart(product)"
                  >
                    <v-img
                      v-if="product.image"
                      :src="product.image"
                      height="100"
                      contain
                    ></v-img>
                    <v-img
                      v-else
                      src="@/assets/images/product-placeholder.png"
                      height="100"
                      contain
                    ></v-img>

                    <v-card-title class="subtitle-1 py-1">
                      {{ product.name }}
                    </v-card-title>

                    <v-card-text class="py-0">
                      <div
                        class="text-subtitle-1 font-weight-bold primary--text"
                      >
                        {{ formatCurrency(product.price) }}
                      </div>
                      <div class="text-caption" v-if="product.stock <= 5">
                        Stock: {{ product.stock }}
                      </div>
                    </v-card-text>
                  </v-card>
                </v-hover>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right side: Cart and checkout -->
      <v-col cols="12" md="4" class="cart-panel">
        <v-card flat class="fill-height d-flex flex-column">
          <v-card-title class="py-2">
            <h2>Current Order</h2>
            <v-spacer></v-spacer>
            <v-btn icon color="error" @click="clearCart" :disabled="!hasItems">
              <v-icon>mdi-delete-sweep</v-icon>
            </v-btn>
          </v-card-title>

          <v-divider></v-divider>

          <!-- Customer selection -->
          <customer-search
            @customer-selected="selectCustomer"
            :selected-customer="selectedCustomer"
          />

          <v-divider></v-divider>

          <!-- Cart items -->
          <v-card-text class="cart-items flex-grow-1 overflow-y-auto">
            <div v-if="!hasItems" class="text-center py-8">
              <v-icon size="60" color="grey lighten-1">mdi-cart-outline</v-icon>
              <p class="mt-4 text-body-1 grey--text">Your cart is empty</p>
            </div>

            <cart-item
              v-for="(item, index) in cartItems"
              :key="index"
              :item="item"
              @update:quantity="updateQuantity(index, $event)"
              @remove="removeItem(index)"
            />
          </v-card-text>

          <v-divider></v-divider>

          <!-- Cart summary -->
          <checkout-summary
            :subtotal="subtotal"
            :tax="tax"
            :total="total"
            :discount="discount"
          />

          <!-- Action buttons -->
          <v-card-actions class="px-4 py-3">
            <div class="checkout-buttons">
              <v-btn
                block
                color="primary"
                large
                :disabled="!hasItems"
                class="mb-2"
                @click="checkout('mpesa')"
              >
                <v-icon left>mdi-cash-register</v-icon>
                M-Pesa Payment
              </v-btn>

              <v-btn-toggle
                v-model="paymentMethod"
                mandatory
                class="d-flex payment-toggle"
              >
                <v-btn value="cash" text>
                  <v-icon small left>mdi-cash</v-icon>
                  Cash
                </v-btn>
                <v-btn value="card" text>
                  <v-icon small left>mdi-credit-card</v-icon>
                  Card
                </v-btn>
                <v-btn value="other" text>
                  <v-icon small left>mdi-dots-horizontal</v-icon>
                  Other
                </v-btn>
              </v-btn-toggle>

              <v-btn
                block
                color="success"
                large
                :disabled="!hasItems"
                class="mt-2"
                @click="checkout(paymentMethod)"
              >
                <v-icon left>mdi-check-circle</v-icon>
                Complete Sale
              </v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Barcode Scanner Modal -->
    <v-dialog v-model="showBarcodeScanner" max-width="500">
      <barcode-scanner
        @close="showBarcodeScanner = false"
        @code-detected="handleBarcodeDetected"
      />
    </v-dialog>

    <!-- M-Pesa Payment Modal -->
    <v-dialog v-model="showMpesaModal" max-width="500">
      <m-pesa-payment
        :amount="total"
        :customer="selectedCustomer"
        @close="showMpesaModal = false"
        @payment-success="handlePaymentSuccess"
        @payment-failure="handlePaymentFailure"
      />
    </v-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import CustomerSearch from "@/components/sales/CustomerSearch.vue";
import CartItem from "@/components/sales/CartItem.vue";
import CheckoutSummary from "@/components/sales/CheckoutSummary.vue";
import BarcodeScanner from "@/components/inventory/BarcodeScanner.vue";
import MPesaPayment from "@/components/sales/MPesaPayment.vue";

export default {
  name: "PosView",
  components: {
    LoadingSpinner,
    CustomerSearch,
    CartItem,
    CheckoutSummary,
    BarcodeScanner,
    MPesaPayment,
  },
  data() {
    return {
      searchQuery: "",
      selectedCategory: "all",
      loading: false,
      products: [],
      categories: [],
      showBarcodeScanner: false,
      showMpesaModal: false,
      selectedCustomer: null,
      paymentMethod: "cash",
      recommendedProducts: [],
    };
  },
  computed: {
    ...mapGetters("sales", [
      "cartItems",
      "subtotal",
      "tax",
      "total",
      "discount",
      "hasItems",
    ]),

    canScanBarcode() {
      // Check if the browser supports the MediaDevices API
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    },

    filteredProducts() {
      if (!this.products) return [];

      let result = [...this.products];

      // Filter by category if not 'all'
      if (this.selectedCategory !== "all") {
        const categoryId = this.categories[this.selectedCategory - 1]?.id;
        if (categoryId) {
          result = result.filter((p) => p.categoryId === categoryId);
        }
      }

      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.barcode?.toLowerCase().includes(query) ||
            p.sku?.toLowerCase().includes(query)
        );
      }

      return result;
    },
  },
  methods: {
    ...mapActions("sales", [
      "addItemToCart",
      "removeItemFromCart",
      "updateItemQuantity",
      "resetCart",
      "processTransaction",
    ]),
    ...mapActions("ai", ["getProductRecommendations"]),

    async fetchProducts() {
      this.loading = true;
      try {
        // In a real app, this would be an API call
        // For now, we'll use fake data
        const response = await fetch("/api/products");
        this.products = await response.json();
      } catch (error) {
        console.error("Failed to fetch products:", error);
        this.$store.commit("SET_OFFLINE_MODE", true);

        // Use cached products in offline mode
        const cachedProducts = localStorage.getItem("flakies-products");
        if (cachedProducts) {
          this.products = JSON.parse(cachedProducts);
        } else {
          // Sample products for demo
          this.products = [
            { id: 1, name: "T-Shirt", price: 1500, stock: 20, categoryId: 1 },
            { id: 2, name: "Jeans", price: 3500, stock: 15, categoryId: 1 },
            { id: 3, name: "Rice 2kg", price: 250, stock: 50, categoryId: 2 },
            { id: 4, name: "Milk 500ml", price: 55, stock: 30, categoryId: 2 },
            { id: 5, name: "Soap", price: 120, stock: 25, categoryId: 3 },
            { id: 6, name: "Toothpaste", price: 180, stock: 15, categoryId: 3 },
          ];
        }
      } finally {
        this.loading = false;
      }

      // Cache products for offline use
      localStorage.setItem("flakies-products", JSON.stringify(this.products));
    },

    async fetchCategories() {
      try {
        // In a real app, this would be an API call
        // For now, we'll use fake data
        const response = await fetch("/api/categories");
        this.categories = await response.json();
      } catch (error) {
        console.error("Failed to fetch categories:", error);

        // Sample categories for demo
        this.categories = [
          { id: 1, name: "Clothing" },
          { id: 2, name: "Groceries" },
          { id: 3, name: "Household" },
        ];
      }
    },

    searchProducts() {
      // This would typically debounce the search
      // For now, it's handled by the computed property
    },

    addToCart(product) {
      // Check if product is in stock
      if (product.stock <= 0) {
        this.$toast.error("Product is out of stock");
        return;
      }

      this.addItemToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        available: product.stock,
      });

      // Get product recommendations
      this.fetchRecommendations(product.id);
    },

    updateQuantity(index, quantity) {
      this.updateItemQuantity({ index, quantity });
    },

    removeItem(index) {
      this.removeItemFromCart(index);
    },

    clearCart() {
      this.resetCart();
      this.selectedCustomer = null;
    },

    selectCustomer(customer) {
      this.selectedCustomer = customer;
    },

    checkout(method) {
      if (method === "mpesa") {
        this.showMpesaModal = true;
        return;
      }

      // Process the transaction
      this.processTransaction({
        items: this.cartItems,
        paymentMethod: method,
        customer: this.selectedCustomer,
        subtotal: this.subtotal,
        tax: this.tax,
        discount: this.discount,
        total: this.total,
      })
        .then((transaction) => {
          // Show success message
          this.$toast.success("Sale completed successfully");

          // Reset cart
          this.resetCart();
          this.selectedCustomer = null;

          // Print receipt
          this.printReceipt(transaction);
        })
        .catch((error) => {
          this.$toast.error("Failed to process transaction");
          console.error("Transaction error:", error);
        });
    },

    handleBarcodeDetected(barcode) {
      // Find product by barcode
      const product = this.products.find((p) => p.barcode === barcode);
      if (product) {
        this.addToCart(product);
        this.showBarcodeScanner = false;
      } else {
        this.$toast.error("Product not found");
      }
    },

    handlePaymentSuccess(paymentData) {
      // Close M-Pesa modal
      this.showMpesaModal = false;

      // Process the transaction
      this.processTransaction({
        items: this.cartItems,
        paymentMethod: "mpesa",
        customer: this.selectedCustomer,
        subtotal: this.subtotal,
        tax: this.tax,
        discount: this.discount,
        total: this.total,
        paymentReference: paymentData.reference,
      })
        .then((transaction) => {
          this.$toast.success("M-Pesa payment successful");
          this.resetCart();
          this.selectedCustomer = null;
          this.printReceipt(transaction);
        })
        .catch((error) => {
          this.$toast.error("Failed to process transaction");
          console.error("Transaction error:", error);
        });
    },

    handlePaymentFailure(error) {
      this.$toast.error(`Payment failed: ${error.message}`);
      this.showMpesaModal = false;
    },

    printReceipt(transaction) {
      // In a real app, this would print to a receipt printer
      // For now, we'll just show a dialog or open a new window
      this.$router.push({
        name: "ReceiptView",
        params: { transactionId: transaction.id },
      });
    },

    async fetchRecommendations(productId) {
      try {
        const recommendations = await this.getProductRecommendations(productId);
        this.recommendedProducts = recommendations;

        // Show recommendations if available
        if (recommendations.length > 0) {
          const product = recommendations[0];
          this.$toast.info(`Customers also bought: ${product.name}`, {
            action: {
              text: "Add",
              onClick: () => this.addToCart(product),
            },
          });
        }
      } catch (error) {
        console.error("Failed to get recommendations:", error);
      }
    },

    formatCurrency(amount) {
      return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
      }).format(amount);
    },
  },
  created() {
    this.fetchProducts();
    this.fetchCategories();
  },
};
</script>

<style scoped>
.pos-container {
  height: calc(100vh - 64px);
}

.product-panel,
.cart-panel {
  height: 100%;
  overflow: hidden;
}

.products-grid {
  overflow-y: auto;
  height: calc(100vh - 180px);
}

.product-card {
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
}

.product-card:hover {
  transform: translateY(-5px);
}

.cart-items {
  max-height: calc(100vh - 350px);
}

.checkout-buttons {
  width: 100%;
}

.payment-toggle {
  width: 100%;
}
</style>
