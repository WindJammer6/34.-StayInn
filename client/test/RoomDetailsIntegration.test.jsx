import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RoomDetails from "../src/pages/RoomDetails.jsx"
import axios from 'axios';
import '@testing-library/jest-dom';


// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} }))
  }
}));

vi.mock('../src/components/GoogleMapEmbed', () => ({
  default: () => <div>Google Map</div>
}));

// Mock router hooks
const mockNavigate = vi.fn();
const mockUseLocation = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation()
  };
});

const mockRoom = {
  key: 'room1',
  roomDescription: 'Deluxe Room',
  price: 200,
  converted_price: 200,
  currency: '$',
  images: [],
  amenities: [],
  rooms_available: 2, 
  free_cancellation: true, 
  surcharges: [
    { amount: 15, type: 'tax' },
    { amount: 10, type: 'fee' }
  ],
  market_rates: [
    { supplier: 'ABC', rate: 120 },
    { supplier: 'XYZ', rate: 150 }
  ]
};

const completeHotelData = {
  name: 'Test Hotel',
  image_details: {
    count: 3,
    prefix: 'http://test.com/img',
    suffix: '.jpg'
  },
  latitude: 40.7128,
  longitude: -74.0060,
  rooms: [mockRoom]
};

const mockLocationState = {
  state: {
    hotelId: 'test123',
    destinationId: 'dest456',
    checkin: '2023-12-01',
    checkout: '2023-12-05',
    lang: 'en_US',
    currency: 'USD',
    countryCode: 'US',
    guests: '2',
    hotelData: completeHotelData
  }
};

describe('RoomDetails Integration Tests', () => {
  beforeEach(() => {
    mockUseLocation.mockReturnValue(mockLocationState);
    axios.get.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders hotel name and basic information', async () => {
    render(
      <MemoryRouter>
        <RoomDetails />
      </MemoryRouter>
    );

    expect(await screen.findByText('Test Hotel')).toBeInTheDocument();
    expect(screen.getByText('Booking Summary')).toBeInTheDocument();
  });

  it('displays initial room cards without API call when data is complete', async () => {
    render(
      <MemoryRouter>
        <RoomDetails />
      </MemoryRouter>
    );

    // Find the card by its test id
    const card = await screen.findByTestId('room-card');
    // Find elements inside the card
    const roomDescription = screen.getByText((content, element) =>
      element.tagName.toLowerCase() === 'h3' && /deluxe room/i.test(content)
    );
    const price = screen.getByText('$200');
    const perNight = screen.getByText('per night');

    expect(card).toBeInTheDocument();
    expect(roomDescription).toBeInTheDocument();
    expect(price).toBeInTheDocument();
    expect(perNight).toBeInTheDocument();

    expect(card).toContainElement(roomDescription);
    expect(card).toContainElement(price);
    expect(card).toContainElement(perNight);

    expect(axios.get).not.toHaveBeenCalled();
  });

  it('fetches updated room data when hotelData is incomplete', async () => {
  // Setup incomplete data
  mockUseLocation.mockReturnValueOnce({
    state: {
      ...mockLocationState.state,
      hotelData: { name: 'Test Hotel' }
    }
  });

  // Mock API response
  axios.get.mockResolvedValueOnce({
    data: {
      ...completeHotelData,
      rooms: [{
        ...mockRoom,
        roomDescription: 'Updated Deluxe Room',
        price: 220
      }]
    }
  });

  render(
    <MemoryRouter>
      <RoomDetails />
    </MemoryRouter>
  );

  // Wait for API call and DOM update
  await waitFor(() => {
    expect(axios.get).toHaveBeenCalled();
  });

  // Debug print
  console.log(document.body.innerHTML);

  // Find all room cards
  const cards = await screen.findAllByTestId('room-card');
  expect(cards.length).toBeGreaterThan(0);
  const card = cards[0];

  const updatedDescription = await screen.findByText(
    (content, element) =>
      element.tagName.toLowerCase() === 'h3' && /updated deluxe room/i.test(content)
  );
  const updatedPrice = await screen.findByText('$220');
  const perNight = await screen.findByText('per night');

  expect(card).toBeInTheDocument();
  expect(updatedDescription).toBeInTheDocument();
  expect(updatedPrice).toBeInTheDocument();
  expect(perNight).toBeInTheDocument();

  expect(card).toContainElement(updatedDescription);
  expect(card).toContainElement(updatedPrice);
  expect(card).toContainElement(perNight);
});

  it('handles API errors and shows error message', async () => {
    // Setup incomplete data to force API call
    mockUseLocation.mockReturnValueOnce({
      state: {
        ...mockLocationState.state,
        hotelData: { name: 'Test Hotel' }
      }
    });

    // Mock API failure
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <MemoryRouter>
        <RoomDetails />
      </MemoryRouter>
    );

    // Verify error state
    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Failed to load hotel details. Please try again.')).toBeInTheDocument();
  });
});

describe('RoomDetails Edge Cases', () => {
  beforeEach(() => {
    mockUseLocation.mockReturnValue(mockLocationState);
    axios.get.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('handles rooms with missing prices gracefully', async () => {
    const roomWithoutPrice = {
      ...mockRoom,
      price: undefined,
      converted_price: undefined
    };

    mockUseLocation.mockReturnValueOnce({
      state: {
        ...mockLocationState.state,
        hotelData: {
          ...completeHotelData,
          rooms: [roomWithoutPrice]
        }
      }
    });

    render(
      <MemoryRouter>
        <RoomDetails />
      </MemoryRouter>
    );

    const card = await screen.findByTestId('room-card');
    expect(card).toBeInTheDocument();
    
    // More flexible text matching
    expect(screen.getByText((content) => content.includes('N/A'))).toBeInTheDocument();
  });

  it('handles rooms with missing descriptions', async () => {
    const roomWithoutDescription = {
      ...mockRoom,
      roomDescription: undefined,
      long_description: undefined
    };

    mockUseLocation.mockReturnValueOnce({
      state: {
        ...mockLocationState.state,
        hotelData: {
          ...completeHotelData,
          rooms: [roomWithoutDescription]
        }
      }
    });

    render(
      <MemoryRouter>
        <RoomDetails />
      </MemoryRouter>
    );

    const card = await screen.findByTestId('room-card');
    expect(card).toBeInTheDocument();
    expect(screen.getByText('Room')).toBeInTheDocument(); // Default fallback text
  });

  it('handles empty room arrays', async () => {
    mockUseLocation.mockReturnValueOnce({
      state: {
        ...mockLocationState.state,
        hotelData: {
          ...completeHotelData,
          rooms: []
        }
      }
    });

    render(
      <MemoryRouter>
        <RoomDetails />
      </MemoryRouter>
    );

    // Wait for component to render and check for exact text content
    await waitFor(() => {
      const element = screen.getByText(/no rooms available/i);
      expect(element).toBeInTheDocument();
      expect(element.textContent).toBe('No rooms available.');
    });
  });

it('handles missing location state gracefully', async () => {
  const mockState = {
    state: {
      // All these are explicitly null
      currency: null,
      hotelId: null,
      destinationId: null,
      checkin: null,
      checkout: null,
      lang: null,
      countryCode: null,
      guests: null,
      hotelData: null,
      defaultValues: {
        currency: 'SGD',
        hotelId: 'diH7',
        destinationId: 'WD0M',
        lang: 'en_US',
        countryCode: 'SG',
        guests: '2'
      }
    }
  };

  const mockApiResponse = {
    data: {
      name: 'Test Hotel',
      image_details: {
        count: 3,
        prefix: 'http://test.com/img',
        suffix: '.jpg'
      },
      latitude: 40.7128,
      longitude: -74.006,
      completed: true,
      rooms: [{
        key: 'room1',
        roomDescription: 'Deluxe Room',
        price: 200,
        converted_price: 200,
        currency: 'SGD',
        images: [],
        amenities: []
      }]
    }
  };

  mockUseLocation.mockReturnValue(mockState); // Use mockReturnValue instead of mockReturnValueOnce
  axios.get.mockResolvedValueOnce(mockApiResponse);

  render(
    <MemoryRouter>
      <RoomDetails />
    </MemoryRouter>
  );

  // Verify booking summary shows SGD
  const bookingCurrency = await screen.findByTestId('booking-summary-currency');
  expect(bookingCurrency).toHaveTextContent('SGD');

  // Verify room card shows SGD
  const roomPrice = await screen.findByTestId('room-price-room1');
  expect(roomPrice).toHaveTextContent('SGD200');
});

  it('handles network timeouts', async () => {
    mockUseLocation.mockReturnValueOnce({
      state: {
        ...mockLocationState.state,
        hotelData: { name: 'Test Hotel' }
      }
    });

    // Simulate a network timeout
    axios.get.mockRejectedValueOnce(new Error('Network timeout'));

    render(
      <MemoryRouter>
        <RoomDetails />
      </MemoryRouter>
    );

    // More flexible error text matching
    await waitFor(() => {
      expect(screen.getByText((content) => 
        content.includes('Something went wrong')
      )).toBeInTheDocument();
    });

    expect(screen.getByText((content) => 
      content.includes('Failed to load hotel details')
    )).toBeInTheDocument();
  });

  it('handles multiple rapid API calls', async () => {
    let apiCallCount = 0;
    axios.get.mockImplementation(() => {
      apiCallCount++;
      return Promise.resolve({
        data: {
          ...completeHotelData,
          rooms: [{ ...mockRoom, price: 200 + apiCallCount }]
        }
      });
    });

    const { rerender } = render(
      <MemoryRouter>
        <RoomDetails />
      </MemoryRouter>
    );

    // Trigger multiple rerenders rapidly
    for (let i = 0; i < 3; i++) {
      rerender(
        <MemoryRouter>
          <RoomDetails />
        </MemoryRouter>
      );
    }

    // Should debounce/handle multiple calls gracefully
    await waitFor(() => {
      expect(apiCallCount).toBeLessThanOrEqual(1);
    });
  });

  it('handles rooms with extremely long descriptions', async () => {
    const longDescription = 'A'.repeat(1000); // Very long description
    const roomWithLongDesc = {
      ...mockRoom,
      roomDescription: longDescription
    };

    mockUseLocation.mockReturnValueOnce({
      state: {
        ...mockLocationState.state,
        hotelData: {
          ...completeHotelData,
          rooms: [roomWithLongDesc]
        }
      }
    });

    render(
      <MemoryRouter>
        <RoomDetails />
      </MemoryRouter>
    );

    const card = await screen.findByTestId('room-card');
    expect(card).toBeInTheDocument();
    // Description should be rendered without breaking layout
    expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
  });
});

describe("RoomDetails additional integration cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 2. Image fallback for main gallery & room images
  it("replaces broken images with default fallback", async () => {
    render(
      <MemoryRouter>
        <RoomDetails />
      </MemoryRouter>
    );

    const img = await screen.findAllByRole("img");
    img.forEach((image) => {
      fireEvent.error(image);
      expect(image).toHaveAttribute("src", expect.stringContaining("hotelImage.png"));
    });
  });

  // 3. Hotel gallery modal (main gallery, +N overlay)
  it("opens and closes the hotel gallery modal", async () => {
    // Create mock data with 4 images to trigger the "+1" overlay (3 visible + 1 remaining)
    const mockHotelWithMultipleImages = {
      ...completeHotelData,
      image_details: {
        count: 4,
        prefix: 'http://test.com/img',
        suffix: '.jpg'
      }
    };

    // Override the mock data for this test
    mockUseLocation.mockReturnValueOnce({
      state: {
        ...mockLocationState.state,
        hotelData: mockHotelWithMultipleImages
      }
    });

    render(
      <MemoryRouter>
        <RoomDetails />
      </MemoryRouter>
    );

    // Find and click the overlay using test ID
    const overlay = await screen.findByTestId('gallery-overlay');
    expect(overlay).toHaveTextContent('+1'); // Verify it shows "+1"
    fireEvent.click(overlay);

    // Verify modal opens
    const modalTitle = await screen.findByText("Hotel Gallery");
    expect(modalTitle).toBeInTheDocument();

    // Close modal using the aria-label we added
    const closeButton = await screen.findByRole('button', { name: 'Close gallery' });
    fireEvent.click(closeButton);

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByText("Hotel Gallery")).not.toBeInTheDocument();
    });
  });

  // 4. Show more details toggle
  it("toggles additional room details visibility", async () => {
    // Create mock room with all required fields for the toggle to appear
    const mockRoomWithDetails = {
      ...mockRoom,
      images: [{ url: "test-image.jpg" }], // Add at least one image
      roomAdditionalInfo: {
        displayFields: {
          special_check_in_instructions: "Test check-in instructions",
          know_before_you_go: "Important information",
          fees_optional: "Additional fees may apply"
        }
      }
    };

    // Override the mock data for this test
    mockUseLocation.mockReturnValueOnce({
      state: {
        ...mockLocationState.state,
        hotelData: {
          ...completeHotelData,
          rooms: [mockRoomWithDetails]
        }
      }
    });

    render(
      <MemoryRouter>
        <RoomDetails />
      </MemoryRouter>
    );

    // Find the toggle button using its exact text
    const toggleBtn = await screen.findByRole("button", { 
      name: /show more details ▼|hide details ▲/i 
    });
    
    // Initial state should be "Show more details"
    expect(toggleBtn).toHaveTextContent(/show more details ▼/i);

    // Click to expand
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent(/hide details ▲/i);

    // Click to collapse
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent(/show more details ▼/i);
  });

  // 5. Reserve button triggers navigation with correct state
  it("navigates to booking confirmation with correct data", async () => {
  // Create complete mock data that matches what the component will pass
    const expectedHotelData = {
      ...completeHotelData,
      completed: true,
      rooms: [{
        ...mockRoom,
        price: 100,
        converted_price: 100,
        roomDescription: "Deluxe Room",
        rooms_available: 2
      }]
    };

    // Override the mock data for this test
    mockUseLocation.mockReturnValueOnce({
      state: {
        ...mockLocationState.state,
        hotelData: expectedHotelData
      }
    });

    render(
      <MemoryRouter>
        <RoomDetails />
      </MemoryRouter>
    );

    const reserveBtn = await screen.findByRole("button", { name: /reserve/i });
    fireEvent.click(reserveBtn);

    // Verify navigation with proper property names and structure
    expect(mockNavigate).toHaveBeenCalledWith(
      "/bookingconfirmation",
      expect.objectContaining({
        state: expect.objectContaining({
          hotelData: expectedHotelData,
          hotelId: "test123",
          destinationId: "dest456",
          checkIn: "2023-12-01",  // Note camelCase
          checkOut: "2023-12-05",  // Note camelCase
          lang: "en_US",
          currency: "USD",
          countryCode: "US",
          guests: "2",
          price: 100,
          quantity: 1,
          totalCost: 400,
          roomDescription: "Deluxe Room",
          defaultValues: {}
        })
      })
    );
  });

  // 6. Quantity and total price update
  it("increments and decrements quantity within limits", async () => {
    render(
      <MemoryRouter>
        <RoomDetails />
      </MemoryRouter>
    );

    // Wait for room card to load
    const card = await screen.findByTestId('room-card');
    
    // Find the quantity display - it's the span between the +/- buttons
    const quantityDisplay = within(card).getByText("1"); // Initial quantity
    
    // Get the buttons
    const plusBtn = within(card).getByRole("button", { name: "+" });
    const minusBtn = within(card).getByRole("button", { name: "–" });

    // Test increment
    fireEvent.click(plusBtn);
    expect(quantityDisplay).toHaveTextContent("2");

    // Test max limit (should stay at 2)
    fireEvent.click(plusBtn);
    expect(quantityDisplay).toHaveTextContent("2");

    // Test decrement
    fireEvent.click(minusBtn);
    expect(quantityDisplay).toHaveTextContent("1");

    // Test min limit (should stay at 1)
    fireEvent.click(minusBtn);
    expect(quantityDisplay).toHaveTextContent("1");
  });

  // 7. Labels for room availability and free cancellation
  it("shows availability and cancellation labels correctly", async () => {
  // Update mock room data to include availability and cancellation info
    const mockRoomWithAvailability = {
      ...mockRoom,
      rooms_available: 2, // This triggers the "Only X rooms left" message
      free_cancellation: true // This triggers the "Free Cancellation" label
    };

    // Override the mock data for this test
    mockUseLocation.mockReturnValueOnce({
      state: {
        ...mockLocationState.state,
        hotelData: {
          ...completeHotelData,
          rooms: [mockRoomWithAvailability]
        }
      }
    });

    render(
      <MemoryRouter>
        <RoomDetails />
      </MemoryRouter>
    );

    // Check for availability warning - now scoped to the room card
    const card = await screen.findByTestId('room-card');
    expect(within(card).getByText(/Only 2 rooms left!/i)).toBeInTheDocument();
    
    // Check for cancellation label
    expect(within(card).getByText(/Free Cancellation/i)).toBeInTheDocument();
  });

  // 8. Taxes, fees, and market rates
  it("displays surcharges and market rates", async () => {
    render(
      <MemoryRouter>
        <RoomDetails />
      </MemoryRouter>
    );

    // Wait for the room card to load
    const card = await screen.findByTestId('room-card');

    // Check for taxes and fees section
    const taxesFeesSection = within(card).getByText(/Taxes & fees included:/i);
    expect(taxesFeesSection).toBeInTheDocument();

    // Check for each surcharge amount individually
    expect(within(card).getByText(/\$15\.00/)).toBeInTheDocument();
    expect(within(card).getByText(/\$10\.00/)).toBeInTheDocument();

    // Check for market rates section
    const marketRatesSection = within(card).getByText(/Market Rates:/i);
    expect(marketRatesSection).toBeInTheDocument();

    // Check for each market rate
    expect(within(card).getByText(/ABC: \$120\.00/)).toBeInTheDocument();
    expect(within(card).getByText(/XYZ: \$150\.00/)).toBeInTheDocument();
  });

  // 9. Map embed contains correct coordinates
  it("renders Google Map iframe with correct coordinates", async () => {
    render(
      <MemoryRouter>
        <RoomDetails />
      </MemoryRouter>
    );

    const iframe = await screen.findByTitle("Hotel Location");
    expect(iframe).toHaveAttribute(
      "src", 
      expect.stringContaining("40.7128,-74.006")
    );
  });
});