// test/HeroUTfrontend.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, beforeEach, expect } from "vitest";
import Hero from "../src/components/Hero.jsx";

// Mock navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock Worker
class MockWorker {
  constructor() {
    this.postMessage = vi.fn();
    this.terminate = vi.fn();
  }
}
vi.stubGlobal("Worker", MockWorker);

describe("Hero.jsx - Frontend Unit Tests", () => {
  let workerInstance;
  beforeEach(() => {
    vi.clearAllMocks();
    workerInstance = new Worker();
    vi.stubGlobal("Worker", vi.fn(() => workerInstance));
  });

  // UT-01-001 / UT-01-002
  it("UT-01-001/002: Worker is instantiated and sends init message with destinations", () => {
    render(<MemoryRouter><Hero /></MemoryRouter>);
    expect(Worker).toHaveBeenCalled();
    expect(workerInstance.postMessage).toHaveBeenCalledWith({
      type: "init",
      payload: expect.any(Array),
    });
  });

  // UT-01-003
  it("UT-01-003: Sends search message when user types valid input", async () => {
    render(<MemoryRouter><Hero /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText(/type a city/i), { target: { value: "Lon" } });
    await waitFor(() => {
      expect(workerInstance.postMessage).toHaveBeenCalledWith({
        type: "search",
        payload: "Lon",
      });
    });
  });

  // UT-01-004
  it("UT-01-004: Skips sending search for empty/whitespace input", () => {
    render(<MemoryRouter><Hero /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText(/type a city/i), { target: { value: "   " } });
    expect(workerInstance.postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "search" })
    );
  });

  // UT-01-005
  it("UT-01-005: Suggestions update when worker sends results", async () => {
    render(<MemoryRouter><Hero /></MemoryRouter>);
    workerInstance.onmessage({ data: { results: [{ term: "London", uid: "A1", type: "city" }] } });
    expect(await screen.findByText(/London/)).toBeInTheDocument();
  });

  // UT-02-001
  it("UT-02-001: Min check-in date is today+3 days", () => {
    render(<MemoryRouter><Hero /></MemoryRouter>);
    const checkInInput = screen.getByLabelText(/check-in/i);
    const expected = new Date();
    expected.setDate(expected.getDate() + 3);
    expect(checkInInput.min).toBe(expected.toISOString().slice(0, 10));
  });

  // UT-02-002
  it("UT-02-002: Check-out min date is +1 day after selected check-in", () => {
    render(<MemoryRouter><Hero /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/check-in/i), {
      target: { value: "2025-12-01" },
    });
    expect(screen.getByLabelText(/check-out/i).min).toBe("2025-12-02");
  });

  // UT-03-002/004
  it("UT-03-002/004: Decrement buttons disabled at min limits", () => {
    render(<MemoryRouter><Hero initialRooms={1} initialGuestsPerRoom={1} /></MemoryRouter>);
    expect(screen.getByLabelText(/decrease rooms/i)).toBeDisabled();
    expect(screen.getByLabelText(/decrease guests per room/i)).toBeDisabled();
  });

  // UT-03-006
  it("UT-03-006: Error if totalGuests < rooms", async () => {
    render(<MemoryRouter><Hero initialRooms={3} initialGuestsPerRoom={0} initialDestination="Rome, Italy" /></MemoryRouter>);
    fireEvent.click(screen.getByText(/^search$/i));
    expect(await screen.findByText(/each room must have at least 1 guest/i)).toBeInTheDocument();
  });

  // UT-03-007
  it("UT-03-007: Error if totalGuests > maxTotalGuests", async () => {
    render(<MemoryRouter><Hero initialRooms={5} initialGuestsPerRoom={3} initialDestination="Rome, Italy" /></MemoryRouter>);
    fireEvent.click(screen.getByText(/^search$/i));
    expect(await screen.findByText(/total guests cannot exceed 10/i)).toBeInTheDocument();
  });

  // UT-04-001
  it("UT-04-001: Shows destination error if empty after submit", async () => {
    render(<MemoryRouter><Hero initialDestination="" /></MemoryRouter>);
    fireEvent.click(screen.getByText(/^search$/i));
    expect(await screen.findByText(/please choose a destination from the list\./i)).toBeInTheDocument();
  });

  // UT-04-002 - Optional: bad destination not in list
  it("UT-04-002: Shows destination error if not in list", async () => {
    render(<MemoryRouter><Hero initialDestination="MadeUpPlace" /></MemoryRouter>);
    fireEvent.click(screen.getByText(/^search$/i));
    expect(await screen.findByText(/please choose a destination from the list\./i)).toBeInTheDocument();
  });

  // UT-04-003a - NEW: Empty check-in date
  it("UT-04-003a: Shows error if check-in date missing", async () => {
    render(<MemoryRouter><Hero initialDestination="Rome, Italy" /></MemoryRouter>);
    fireEvent.click(screen.getByText(/^search$/i));
    expect(await screen.findByText(/please select a check-in date\./i)).toBeInTheDocument();
  });

  // UT-04-003b: Invalid (before minCheckIn)
  it("UT-04-003b: Shows error if check-in date before min", async () => {
    render(<MemoryRouter><Hero initialDestination="Rome, Italy" /></MemoryRouter>);
    const tooEarly = new Date();
    tooEarly.setDate(tooEarly.getDate() + 1);
    fireEvent.change(screen.getByLabelText(/check-in/i), {
      target: { value: tooEarly.toISOString().slice(0, 10) },
    });
    fireEvent.click(screen.getByText(/^search$/i));
    expect(await screen.findByText(/check-in date can't be before/i)).toBeInTheDocument();
  });

  // UT-04-004a - NEW: Empty check-out date
  it("UT-04-004a: Shows error if check-out date missing", async () => {
    render(<MemoryRouter><Hero initialDestination="Rome, Italy" initialCheckIn="2025-12-01" /></MemoryRouter>);
    fireEvent.click(screen.getByText(/^search$/i));
    expect(await screen.findByText(/please select a check-out date\./i)).toBeInTheDocument();
  });

  // UT-04-004b: Invalid (same as check-in)
  it("UT-04-004b: Shows error if check-out date ≤ check-in date", async () => {
    render(<MemoryRouter><Hero initialDestination="Rome, Italy" /></MemoryRouter>);
    const date = new Date();
    date.setDate(date.getDate() + 3);
    const dateStr = date.toISOString().slice(0, 10);
    fireEvent.change(screen.getByLabelText(/check-in/i), { target: { value: dateStr } });
    fireEvent.change(screen.getByLabelText(/check-out/i), { target: { value: dateStr } });
    fireEvent.click(screen.getByText(/^search$/i));
    expect(await screen.findByText(/check-out date cannot be before or equal to check-in date\./i))
      .toBeInTheDocument();
  });
});
