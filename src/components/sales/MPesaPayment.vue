<template>
  <v-card>
    <v-card-title class="primary white--text">
      M-Pesa Payment
      <v-spacer></v-spacer>
      <v-btn icon dark @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    
    <v-card-text class="pt-4">
      <v-alert
        type="info"
        text
        dense
        v-if="!status"
      >
        Enter the customer's M-Pesa phone number to send an STK push request.
      </v-alert>
      
      <v-alert
        :type="alertType"
        text
        dense
        v-if="status"
      >
        {{ statusMessage }}
      </v-alert>
      
      <v-form ref="form" v-model="valid" @submit.prevent="initiatePayment">
        <v-text-field
          v-model="phoneNumber"
          label="Phone Number"
          :rules="phoneRules"
          prefix="+254"
          hint="Format: 7XXXXXXXX or 1XXXXXXXX"
          placeholder="7XXXXXXXX"
          :disabled="loading"
          :error-messages="errors.phone"
          required
          outlined
          counter="9"
        ></v-text-field>
        
        <div class="text-h6 mb-4 text-center">
          Amount: {{ formatCurrency(amount) }}
        </div>
        
        <v-img
          src="@/assets/images/mpesa-logo.png"
          max-height="60"
          contain
          class="mb-4"
          alt="M-Pesa Logo"
        ></v-img>
      </v-form>
    </v-card-text>
    
    <v-card-actions class="pb-4 px-4">
      <v-spacer></v-spacer>
      <v-btn
        text
        @click="$emit('close')"
        :disabled="loading"
      >
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        :loading="loading"
        :disabled="!valid || loading"
        @click="initiatePayment"
      >
        Send Payment Request
      </v-btn>
    </v-card-actions>
    
    <!-- Payment confirmation dialog -->
    <v-dialog
      v-model="showConfirmation"
      persistent
      max-width="400"
    >
      <v-card>
        <v-card-title class="headline">
          Payment Confirmation
        </v-card-title>
        <v-card-text>
          <p>
            A payment request has been sent to <strong>+254{{ phoneNumber }}</strong>.
          </p>
          <p>
            Please enter your M-Pesa PIN on your phone to complete the payment.
          </p>
          <div class="text-center my-4">
            <v-progress-circular
              indeterminate
              color="primary"
              size="60"
            ></v-progress-circular>
          </div>
          <p class="text-center">
            Waiting for payment confirmation...<br>
            <small>Time remaining: {{ timeLeft }} seconds</small>
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="cancelPayment"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Network Error Dialog -->
    <v-dialog
      v-model="showNetworkError"
      max-width="400"
    >
      <v-card>
        <v-card-title class="headline error white--text">
          Connection Error
        </v-card-title>
        <v-card-text class="pt-4">
          <p>
            Unable to connect to the payment server. This could be due to:
          </p>
          <ul>
            <li>No internet connection</li>
            <li>Server is currently unavailable</li>
            <li>Network timeout</li>
          </ul>
          <p class="mt-2">
            Would you like to retry or process the payment manually?
          </p>
        </v-card-text>
        <v-card-actions>
          <v-btn
            text
            @click="showNetworkError = false"
          >
            Cancel
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            text
            color="primary"
            @click="retryPayment"
          >
            Retry
          </v-btn>
          <v-btn
            color="success"
            @click="processManually"
          >
            Process Manually
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-card>
</template>

<script>
import paymentService from '@/services/payment.service';

export default {
  name: 'MPesaPayment',
  props: {
    amount: {
      type: Number,
      required: true
    },
    customer: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      valid: false,
      loading: false,
      phoneNumber: '',
      phoneRules: [
        v => !!v || 'Phone number is required',
        v => /^[71]\d{8}$/.test(v) || 'Phone number must be valid (7XXXXXXXX or 1XXXXXXXX)'
      ],
      errors: {
        phone: null
      },
      status: null, // 'pending', 'success', 'error'
      statusMessage: '',
      showConfirmation: false,
      showNetworkError: false,
      paymentReference: null,
      pollingInterval: null,
      timeoutTimer: null,
      retryCount: 0,
      maxRetries: 3,
      timeLeft: 120, // 2-minute timeout
      countdownInterval: null
    };
  },
  computed: {
    alertType() {
      return this.status === 'success' ? 'success' : 
             this.status === 'error' ? 'error' : 'info';
    }
  },
  created() {
    // Pre-fill customer phone if available
    if (this.customer && this.customer.phone) {
      // Strip any leading +254 or 0
      this.phoneNumber = this.customer.phone
        .replace(/^\+254/, '')
        .replace(/^0/, '');
    }
  },
  methods: {
    async initiatePayment() {
      if (!this.$refs.form.validate()) return;
      
      this.loading = true;
      this.errors.phone = null;
      this.retryCount = 0;
      
      try {
        // Check network status
        if (!navigator.onLine) {
          throw new Error('No internet connection');
        }
        
        // Call the M-Pesa STK Push API
        const response = await paymentService.initiateMpesaPayment({
          phoneNumber: `254${this.phoneNumber}`,
          amount: this.amount,
          reference: `Flakies-${Date.now()}`
        });
        
        this.paymentReference = response.data.checkoutRequestID;
        this.status = 'pending';
        this.statusMessage = 'Payment request sent. Check your phone for the M-Pesa prompt.';
        
        // Show confirmation dialog and start timer
        this.showConfirmation = true;
        this.timeLeft = 120;
        this.startCountdown();
        
        // Start polling for payment status
        this.startPolling();
      } catch (error) {
        if (!navigator.onLine || error.message === 'No internet connection' || 
           (error.response && error.response.status >= 500)) {
          // Network error
          this.showNetworkError = true;
        } else {
          // Other errors
          this.status = 'error';
          this.statusMessage = error.response?.data?.message || 'Failed to send payment request';
          
          if (error.response?.data?.errors?.phoneNumber) {
            this.errors.phone = error.response.data.errors.phoneNumber;
          }
        }
      } finally {
        this.loading = false;
      }
    },
    
    startCountdown() {
      this.countdownInterval = setInterval(() => {
        this.timeLeft--;
        
        if (this.timeLeft <= 0) {
          clearInterval(this.countdownInterval);
          this.timeoutPayment();
        }
      }, 1000);
    },
    
    timeoutPayment() {
      this.stopPolling();
      
      if (this.showConfirmation) {
        this.status = 'error';
        this.statusMessage = 'Payment request timed out. Please try again.';
        this.showConfirmation = false;
        
        // Emit failure event
        this.$emit('payment-failure', {
          message: 'Payment request timed out',
          reference: this.paymentReference
        });
      }
    },
    
    startPolling() {
      // Poll for payment status every 5 seconds
      this.pollingInterval = setInterval(async () => {
        try {
          // Check network status
          if (!navigator.onLine) {
            throw new Error('No internet connection');
          }
          
          const result = await paymentService.checkMpesaPaymentStatus(this.paymentReference);
          
          // If payment is complete
          if (result.data.status === 'success') {
            this.stopPolling();
            this.status = 'success';
            this.statusMessage = 'Payment successful!';
            this.showConfirmation = false;
            
            // Emit success event
            this.$emit('payment-success', {
              reference: this.paymentReference,
              transactionId: result.data.transactionId,
              amount: this.amount,
              phoneNumber: `254${this.phoneNumber}`
            });
          } else if (result.data.status === 'failed') {
            this.stopPolling();
            this.status = 'error';
            this.statusMessage = result.data.message || 'Payment failed';
            this.showConfirmation = false;
            
            // Emit failure event
            this.$emit('payment-failure', {
              message: result.data.message,
              reference: this.paymentReference
            });
          }
          // Continue polling if status is still 'pending'
        } catch (error) {
          this.retryCount++;
          console.error('Failed to check payment status:', error);
          
          // If we've exceeded max retries or no network connection
          if (this.retryCount >= this.maxRetries || !navigator.onLine) {
            this.stopPolling();
            this.showConfirmation = false;
            this.showNetworkError = true;
          }
        }
      }, 5000);
    },
    
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
      
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    },
    
    cancelPayment() {
      this.stopPolling();
      this.showConfirmation = false;
      this.status = 'error';
      this.statusMessage = 'Payment cancelled';
      
      // Emit failure event
      this.$emit('payment-failure', {
        message: 'Payment cancelled by user',
        reference: this.paymentReference
      });
    },
    
    retryPayment() {
      this.showNetworkError = false;
      this.initiatePayment();
    },
    
    processManually() {
      this.showNetworkError = false;
      this.stopPolling();
      
      // Create a manual payment reference
      const manualRef = `MANUAL-${Date.now()}`;
      
      // Emit success with manual reference
      this.$emit('payment-success', {
        reference: manualRef,
        transactionId: manualRef,
        amount: this.amount,
        phoneNumber: `254${this.phoneNumber}`,
        manual: true
      });
    },
    
    formatCurrency(amount) {
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
      }).format(amount);
    }
  },
  beforeDestroy() {
    this.stopPolling();
  }
};
</script>

<style scoped>
.countdown {
  font-size: 0.85rem;
  color: #666;
}
</style>