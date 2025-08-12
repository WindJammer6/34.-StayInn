import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import Hero from "../src/components/Hero.jsx";

// mocking destinationsjson data to replace the real data with test data regarding Singapore
vi.mock("../src/assets/destinations.json", () => ({
  default: [
    { term: "Singapore", uid: "sg-uid", type: "city" }
  ]
}));

// Mock Web Worker for suggestions
// should return Singapore if search term contains "sing" or "sinapore"
class MockWorker {
  constructor() { this.onmessage = null; }
  postMessage(message) {
    if (message.type === "search") {
      const q = message.payload.toLowerCase();
      let results = [];
      if (q.includes("sing")) {
        results = [
          { term: "Singapore", uid: "sg-uid", type: "city" }
        ];
      } else if (q.includes("sinapore")) {
        results = [{ term: "Singapore", uid: "sg-uid", type: "city" }];
      }
      setTimeout(() => this.onmessage?.({ data: { results } }), 50);
    }
  }
  terminate() {}
}
beforeAll(() => {
  vi.stubGlobal("Worker", MockWorker);
});

// navigate mock to redirect
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => {
  const actual = vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// reset mock before each test below
beforeEach(() => {
  vi.clearAllMocks();
});

// Integration test case IT-08 to IT-14 (test features are stated before each code)
describe("Hero Component Integration Tests", () => {

  it("IT-08: shows dropdown suggestions within 1-2 seconds when typing partial destination", async () => {
    render(<Hero />);
    const destInput = screen.getByPlaceholderText(/Type a city or hotel/i);
    await userEvent.type(destInput, "Sing");
    await waitFor(() => {
      const items = screen.getAllByRole("listitem");
      expect(items.length).toBeGreaterThan(0);
      expect(items.some(li => li.textContent.includes("Sing"))).toBe(true);
    }, { timeout: 2000 });
  });

  it("IT-09: shows closely related destination even with typo", async () => {
    render(<Hero />);
    const destInput = screen.getByPlaceholderText(/Type a city or hotel/i);
    await userEvent.type(destInput, "Sinapore");
    await waitFor(() => {
      const items = screen.getAllByRole("listitem");
      expect(items.some(li => /Singapore/i.test(li.textContent))).toBe(true);
    });
  });

  it("IT-10: clicking suggestion populates input", async () => {
    render(<Hero />);
    const destInput = screen.getByPlaceholderText(/Type a city or hotel/i);
    await userEvent.type(destInput, "Sing");
    const suggestion = await screen.findByText(/Singapore/i);
    await userEvent.click(suggestion);
    expect(destInput.value).toBe("Singapore");
  });

  it("IT-11: selecting check-in/check-out updates fields", async () => {
    render(<Hero />);
    const checkin = screen.getByLabelText(/check-in/i);
    const checkout = screen.getByLabelText(/check-out/i);
    const minCheckIn = checkin.getAttribute("min");
    const checkoutStr = new Date(new Date(minCheckIn).setDate(new Date(minCheckIn).getDate() + 2)).toISOString().slice(0, 10);
    await userEvent.clear(checkin);
    await userEvent.type(checkin, minCheckIn);
    await userEvent.clear(checkout);
    await userEvent.type(checkout, checkoutStr);
    expect(checkin.value).toBe(minCheckIn);
    expect(checkout.value).toBe(checkoutStr);
  });

  it("IT-12: blocks if destination not in list", async () => {
    render(<Hero />);
    const destInput = screen.getByPlaceholderText(/Type a city or hotel/i);
    const searchBtn = screen.getByRole("button", { name: /search/i });
    await userEvent.clear(destInput);
    await userEvent.type(destInput, "InvalidCity");
    await userEvent.click(searchBtn);
    const error = await screen.findByText(/please choose a destination from the list/i);
    expect(error).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("IT-13: blocks if required field empty", async () => {
    render(<Hero />);
    const destInput = screen.getByPlaceholderText(/Type a city or hotel/i);
    await userEvent.type(destInput, "Singapore");
    const searchBtn = screen.getByRole("button", { name: /search/i });
    await userEvent.click(searchBtn);
    expect(screen.getAllByText(/please select|please choose/i).length).toBeGreaterThan(0);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("IT-14: valid submission redirects with correct params", async () => {
    render(<Hero />);
    const destInput = screen.getByPlaceholderText(/Type a city or hotel/i);
    await userEvent.clear(destInput);
    await userEvent.type(destInput, "Sing");
    const singaporeOption = await screen.findByText("Singapore");
    await userEvent.click(singaporeOption);
    expect(destInput.value).toBe("Singapore");

    const checkin = screen.getByLabelText(/check-in/i);
    const checkout = screen.getByLabelText(/check-out/i);
    const minCheckIn = checkin.getAttribute("min");

    // valid dates
    await userEvent.clear(checkin);
    await userEvent.type(checkin, minCheckIn);
    const checkoutDate = new Date(minCheckIn);
    checkoutDate.setDate(checkoutDate.getDate() + 2);
    await userEvent.clear(checkout);
    await userEvent.type(checkout, checkoutDate.toISOString().slice(0, 10));

    const searchBtn = screen.getByRole("button", { name: /search/i });
    await userEvent.click(searchBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
      expect(mockNavigate.mock.calls[0][0]).toBe("/rooms");
    }, { timeout: 3000 });
  });

});
