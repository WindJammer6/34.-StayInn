import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RoomDetails from "@/pages/RoomDetails";
import { vi } from "vitest";

// Mock axios to intercept API requests
vi.mock("axios");

// Standard test hotel data
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
      price: 100,
      converted_price: 100,
      currency: "$",
      surcharges: [{ description: "Service Fee", amount: 10 }],
      market_rates: [{ supplier: "Expedia", rate: 150.0 }],
    },
  ],
  latitude: 1.23,
  longitude: 4.56,
};

// Data with image_details (image prefix/suffix pattern)
const mockHotelDataWithImageDetails = {
  ...mockHotelData,
  image_details: {
    count: 2,
    prefix: "https://cdn.example.com/img-",
    suffix: ".jpg",
  },
};

// Data with top-level images array
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

// Hotel data with empty rooms
const mockHotelDataWithNoRooms = {
  ...mockHotelData,
  rooms: [],
};

// Simulated router state passed to component
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

// Renders RoomDetails with MemoryRouter and route state
const renderComponent = () => {
  render(
    <MemoryRouter initialEntries={[{ pathname: "/", state }]}>
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

    expect(await screen.findByText("Room 1")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
    expect(screen.getByText("Free WiFi")).toBeInTheDocument();
    expect(screen.getByText("Air Conditioning")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
  });

  it("renders surcharge and market rate", async () => {
    axios.get.mockResolvedValueOnce({ data: mockHotelData });
    renderComponent();

    expect(
      await screen.findByText(/Taxes & fees included:/i)
    ).toBeInTheDocument();

    expect(screen.getByText("$10.00")).toBeInTheDocument();

    // Updated to match full string including supplier name
    expect(screen.getByText("Expedia: $150.00")).toBeInTheDocument();
  });

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

  it("shows 'No rooms available' when no rooms exist", async () => {
    axios.get.mockResolvedValueOnce({ data: mockHotelDataWithNoRooms });
    renderComponent();

    expect(await screen.findByText("No rooms available.")).toBeInTheDocument();
  });
});
