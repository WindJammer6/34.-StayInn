import React, { useState, useEffect, useRef } from "react";
import { Wifi, Car, Shield, Lock } from "lucide-react";

import HotelCard from "../components/BookingPage/HotelCard";
import BookingDetails from "../components/BookingPage/BookingDetails";
import GuestDetailsForm from "../components/BookingPage/GuestDetailsForm";
import BillingAddressForm from "../components/BookingPage/BillingAddressForm";
import CheckoutForm from "../components/BookingPage/CheckoutForm";
import { validateForm } from "../components/BookingPage/utils";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import { useNavigate, useLocation } from "react-router-dom";

// ---- Stripe (publishable key; server uses the secret key) ----
const stripePromise = loadStripe(
  "pk_test_51RoRvpJxdrdbDB60c3djoXo8LwZXOtdd3NvmcHQrmO9XbjVPRUhXkyrARKnb8AdSUk31OVonwnIaiEAWTLQ7a8j200RbPmff4O"
);

// ---- Helpers ----
function nightsBetween(startDate, endDate) {
  // Parse as UTC calendar days to avoid timezone drift
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  const diffMs = end - start;
  return diffMs / (1000 * 60 * 60 * 24);
}

const toNum = (x, fallback = 0) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
};

const formatMoney = (n, cur = "SGD") => `${cur} ${toNum(n, 0).toFixed(2)}`;

// -----------------------------
// Booking Page Component
// -----------------------------
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
    price, // nightly price (number)
    quantity, // number of rooms (number)
    totalCost, // optional precomputed total from previous page
    roomDescription,
    defaultValues = {},
  } = state;

  // Normalize input / fallbacks
  const effectiveParams = {
    hotelData: hotelData || defaultValues.hotel || {},
    hotelId: hotelId || defaultValues.hotelId || "diH7",
    destinationId: destinationId || defaultValues.destinationId || "WD0M",
    checkIn: checkIn || defaultValues.checkin,
    checkOut: checkOut || defaultValues.checkout,
    lang: lang || defaultValues.lang || "en_US",
    currency: currency || defaultValues.currency || "SGD",
    countryCode: countryCode || defaultValues.countryCode || "SG",
    guests: guests || defaultValues.guests || "2",
    price: price ?? defaultValues.price ?? 0,
    quantity: quantity ?? defaultValues.quantity ?? 1,
    totalCost: totalCost ?? defaultValues.totalCost,
    roomDescription:
      roomDescription || defaultValues.roomDescription || "Deluxe Room",
  };

  // Derive numeric totals consistently (single source of truth)
  const nightlyPrice = toNum(effectiveParams.price, 0);
  const qty = toNum(effectiveParams.quantity, 1);
  const nights = Math.max(
    1,
    toNum(nightsBetween(effectiveParams.checkIn, effectiveParams.checkOut), 1)
  );

  // Prefer a passed totalCost if it exists and is finite; otherwise compute
  const totalFromState = toNum(effectiveParams.totalCost, NaN);
  const computedTotal = Number.isFinite(totalFromState)
    ? totalFromState
    : nightlyPrice * qty * nights;

  // ---- Presentation models ----
  const hotel = props.hotel || {
    name: effectiveParams.hotelData.name || "The Fullerton Hotel Singapore",
    address:
      effectiveParams.hotelData.address ||
      "1 Fullerton Square, 049178 Singapore, Singapore",
    rating: effectiveParams.hotelData.rating || "9.4",
    image: props.hotel?.image || "/src/assets/hotels/fullertonHotel.jpg",
    amenities: [
      { name: "Free Wi-Fi", icon: <Wifi className="h-4 w-4" /> },
      { name: "Room Service", icon: <Shield className="h-4 w-4" /> },
      { name: "Safe", icon: <Lock className="h-4 w-4" /> },
      { name: "Parking", icon: <Car className="h-4 w-4" /> },
    ],
  };

  const booking = props.booking || {
    checkIn: effectiveParams.checkIn,
    checkOut: effectiveParams.checkOut,
    roomType: effectiveParams.roomDescription,
    nights,
    guests: effectiveParams.guests,
    destinationId: effectiveParams.destinationId,
    hotelId: effectiveParams.hotelId,
    countryCode: effectiveParams.countryCode,
    price: computedTotal, // total for the entire stay
  };

  const pricing = props.pricing || {
    items: [
      {
        desc: `Room × ${qty} × ${nights} night${nights > 1 ? "s" : ""}`,
        amount: formatMoney(
          nightlyPrice * qty * nights,
          effectiveParams.currency
        ),
      },
      // Add taxes/fees as separate items here if you compute them
    ],
    total: formatMoney(computedTotal, effectiveParams.currency),
  };

  // ---- Form state ----
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    emailAddress: "",
    salutation: "",
    specialRequests: "",
    billingFirstName: "",
    billingLastName: "",
    billingPhoneNumber: "",
    billingEmailAddress: "",
    country: "SG",
    stateProvince: "",
    postalCode: "",
    date: "",
    hotelId: effectiveParams.hotelId,
    destinationId: effectiveParams.destinationId,
    checkin: effectiveParams.checkIn,
    checkout: effectiveParams.checkOut,
    countryCode: effectiveParams.countryCode,
    guests: effectiveParams.guests,
    price: nightlyPrice, // per-night price (for record)
    quantity: qty, // number of rooms
    totalCost: computedTotal, // full total for the stay
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const paymentFormRef = useRef(null);
  const [paymentIntentCreated, setPaymentIntentCreated] = useState(false);

  // ---- Create Payment Intent (uses computed total) ----
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log(effectiveParams.computedTotal)
        const response = await fetch(
          "http://localhost:8080/api/create-payment-intent",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              currency: effectiveParams.currency,
              amount: effectiveParams.totalCost
            }),
          }
        );
        console.log("returned")

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error("Failed to create payment intent:", err);
      }
    };

    if (!clientSecret && !paymentIntentCreated) {
      setPaymentIntentCreated(true);
      createPaymentIntent();
    }
  }, [
    clientSecret,
    paymentIntentCreated,
    computedTotal,
    effectiveParams.currency,
  ]);

  // ---- Handlers ----
  const updateForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      alert("Please fill in all required fields correctly.");
      return;
    }

    setLoading(true);
    try {
      if (paymentFormRef.current && paymentFormRef.current.submitPayment) {
        const paymentResult = await paymentFormRef.current.submitPayment();
        if (!paymentResult.success)
          throw new Error(paymentResult.error || "Payment failed");
      } else {
        throw new Error("Payment form not ready");
      }

      const response = await fetch("http://localhost:8080/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Booking submission failed");

      const data = await response.json();
      console.log("Booking submitted:", data);
      alert("Booking completed successfully!");
      props.onSubmit?.(form);
    } catch (error) {
      console.error("Booking process failed:", error);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Booking
          </h1>
          <p className="text-gray-600">
            We're almost there! Just a few more details needed.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Form */}
          <div className="lg:col-span-2 space-y-6">
            <GuestDetailsForm
              form={form}
              errors={errors}
              onChange={updateForm}
            />
            <BillingAddressForm
              form={form}
              errors={errors}
              onChange={updateForm}
            />

            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm ref={paymentFormRef} />
              </Elements>
            )}

            <div className="bg-white p-6 rounded shadow mt-6">
              <button
                onClick={handleSubmit}
                disabled={loading || !clientSecret}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded transition disabled:cursor-not-allowed"
              >
                {loading
                  ? "Processing Payment & Booking..."
                  : "Complete Booking & Pay"}
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
