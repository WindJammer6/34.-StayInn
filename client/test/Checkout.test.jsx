import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Import the actual BookingPage component
import BookingPage from '../src/pages/BookingPage'; // Adjust this path to match your project structure

// Mock dependencies
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    confirmPayment: vi.fn().mockResolvedValue({ error: null }),
    retrievePaymentIntent: vi.fn().mockResolvedValue({ paymentIntent: { status: 'succeeded' } })
  }))
}));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => <div data-testid="stripe-elements">{children}</div>,
  useStripe: () => ({
    confirmPayment: vi.fn().mockResolvedValue({ error: null })
  }),
  useElements: () => ({
    getElement: vi.fn()
  })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    useLocation: vi.fn(() => ({
      state: {
        hotelData: { 
          name: 'Test Hotel', 
          address: 'Test Address', 
          rating: '9.0',
          amenities: [
            { name: "Free Wi-Fi", icon: null },
            { name: "Room Service", icon: null }
          ]
        },
        hotelId: 'test123',
        destinationId: 'dest123',
        checkIn: '2025-08-15',
        checkOut: '2025-08-17',
        lang: 'en_US',
        currency: 'SGD',
        countryCode: 'SG',
        guests: '2',
        price: '500.00',
        quantity: '1',
        totalCost: '500.00',
        roomDescription: 'Test Room'
      }
      
    }))
  };
});

// Mock child components with realistic implementations
vi.mock('../src/components/BookingPage/HotelCard', () => ({
  default: ({ hotel }) => (
    <div data-testid="hotel-card">
      <h3 data-testid="hotel-name">{hotel.name}</h3>
      <p data-testid="hotel-address">{hotel.address}</p>
      <span data-testid="hotel-rating">Rating: {hotel.rating}</span>
      {hotel.amenities && hotel.amenities.map((amenity, index) => (
        <div key={index} data-testid={`amenity-${index}`}>
          {amenity.name}
        </div>
      ))}
    </div>
  )
}));

vi.mock('../src/components/BookingPage/BookingDetails', () => ({
  default: ({ booking, pricing }) => (
    <div data-testid="booking-details">
      <p data-testid="checkin">Check-in: {booking.checkIn}</p>
      <p data-testid="checkout">Check-out: {booking.checkOut}</p>
      <p data-testid="room-type">Room: {booking.roomType}</p>
      <p data-testid="nights">Nights: {booking.nights}</p>
      <p data-testid="guests">Guests: {booking.guests}</p>
      <p data-testid="total">Total: ${pricing.total}</p>
      {pricing.items && pricing.items.map((item, index) => (
        <div key={index} data-testid={`pricing-item-${index}`}>
          {item.desc}: {item.amount}
        </div>
      ))}
    </div>
  )
}));

vi.mock('../src/components/BookingPage/GuestDetailsForm', () => ({
  default: ({ form, errors, onChange }) => (
    <div data-testid="guest-details-form">
      <input
        data-testid="first-name"
        name="firstName"
        value={form.firstName || ''}
        onChange={onChange}
        placeholder="First Name"
      />
      <input
        data-testid="last-name"
        name="lastName"
        value={form.lastName || ''}
        onChange={onChange}
        placeholder="Last Name"
      />
      <input
        data-testid="phone-number"
        name="phoneNumber"
        value={form.phoneNumber || ''}
        onChange={onChange}
        placeholder="Phone Number"
      />
      <input
        data-testid="email"
        name="emailAddress"
        value={form.emailAddress || ''}
        onChange={onChange}
        placeholder="Email"
      />
      <select
        data-testid="salutation"
        name="salutation"
        value={form.salutation || ''}
        onChange={onChange}
      >
        <option value="">Select</option>
        <option value="Mr">Mr</option>
        <option value="Ms">Ms</option>
      </select>
      <textarea
        data-testid="special-requests"
        name="specialRequests"
        value={form.specialRequests || ''}
        onChange={onChange}
        placeholder="Special Requests"
      />
      {errors.firstName && <span data-testid="first-name-error">{errors.firstName}</span>}
      {errors.lastName && <span data-testid="last-name-error">{errors.lastName}</span>}
      {errors.phoneNumber && <span data-testid="phone-error">{errors.phoneNumber}</span>}
      {errors.emailAddress && <span data-testid="email-error">{errors.emailAddress}</span>}
    </div>
  )
}));

vi.mock('../src/components/BookingPage/BillingAddressForm', () => ({
  default: ({ form, errors, onChange }) => (
    <div data-testid="billing-address-form">
      <input
        data-testid="billing-first-name"
        name="billingFirstName"
        value={form.billingFirstName || ''}
        onChange={onChange}
        placeholder="Billing First Name"
      />
      <input
        data-testid="billing-last-name"
        name="billingLastName"
        value={form.billingLastName || ''}
        onChange={onChange}
        placeholder="Billing Last Name"
      />
      <input
        data-testid="billing-phone"
        name="billingPhoneNumber"
        value={form.billingPhoneNumber || ''}
        onChange={onChange}
        placeholder="Billing Phone"
      />
      <input
        data-testid="billing-email"
        name="billingEmailAddress"
        value={form.billingEmailAddress || ''}
        onChange={onChange}
        placeholder="Billing Email"
      />
      <select
        data-testid="country"
        name="country"
        value={form.country || 'SG'}
        onChange={onChange}
      >
        <option value="SG">Singapore</option>
        <option value="US">United States</option>
      </select>
      <input
        data-testid="state-province"
        name="stateProvince"
        value={form.stateProvince || ''}
        onChange={onChange}
        placeholder="State/Province"
      />
      <input
        data-testid="postal-code"
        name="postalCode"
        value={form.postalCode || ''}
        onChange={onChange}
        placeholder="Postal Code"
      />
      {errors.billingFirstName && <span data-testid="billing-first-name-error">{errors.billingFirstName}</span>}
      {errors.country && <span data-testid="country-error">{errors.country}</span>}
    </div>
  )
}));

vi.mock('../src/components/BookingPage/CheckoutForm', () => {
  const CheckoutForm = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      submitPayment: vi.fn().mockResolvedValue({
        success: true,
        paymentIntent: { id: 'pi_test_123', status: 'succeeded' }
      })
    }));

    return (
      <div data-testid="checkout-form">
        <div>Payment Form</div>
        <input data-testid="card-number" placeholder="Card Number" />
        <input data-testid="expiry" placeholder="MM/YY" />
        <input data-testid="cvv" placeholder="CVV" />
      </div>
    );
  });
  
  CheckoutForm.displayName = 'CheckoutForm';
  return { default: CheckoutForm };
});

vi.mock('../src/components/BookingPage/utils', () => ({
  validateForm: vi.fn((form) => {
    const errors = {};
    if (!form.firstName) errors.firstName = 'First name is required';
    if (!form.lastName) errors.lastName = 'Last name is required';
    if (!form.phoneNumber) errors.phoneNumber = 'Phone number is required';
    if (!form.emailAddress) errors.emailAddress = 'Email is required';
    if (!form.billingFirstName) errors.billingFirstName = 'Billing first name is required';
    return errors;
  })
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock window.alert to prevent popups in tests
global.alert = vi.fn();


const renderBookingPage = (props = {}) => {
  return render(
    <BrowserRouter>
      <BookingPage {...props} />
    </BrowserRouter>
  );

};

describe('BookingPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks(); 
    global.fetch.mockClear();
    global.alert.mockClear();

    
    // Mock successful payment intent creation
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ 
        clientSecret: 'pi_test_client_secret_123' 
      })
    });

    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();

  });

  describe('Component Rendering', () => {
    it('renders the main booking page elements', async () => {
      await renderBookingPage();
      
      // expect(await screen.findByText(/Complete Your Booking/i)).toBeInTheDocument();Testing01
      

      expect(screen.getByText('Complete Your Booking')).toBeInTheDocument();
      expect(screen.getByText("We're almost there! Just a few more details needed.")).toBeInTheDocument();
      expect(screen.getByTestId('guest-details-form')).toBeInTheDocument();
      expect(screen.getByTestId('billing-address-form')).toBeInTheDocument();
      expect(screen.getByTestId('hotel-card')).toBeInTheDocument();
      expect(screen.getByTestId('booking-details')).toBeInTheDocument();

      
      // Wait for payment intent to load
      await waitFor(() => {
        expect(screen.getByTestId('stripe-elements')).toBeInTheDocument(); 
      }, {timeout: 10000 }); 
    });

    it('displays hotel information correctly', async () => {
      await renderBookingPage();
      
      expect(screen.getByTestId('hotel-name')).toHaveTextContent('Test Hotel');
      expect(screen.getByTestId('hotel-address')).toHaveTextContent('Test Address');
      expect(screen.getByTestId('hotel-rating')).toHaveTextContent('Rating: 9.0');
    });

    it('displays booking details correctly', async () => {
      await renderBookingPage();
      
      expect(screen.getByTestId('checkin')).toHaveTextContent('Check-in: 2025-08-15');
      expect(screen.getByTestId('checkout')).toHaveTextContent('Check-out: 2025-08-17');
      expect(screen.getByTestId('room-type')).toHaveTextContent('Room: Test Room');
    });

    it('shows payment form when client secret is available', async () => {
      await renderBookingPage();

      await waitFor(() => {
        expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
        expect(screen.getByTestId('checkout-form')).toBeInTheDocument();
      }, {timeout: 10000 });
    });

    it('renders submit button with correct text', async () => {
      await renderBookingPage();
      
      await waitFor(() => {
        const submitButton = screen.getByText('Complete Booking & Pay');
        expect(submitButton).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      }, {timeout: 10000 });
    });
  });

  describe('Form Interactions', () => {
    it('updates form state when user types in inputs', async () => {
      await renderBookingPage();
      
      const firstNameInput = screen.getByTestId('first-name');
      const billingFirstNameInput = screen.getByTestId('billing-first-name');
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(billingFirstNameInput, { target: { value: 'Jane' } });
      
      expect(firstNameInput.value).toBe('John');
      expect(billingFirstNameInput.value).toBe('Jane');
    });

    // it('clears validation errors when user starts typing', async () => {
    //   await renderBookingPage();
      
    //   // Wait for component to be ready
    //   await waitFor(() => {
    //     expect(screen.getByText('Complete Booking & Pay')).toBeInTheDocument();
    //   }, {timeout: 10000 });

    //   // First trigger validation by submitting empty form
    //   const submitButton = screen.getByText('Complete Booking & Pay');
    //   fireEvent.click(submitButton);
      
    //   // Wait for error to appear
    //   await waitFor(() => {
    //     expect(screen.getByTestId('first-name-error')).toBeInTheDocument('First name is required');
    //   });
      
    //   // Type in the field
    //   const firstNameInput = screen.getByTestId('first-name');
    //   fireEvent.change(firstNameInput, { target: { value: 'John' } });
      
    //   expect(firstNameInput.value).toBe('John');
      
    //   alertSpy.mockRestore();
    // });
  });

  // describe('Form Validation', () => {
  //   it('shows validation errors when form is incomplete', async () => {
      
  //     await renderBookingPage();
      
  //     await waitFor(() => {
  //       expect(screen.getByText('Complete Booking & Pay')).toBeInTheDocument();
  //     }, {timeout: 10000 });

  //     const submitButton = screen.getByText('Complete Booking & Pay');
  //     fireEvent.click(submitButton);
      
  //     await waitFor(() => {
  //       // expect(alertSpy).toHaveBeenCalledWith('Please fill in all required fields correctly.');
  //       expect(global.alert).toHaveBeenCalledWith('Please fill in all required fields correctly.');
  //       expect(screen.getByTestId('first-name-error')).toBeInTheDocument('First name is required');
  //     });
      
  //     alertSpy.mockRestore();
  //   });

  //   it('validates required fields correctly', async () => {
  //     await renderBookingPage();
      
  //     await waitFor(() => {
  //       expect(screen.getByText('Complete Booking & Pay')).toBeInTheDocument();
  //     }, {timeout: 10000 });

  //     const submitButton = screen.getByText('Complete Booking & Pay');
  //     fireEvent.click(submitButton);
      
  //     // Check that validation errors appear for required fields
  //     await waitFor(() => {
  //       expect(screen.getByTestId('first-name-error')).toHaveTextContent('First name is required');
  //     });
  //   });
  // });

    describe('API Integration', () => {
      it('creates payment intent on component mount', async () => {
        await renderBookingPage();
        
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:8080/api/create-payment-intent',
            expect.objectContaining({
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                currency: 'SGD',
                amount: '500.00'
              })
            })
          );
        }, { timeout: 10000 });
      });
    });



    it('handles payment intent creation failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      await renderBookingPage();
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to create payment intent:', expect.any(Error));
      }, {timeout: 10000 });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Form Submission', () => {
    it('processes successful form submission', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const onSubmitMock = vi.fn();
      
      // Mock successful booking API call
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ clientSecret: 'pi_test_123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ success: true, bookingId: '12345' })
        });
      
      await renderBookingPage({ onSubmit: onSubmitMock });
      
      // Wait for component to be ready
      await waitFor(() => {
        expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
      }, {timeout: 10000 });

      // Fill in required fields
      const firstNameInput = screen.getByTestId('first-name');
      const lastNameInput = screen.getByTestId('last-name');
      const phoneInput = screen.getByTestId('phone-number');
      const emailInput = screen.getByTestId('email');
      const billingFirstNameInput = screen.getByTestId('billing-first-name');
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(phoneInput, { target: { value: '1234567890' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(billingFirstNameInput, { target: { value: 'John' } });
      
      const submitButton = screen.getByText('Complete Booking & Pay');
      fireEvent.click(submitButton);
      
      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Processing Payment & Booking...')).toBeInTheDocument();
      }, {timeout: 10000 });
    });
  });

  describe('Props Handling', () => {
    it('uses provided props over default values', async () => {
      const customProps = {
        hotel: {
          name: 'Custom Hotel',
          address: 'Custom Address',
          rating: '8.5',
          amenities: []
        },
        booking: {
          checkIn: '2025-09-01',
          checkOut: '2025-09-03',
          roomType: 'Custom Room',
          nights: 2,
          guests: '4'
        },
        pricing: {
          items: [{ desc: 'Custom item', amount: '$100' }],
          total: '100'
        }
      };
      
      await renderBookingPage(customProps);
      
      expect(screen.getByTestId('hotel-name')).toHaveTextContent('Custom Hotel');
      expect(screen.getByTestId('hotel-address')).toHaveTextContent('Custom Address');
      expect(screen.getByTestId('hotel-rating')).toHaveTextContent('Rating: 8.5');
    });
  });

  describe('Error Handling', () => {
    it('handles missing required fields gracefully', async () => {
      await renderBookingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Complete Booking & Pay')).toBeInTheDocument();
      }, {timeout: 10000 });

      const submitButton = screen.getByText('Complete Booking & Pay');
      
      // Should not throw error when clicking with empty form
      expect(() => fireEvent.click(submitButton)).not.toThrow();
    });

    // it('displays appropriate error messages', async () => {
    //   await renderBookingPage();
      
    //   await waitFor(() => {
    //     expect(screen.getByText('Complete Booking & Pay')).toBeInTheDocument();
    //   }, {timeout: 10000 });

    //   const submitButton = screen.getByText('Complete Booking & Pay');
    //   fireEvent.click(submitButton);

    //   console.log(screen.debug());

      
    //   await waitFor(() => {
    //     expect(screen.getByTestId('first-name-error')).toHaveTextContent('First name is required');
    //   }, {timeout: 10000 });
    // });
  });
