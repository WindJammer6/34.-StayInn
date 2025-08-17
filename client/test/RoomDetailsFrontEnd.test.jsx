import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RoomDetails from "@/pages/RoomDetails";
import { vi } from "vitest";

vi.mock("axios");

const mockHotelData = {
  name: "Test Hotel",
  image_details: { count: 0 },
  rooms: [
    {
      key: "1",
      images: [],
      roomDescription: "Room 1",
      long_description: "<p>Test description</p>",
      amenities: ["Free WiFi", "Air Conditioning"],
      nightly_price: 100,
      price: 700,
      converted_price: 700,
      currency: "$",
      surcharges: [{ description: "Service Fee", amount: 10 }],
      market_rates: [{ supplier: "Expedia", rate: 150.0 }],
    },
  ],
  latitude: 1.23,
  longitude: 4.56,
};

const mockHotelDataWithImageDetails = {
  ...mockHotelData,
  image_details: {
    count: 2,
    prefix: "https://cdn.example.com/img-",
    suffix: ".jpg",
  },
};

const mockHotelDataWithImages = {
  ...mockHotelData,
  images: [
    {
      url: "https://images.com/h1.jpg",
      high_resolution_url: "https://images.com/hr-h1.jpg",
    },
    { url: "https://images.com/h2.jpg" },
  ],
  rooms: [],
};

const mockHotelDataWithNoRooms = { ...mockHotelData, rooms: [] };

const state = {
  hotelId: "h1",
  destinationId: "d1",
  checkin: "2025-10-10",
  checkout: "2025-10-17",
  lang: "en_US",
  currency: "SGD",
  countryCode: "SG",
  guests: "2",
  hotelData: null,
  defaultValues: {},
};

const renderComponent = () => {
  render(
    <MemoryRouter initialEntries={[{ pathname: "/", state }]}>
      <Routes>
        <Route path="/" element={<RoomDetails />} />
      </Routes>
    </MemoryRouter>
  );
};

const renderWithState = (override = {}) => {
  const merged = { ...state, ...override };
  render(
    <MemoryRouter initialEntries={[{ pathname: "/", state: merged }]}>
      <Routes>
        <Route path="/" element={<RoomDetails />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("RoomDetails Component", () => {
  it("displays loading spinner initially", () => {
    axios.get.mockReturnValueOnce(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText(/Loading hotel details/i)).toBeInTheDocument();
  });

  it("renders hotel name and booking summary on success", async () => {
    axios.get.mockResolvedValueOnce({ data: mockHotelData });
    renderComponent();
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Test Hotel"
    );
    expect(screen.getByText(/Booking Summary/)).toBeInTheDocument();
    expect(screen.getByText(/Check-in/)).toBeInTheDocument();
    expect(screen.getByText(/Check-out/)).toBeInTheDocument();
    expect(screen.getByText(/Guests/)).toBeInTheDocument();
    expect(screen.getByText("Rooms")).toBeInTheDocument();
    expect(screen.getByText(/Currency/)).toBeInTheDocument();
  });

  it("renders hotel room details correctly", async () => {
    axios.get.mockResolvedValueOnce({ data: mockHotelData });
    renderComponent();
    await screen.findByText("Room 1");
    expect(screen.getByText("Test description")).toBeInTheDocument();
    expect(screen.getByText("Free WiFi")).toBeInTheDocument();
    expect(screen.getByText("Air Conditioning")).toBeInTheDocument();
    expect(screen.getByTestId("room-price-1")).toHaveTextContent("$700");
  });

  it("renders surcharge and market rate", async () => {
    axios.get.mockResolvedValueOnce({ data: mockHotelData });
    renderComponent();
    expect(
      await screen.findByText(/Taxes & fees included:/i)
    ).toBeInTheDocument();
    expect(screen.getByText("$10.00")).toBeInTheDocument();
    expect(screen.getByText("Expedia: $150.00")).toBeInTheDocument();
  });

  it("renders hotel images from image_details", async () => {
    axios.get.mockResolvedValueOnce({ data: mockHotelDataWithImageDetails });
    renderComponent();
    const img = await screen.findByAltText("Hotel image 1");
    expect(img).toHaveAttribute("src", "https://cdn.example.com/img-0.jpg");
  });

  it("renders hotel images from top-level images array", async () => {
    axios.get.mockResolvedValueOnce({ data: mockHotelDataWithImages });
    renderComponent();
    const imgs = await screen.findAllByAltText("Hotel image");
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toHaveAttribute("src", "https://images.com/hr-h1.jpg");
  });
});

describe("Edge Cases", () => {
  it("disables '+' when rooms_available = 1 and total stays correct", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        ...mockHotelData,
        rooms: [
          {
            ...mockHotelData.rooms[0],
            rooms_available: 1,
            price: 100,
            converted_price: 100,
          },
        ],
      },
    });
    renderComponent();
    await screen.findByText("Room 1");
    const inc = await screen.findByRole("button", { name: "+" });
    const dec = await screen.findByRole("button", { name: /^(−|–|-)$/ });
    expect(screen.getByTestId("room-price-1")).toHaveTextContent("$100");
    const total = screen.getByText(/^Total:/i);
    expect(total).toHaveTextContent("$100");
    expect(inc).toBeDisabled();
    await userEvent.click(dec);
    expect(total).toHaveTextContent("$100");
  });

  it("increments/decrements when rooms_available = 2 and caps at max", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        ...mockHotelData,
        rooms: [
          {
            ...mockHotelData.rooms[0],
            rooms_available: 2,
            price: 120,
            converted_price: 120,
          },
        ],
      },
    });
    renderComponent();
    await screen.findByText("Room 1");
    const inc = await screen.findByRole("button", { name: "+" });
    const dec = await screen.findByRole("button", { name: /^(−|–|-)$/ });
    expect(screen.getByTestId("room-price-1")).toHaveTextContent("$120");
    const total = screen.getByText(/^Total:/i);
    expect(total).toHaveTextContent("$120");
    await userEvent.click(inc);
    expect(total).toHaveTextContent("$240");
    expect(inc).toBeDisabled();
    await userEvent.click(dec);
    expect(total).toHaveTextContent("$120");
  });

  it("uses converted_price when price missing", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        ...mockHotelData,
        rooms: [
          {
            ...mockHotelData.rooms[0],
            price: null,
            converted_price: 88,
            surcharges: [],
            market_rates: [],
          },
        ],
      },
    });
    renderComponent();
    await screen.findByText("Room 1");
    expect(screen.getByTestId("room-price-1")).toHaveTextContent("$88");
    expect(
      screen.queryByText(/Taxes & fees included:/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Market Rates:/i)).not.toBeInTheDocument();
  });

  it("renders safely if long_description is missing", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        ...mockHotelData,
        rooms: [{ ...mockHotelData.rooms[0], long_description: "" }],
      },
    });
    renderComponent();
    await screen.findByText("Room 1");
    expect(screen.getByText("Free WiFi")).toBeInTheDocument();
    expect(screen.getByTestId("room-price-1")).toHaveTextContent("$700");
  });

  it("computes Booking Summary correctly for guests '2|1|0'", async () => {
    axios.get.mockResolvedValueOnce({ data: mockHotelData });
    renderWithState({ guests: "2|1|0" });
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByText("Guests").nextSibling).toHaveTextContent("3");
    expect(screen.getByText("Rooms").nextSibling).toHaveTextContent("3");
  });

  it("computes Booking Summary correctly for single-room guests '3'", async () => {
    axios.get.mockResolvedValueOnce({ data: mockHotelData });
    renderWithState({ guests: "3" });
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByText("Guests").nextSibling).toHaveTextContent("3");
    expect(screen.getByText("Rooms").nextSibling).toHaveTextContent("1");
  });
});

describe("Negative Cases", () => {
  it("shows error and Go Back button on fetch failure", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network Error"));
    renderComponent();
    expect(
      await screen.findByText(/Failed to load hotel details/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Go Back/i })
    ).toBeInTheDocument();
  });

  it("shows 'No rooms available' when no rooms exist", async () => {
    axios.get.mockResolvedValueOnce({ data: mockHotelDataWithNoRooms });
    renderComponent();
    expect(await screen.findByText("No rooms available.")).toBeInTheDocument();
  });

  it("shows 'N/A' price and Total $0 when both price and converted_price missing", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        ...mockHotelData,
        rooms: [
          {
            ...mockHotelData.rooms[0],
            price: undefined,
            converted_price: undefined,
            surcharges: [],
            market_rates: [],
          },
        ],
      },
    });
    renderComponent();
    await screen.findByText("Room 1");
    expect(screen.getByTestId("room-price-1")).toHaveTextContent("N/A");
    expect(screen.getByText(/^Total:/i)).toHaveTextContent("$0");
  });

  it("handles malformed payload where rooms is null", async () => {
    axios.get.mockResolvedValueOnce({
      data: { ...mockHotelData, rooms: null },
    });
    renderComponent();
    expect(await screen.findByText("No rooms available.")).toBeInTheDocument();
  });
});
