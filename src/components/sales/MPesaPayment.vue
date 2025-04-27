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
              Waiting for payment confirmation...
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
        paymentReference: null,
        pollingInterval: null
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
        
        try {
          // Call the M-Pesa STK Push API
          const response = await paymentService.initiateMpesaPayment({
            phoneNumber: `254${this.phoneNumber}`,
            amount: this.amount,
            reference: `Flakies-${Date.now()}`
          });
          
          this.paymentReference = response.data.checkoutRequestID;
          this.status = 'pending';
          this.statusMessage = 'Payment request sent. Check your phone for the M-Pesa prompt.';
          
          // Show confirmation dialog
          this.showConfirmation = true;
          
          // Start polling for payment status
          this.startPolling();
        } catch (error) {
          this.status = 'error';
          this.statusMessage = error.response?.data?.message || 'Failed to send payment request';
          
          if (error.response?.data?.errors?.phoneNumber) {
            this.errors.phone = error.response.data.errors.phoneNumber;
          }
        } finally {
          this.loading = false;
        }
      },
      
      startPolling() {
        // Poll for payment status every 5 seconds
        this.pollingInterval = setInterval(async () => {
          try {
            const result = await paymentService.checkMpesaPaymentStatus(this.paymentReference);
            
            // If payment is complete
            if (result.data.status === 'success') {
              this.status = 'success';
              this.statusMessage = 'Payment successful!';
              this.showConfirmation = false;
              this.stopPolling();
              
              // Emit success event
              this.$emit('payment-success', {
                reference: this.paymentReference,
                transactionId: result.data.transactionId,
                amount: this.amount,
                phoneNumber: `254${this.phoneNumber}`
              });
            } else if (result.data.status === 'failed') {
              this.status = 'error';
              this.statusMessage = result.data.message || 'Payment failed';
              this.showConfirmation = false;
              this.stopPolling();
              
              // Emit failure event
              this.$emit('payment-failure', {
                message: result.data.message,
                reference: this.paymentReference
              });
            }
            // Continue polling if status is still 'pending'
          } catch (error) {
            console.error('Failed to check payment status:', error);
          }
        }, 5000);
      },
      
      stopPolling() {
        if (this.pollingInterval) {
          clearInterval(this.pollingInterval);
          this.pollingInterval = null;
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