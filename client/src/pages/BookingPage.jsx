import React, { useState } from 'react';
import { Wifi, Car, Shield, Lock } from 'lucide-react';

import HotelCard from '../components/BookingPage/HotelCard';
import BookingDetails from '../components/BookingPage/BookingDetails';
import GuestDetailsForm from '../components/BookingPage/GuestDetailsForm';
import PaymentForm from '../components/BookingPage/PaymentForm';
import BillingAddressForm from '../components/BookingPage/BillingAddressForm';

import { formatCardNumber, validateForm } from '../components/BookingPage/utils';

//feature 3 should pass data neccessary(props) when using bookingpage
//if there is no data, hardcoded data is used currently
//there are 3 props: props.hotel, props.booking and props. pricing

const BookingPage = (props = {}) => {
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
    checkIn: { date: "Tue, 09 Aug, 2025", time: "From 2:00 PM" },
    checkOut: { date: "Wed, 10 Aug, 2025", time: "Until 12:00 PM" },
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

  //This holds booking details of the user
  const [form, setForm] = useState({
    firstName: '', lastName: '', phoneNumber: '', emailAddress: '', salutation: '', specialRequests: '',
    nameOnCard: '', creditCardNumber: '', expirationMonth: '', expirationYear: '', cvv: '',
    billingFirstName: '', billingLastName: '', billingPhoneNumber: '', billingEmailAddress: '',
    country: 'SG', stateProvince: '', postalCode: ''
  });

  //This holds validation errors for the form completion
  const [errors, setErrors] = useState({});

  //This holds the loading state of the booking
  const [loading, setLoading] = useState(false);

  //Update the state of the form when the updates are make
  const updateForm = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    //change the input into the creditcard number format
    if (name === 'creditCardNumber') {
      processedValue = formatCardNumber(value);
    }

    setForm(prev => ({ ...prev, [name]: processedValue }));

    //When there is an update, the existing error will be cleared
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  //If there is no error from validateForm, it will make an API call 
  const handleSubmit = async () => {
    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);

    /*try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Booking submitted:', { form, hotel, booking, pricing });
      props.onSubmit?.(form);
      alert("Booking submitted successfully!");
    } catch (error) {
      console.error('Booking failed:', error);
      alert("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }*/

    //api call with endpoint: api/bookings
    try {
      const response = await fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form, hotel, booking, pricing }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Booking submitted:', data);
      alert("Booking submitted successfully!");
      props.onSubmit?.(form);

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
