import React, { useState } from "react";
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import FormSection from './FormSection';
import { CheckCircle2 } from 'lucide-react';

// Separate component for the payment form that uses Stripe hooks
const CheckoutForm = React.forwardRef((props, ref) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState('');

  // Expose the submit function to parent component
  React.useImperativeHandle(ref, () => ({
    submitPayment: async () => {
      if (!stripe || !elements) {
        return { success: false, error: 'Stripe not loaded' };
      }

      setMessage('Processing payment...');

      try {
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/completion`,
          },
          redirect: 'if_required'
        });

        if (error) {
          setMessage(error.message);
          return { success: false, error: error.message };
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
          setMessage("Payment successful!");
          return { success: true, paymentIntent };
        }
      } catch (err) {
        const errorMessage = err.message || 'Payment failed';
        setMessage(errorMessage);
        return { success: false, error: errorMessage };
      }
    }
  }), [stripe, elements]);

  return (
    <FormSection
      title="Payment Details" 
      subtitle="Enter your payment details to complete your booking"
      icon={<CheckCircle2 className="h-5 w-5" />}
    >
      <PaymentElement />
      {message && (
        <div className="mt-4 p-3 rounded text-sm">
          {message.includes("successful") ? (
            <div className="text-green-700 bg-green-100 p-3 rounded">
              {message}
            </div>
          ) : (
            <div className="text-red-700 bg-red-100 p-3 rounded">
              {message}
            </div>
          )}
        </div>
      )}
    </FormSection>
  );
});

export default CheckoutForm;