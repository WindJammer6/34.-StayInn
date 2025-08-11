import React, { useState, useEffect } from 'react';
import { Wifi, Car, Shield, Lock } from 'lucide-react';

import HotelCard from '../components/BookingPage/HotelCard';
import BookingDetails from '../components/BookingPage/BookingDetails';
import GuestDetailsForm from '../components/BookingPage/GuestDetailsForm';
import BillingAddressForm from '../components/BookingPage/BillingAddressForm';
import CheckoutForm from '../components/BookingPage/CheckoutForm';
import { validateForm } from '../components/BookingPage/utils';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

import { useNavigate, useLocation } from "react-router-dom";


//checking stripe promise
const stripePromise = loadStripe('pk_test_51RoRvpJxdrdbDB60c3djoXo8LwZXOtdd3NvmcHQrmO9XbjVPRUhXkyrARKnb8AdSUk31OVonwnIaiEAWTLQ7a8j200RbPmff4O')

//feature 3 should pass data neccessary(props) when using bookingpage
//if there is no data, hardcoded data is used currently
//there are 3 props: props.hotel, props.booking and props.pricing

function nightsBetween(startDate, endDate) {
  // Parse dates without time to avoid timezone issues
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");

  // Calculate difference in milliseconds
  const diffMs = end - start;

  // Convert milliseconds to days
  const nights = diffMs / (1000 * 60 * 60 * 24);

  return nights;
}

const BookingPage = (props = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const {
    hotelData,
    hotelId,
    destinationId,
    checkIn,
    checkOut,
    lang,
    currency,
    countryCode,
    guests,
    price,
    quantity,
    totalCost,
    roomDescription,
    defaultValues = {},
  } = state;

  const effectiveParams = {
    hotelData: hotelData || defaultValues.hotel,
    hotelId: hotelId || defaultValues.hotelId || "diH7",
    destinationId: destinationId || defaultValues.destinationId || "WD0M",
    checkIn: checkIn || defaultValues.checkin,
    checkOut: checkOut || defaultValues.checkout,
    lang: lang || defaultValues.lang || "en_US",
    currency: currency || defaultValues.currency || "SGD",
    countryCode: countryCode || defaultValues.countryCode || "SG",
    guests: guests || defaultValues.guests || "2",
    price: price || defaultValues.price || "512.60",
    quantity: quantity || defaultValues.quantity || "1",
    totalCost: totalCost || defaultValues.totalCost || "512.60",
    roomDescription: roomDescription || defaultValues.roomDescription || "Deluxe Room"
  };

  const hotel = props.hotel || {
    name: effectiveParams.hotelData.name || "The Fullerton Hotel Singapore",
    address: effectiveParams.hotelData.address || "1 Fullerton Square, 049178 Singapore, Singapore",
    rating: effectiveParams.hotelData.rating || "9.4",
    amenities: [
      { name: "Free Wi-Fi", icon: <Wifi className="h-4 w-4" /> },
      { name: "Room Service", icon: <Shield className="h-4 w-4" /> },
      { name: "Safe", icon: <Lock className="h-4 w-4" /> },
      { name: "Parking", icon: <Car className="h-4 w-4" /> }
    ] || effectiveParams.hotelData.amenities
  };

  const booking = props.booking || {
    checkIn: effectiveParams.checkIn,
    checkOut: effectiveParams.checkOut,
    roomType: effectiveParams.roomDescription,
    nights: nightsBetween(effectiveParams.checkIn, effectiveParams.checkOut),
    guests: effectiveParams.guests,
    destinationId: effectiveParams.destinationId,
    hotelId: effectiveParams.hotelId,
    countryCode: effectiveParams.countryCode,
    price: effectiveParams.totalCost
  };

  const pricing = props.pricing || {
    items: [
      { desc: "Room (1 night)", amount: "$450.00" },
      { desc: "Taxes & fees", amount: "$67.50" }
    ],
    total: effectiveParams.price.toString()
  };

  console.log("checkin booking page", effectiveParams.checkIn)

  //This holds booking details of the user and room to send to MongoDB
  const [form, setForm] = useState({
    firstName: '', lastName: '', phoneNumber: '', emailAddress: '', salutation: '', specialRequests: '',
    billingFirstName: '', billingLastName: '', billingPhoneNumber: '', billingEmailAddress: '',
    country: 'SG', stateProvince: '', postalCode: '', date: '', hotelId: effectiveParams.hotelId, destinationId: effectiveParams.destinationId, 
    checkin: effectiveParams.checkIn, checkout: effectiveParams.checkOut, countryCode: effectiveParams.countryCode, guests: effectiveParams.adults, 
    price: effectiveParams.price, quantity: effectiveParams.totalCost, totalCost: effectiveParams.totalCost
  });

  //This holds validation errors for the form completion
  const [errors, setErrors] = useState({});

  //This holds the loading state of the booking
  const [loading, setLoading] = useState(false);

  //This is for stripe
  const [clientSecret, setClientSecret] = useState('');
  const paymentFormRef = React.useRef(null);
  const [paymentIntentCreated, setPaymentIntentCreated] = useState(false);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        // Add a delay to prevent rapid successive calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch('http://localhost:8080/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pricing: { total: '$517.50' } })
        });

        if (!response.ok) {
          // Handle rate limiting
          if (response.status === 429) {
            console.warn("Rate limited by Stripe, retrying after delay...");
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            return createPaymentIntent(); // Retry
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Payment intent data:", data);
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error("Failed to create payment intent:", error);
        if (error.message.includes('429')) {
          alert("Service is temporarily busy. Please wait a moment and try again.");
        }
      }
    };

    // Only create payment intent if we don't already have one
    if (!clientSecret && !paymentIntentCreated) {
      setPaymentIntentCreated(true);
      createPaymentIntent();
    }
  }, []);

  //Update the state of the form when the updates are make
  const updateForm = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    setForm(prev => ({ ...prev, [name]: processedValue }));

    //When there is an update, the existing error will be cleared
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  //If there is no error from validateForm, it will make an API call 
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form first
    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    console.log("errors", validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      alert("Please fill in all required fields correctly.");
      return;
    }

    setLoading(true);

    try {
      // Process payment first
      if (paymentFormRef.current && paymentFormRef.current.submitPayment) {
        const paymentResult = await paymentFormRef.current.submitPayment();
        
        if (!paymentResult.success) {
          throw new Error(paymentResult.error || 'Payment failed');
        }
        
        console.log('Payment successful:', paymentResult.paymentIntent);
      } else {
        throw new Error('Payment form not ready');
      }

      // If payment successful, proceed with booking API call
      const response = await fetch('http://localhost:8080/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error('Booking submission failed');
      }

      const data = await response.json();
      console.log('Booking submitted:', data);
      alert("Booking completed successfully!");
      props.onSubmit?.(form);

    } catch (error) {
      console.error('Booking process failed:', error);
      alert(`Booking failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-25 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Booking</h1>
          <p className="text-gray-600">We're almost there! Just a few more details needed.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest Details */}
            <GuestDetailsForm 
              form={form}
              errors={errors}
              onChange={updateForm}
            />

            {/* Billing Address */}
            <BillingAddressForm 
              form={form}
              errors={errors}
              onChange={updateForm}
            />

            {/* Payment */}
            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm ref={paymentFormRef} />
              </Elements>
            )}

            {/* Submit Button */}
            <div className="bg-white p-6 rounded shadow mt-6">
              <button
                onClick={handleSubmit}
                disabled={loading || !clientSecret}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded transition disabled:cursor-not-allowed"
              >
                {loading ? "Processing Payment & Booking..." : "Complete Booking & Pay"}
              </button>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Your payment will be processed when you click this button
              </p>
            </div>
          </div>

          {/* Right Side - Booking Summary */}
          <div>
            <HotelCard hotel={hotel} />
            <BookingDetails booking={booking} pricing={pricing} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;