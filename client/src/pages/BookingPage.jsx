import React, { useState } from 'react';
import { Wifi, Car, Shield, Lock } from 'lucide-react';

// Import components
import HotelCard from '../components/BookingPage/HotelCard';
import BookingDetails from '../components/BookingPage/BookingDetails';
import GuestDetailsForm from '../components/BookingPage/GuestDetailsForm';
import PaymentForm from '../components/BookingPage/PaymentForm';
import BillingAddressForm from '../components/BookingPage/BillingAddressForm';

// Import utilities
import { formatCardNumber, validateForm } from '../components/BookingPage/utils';

const BookingPage = (props = {}) => {
  // Default props for hotel, booking, pricing
  const hotel = props.hotel || {
    name: "The Fullerton Hotel Singapore",
    stars: 5,
    address: "1 Fullerton Square, 049178 Singapore, Singapore",
    rating: "9.4",
    reviewCount: "1,200",
    amenities: [
      { name: "Free Wi-Fi", icon: <Wifi className="h-4 w-4" /> },
      { name: "Room Service", icon: <Shield className="h-4 w-4" /> },
      { name: "Safe", icon: <Lock className="h-4 w-4" /> },
      { name: "Parking", icon: <Car className="h-4 w-4" /> }
    ]
  };

  const booking = props.booking || {
    checkIn: { date: "Tue, 09 Jul, 2024", time: "From 2:00 PM" },
    checkOut: { date: "Wed, 10 Jul, 2024", time: "Until 12:00 PM" },
    roomType: "Deluxe Room",
    nights: 1,
    adults: 2,
    children: 0
  };

  const pricing = props.pricing || {
    items: [
      { desc: "Room (1 night)", amount: "$450.00" },
      { desc: "Taxes & fees", amount: "$67.50" }
    ],
    total: "$517.50"
  };

  // Form state
  const [form, setForm] = useState({
    firstName: '', lastName: '', phoneNumber: '', emailAddress: '', salutation: '', specialRequests: '',
    nameOnCard: '', creditCardNumber: '', expirationMonth: '', expirationYear: '', cvv: '',
    billingFirstName: '', billingLastName: '', billingPhoneNumber: '', billingEmailAddress: '',
    country: 'SG', stateProvince: '', postalCode: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Form handlers
  const updateForm = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'creditCardNumber') {
      processedValue = formatCardNumber(value);
    }

    setForm(prev => ({ ...prev, [name]: processedValue }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Booking submitted:', { form, hotel, booking, pricing });
      props.onSubmit?.(form);
      alert("Booking submitted successfully!");
    } catch (error) {
      console.error('Booking failed:', error);
      alert("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" pt-25 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
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

            {/* Payment */}
            <PaymentForm 
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

            {/* Submit Button */}
            <div className="bg-white p-6 rounded shadow mt-6">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition"
              >
                {loading ? "Submitting..." : "Confirm Booking"}
              </button>
            </div>
          </div>

          {/* Right Side - Booking Summary (optional) */}
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
