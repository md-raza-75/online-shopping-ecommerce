import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loader from './Loader';

const Payment = ({ orderId, amount, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        console.log('Razorpay script loaded');
        resolve(true);
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway');
        return;
      }

      // Get user info
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
        }
      };

      // Create Razorpay order
      const { data } = await axios.post('/api/orders/create-razorpay-order', {
        amount: amount,
        currency: 'INR',
        orderId: orderId
      }, config);

      if (!data.success) {
        toast.error('Failed to create payment order');
        return;
      }

      // Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.data.amount,
        currency: data.data.currency,
        name: 'ShopEasy',
        description: 'Order Payment',
        order_id: data.data.id,
        handler: async (response) => {
          // Verify payment on backend
          const verifyRes = await axios.post(`/api/orders/${orderId}/verify-payment`, {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          }, config);

          if (verifyRes.data.success) {
            toast.success('Payment Successful!');
            onPaymentSuccess({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
          } else {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: userInfo.name || '',
          email: userInfo.email || '',
          contact: ''
        },
        notes: {
          address: 'ShopEasy E-commerce',
          order_id: orderId
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: function() {
            toast.info('Payment window closed');
          }
        }
      };

      // Open Razorpay checkout
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();

      razorpayInstance.on('payment.failed', function(response) {
        toast.error('Payment failed. Please try again.');
        console.error('Payment failed:', response.error);
      });

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <button 
        onClick={handlePayment}
        disabled={loading}
        className="btn btn-primary w-100 py-3"
        style={{ fontSize: '1.1rem' }}
      >
        {loading ? (
          <>
            <Loader size="sm" /> Processing...
          </>
        ) : (
          <>
            Pay ₹{amount.toLocaleString()} via Razorpay
          </>
        )}
      </button>
      
      <div className="mt-3 text-center">
        <div className="d-flex justify-content-center align-items-center mb-2">
          <img 
            src="https://razorpay.com/assets/razorpay-logo.svg" 
            alt="Razorpay" 
            style={{ height: '20px', marginRight: '10px' }}
          />
          <span className="small text-muted">Secure payment gateway</span>
        </div>
        <div className="small text-muted">
          Accepts Credit/Debit Cards, UPI, NetBanking
        </div>
      </div>
    </div>
  );
};

export default Payment;