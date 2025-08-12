import { act, render, screen, within, waitFor, waitForElementToBeRemoved, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import Hotels from "../src/pages/Hotels.jsx"
import { vi } from 'vitest';

vi.mock('axios');

const useLocationMock = vi.fn(() => ({ state: currentRouterState }));
vi.mock('react-router-dom', () => ({
  MemoryRouter: ({ children }) => children,
  useNavigate: () => vi.fn(),
  useLocation: () => useLocationMock(),
}));

let currentRouterState = {
    destinationId: "WD0M",
    checkIn: "2025-10-10",  
    checkOut: "2025-10-17", 
    currency: "SGD",
    countryCode: "SG",
    guestsPerRoom: "2",
    rooms: "1",
    lang: "en_US",
    destLabel: "Singapore, Singapore"
};

class MockWorker {
    constructor() {
        this.onmessage = null;
    }
    postMessage() {}
    terminate() {}
}

// Mock the Worker globally
global.Worker = MockWorker;
global.URL = {
    createObjectURL: vi.fn(),
    revokeObjectURL: vi.fn(),
}

class MockURL {
    constructor(url, base) {
        return {
            href: url,
            origin: 'http://localhost',
            protocol: 'http:',
            host: 'localhost',
            hostname: 'localhost',
            port: '',
            pathname: url,
            search: '',
            hash: ''
        }
    }
}
global.URL = MockURL;
global.URL.createObjectURL = vi.fn().mockReturnValue("mockedURL");
global.URL.revokeObjectURL = vi.fn();
global.URL.createObjectURL.mockReturnValue("mockedURL");

const mockHotelData = [
    { id: 'h1', name: 'Hotel 1', address: 'Addr 1', rating: 1.1, description: 'Desc 1', "trustyou": {"score": {"overall": 1.1}} },
    { id: 'h2', name: 'Hotel 2', address: 'Addr 2', rating: 2.2, description: 'Desc 2', "trustyou": {"score": {"overall": 2.2}} },
    { id: 'h3', name: 'Hotel 3', address: 'Addr 3', rating: 3.3, description: 'Desc 3', "trustyou": {"score": {"overall": 3.3}} },
    { id: 'h4', name: 'Hotel 4', address: 'Addr 4', rating: 4.4, description: 'Desc 4', "trustyou": {"score": {"overall": 4.4}} },
    { id: 'h5', name: 'Hotel 5', address: 'Addr 5', rating: 5.5, description: 'Desc 5', "trustyou": {"score": {"overall": 5.5}} },
]

const mockPriceData = {
    hotels: [
        { id: 'h1', lowest_price: 123 },
        { id: 'h2', lowest_price: 249 }, // boundary 
        { id: 'h3', lowest_price: 250 }, // boundary
        { id: 'h4', lowest_price: 251 }, // boundary 
        { id: 'h5', lowest_price: null }, // negative
    ],
    completed: true
}

describe("Hotels UI test", () => {

    beforeEach(() => {
        // mock fetched hotel data
        const fetchMock = vi.fn()
        .mockResolvedValueOnce({
            ok: true,
            json: async () => mockHotelData
        })
        .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                completed: true,
                hotels: mockPriceData.hotels
            })
        });
        vi.stubGlobal('fetch', fetchMock);

        act(() => {
            // render page
            render( 
                <MemoryRouter initialEntries={[{ pathname: "/", state: currentRouterState }]}>
                    <Hotels />
                </MemoryRouter>
            );
        });
    })

    // Display "Loading hotels" while waiting for API call to return
    test("'Loading hotels' is rendered", () => {
        expect(screen.queryByText(/Loading hotels/i)).toBeInTheDocument();
    });

    // Display hotel information on cards
    test('Cards are rendered with all hotel information', async () => {
        // Wait for the loading spinner to disappear
        await waitFor(() => {
            expect(screen.queryByText(/Loading hotels/i)).not.toBeInTheDocument();
        }, { timeout: 20000 });
        expect(screen.queryByText(/Loading hotels/i)).not.toBeInTheDocument();
        const hotelCards = await screen.findAllByTestId("hotel-card");
        for (let i = 0; i < mockHotelData.length; i++){
            const card = within(hotelCards[i]);
            if (mockPriceData.hotels[i].lowest_price && card){
                expect(card.getByText(RegExp(mockHotelData[i].name, "i"))).toBeInTheDocument();
                expect(card.getByText(RegExp(mockHotelData[i].address, "i"))).toBeInTheDocument();
                expect(card.getByText(RegExp(mockPriceData.hotels[i].lowest_price, "i"))).toBeInTheDocument();
                expect(card.getByText(RegExp(mockHotelData[i].description, "i"))).toBeInTheDocument();
                card.getAllByText(RegExp(`(${mockHotelData[i].rating})`), "i").forEach((el) => {
                    expect(el).toBeInTheDocument();
                });
                card.getAllByText(RegExp(`(${mockHotelData[i].trustyou.score.overall})`), "i").forEach((el) => {
                    expect(el).toBeInTheDocument();
                });
            }
        }
    }, { timeout: 20000 });

    // Test filter functionality
    test('Filter functionality works correctly', async () =>{
        // Wait for the loading spinner to disappear
        await waitFor(() => {
            expect(screen.queryByText(/Loading hotels/i)).not.toBeInTheDocument();
        }, { timeout: 20000 });
        const priceFilter = screen.getByLabelText("$ 0 – $ 250");
        await userEvent.click(priceFilter);
        const applyButton = screen.getByText(/Apply filters/i);
        await userEvent.click(applyButton);
        const hotelCards = await screen.findAllByTestId("hotel-card");
        const expectedPrices = ['123', '249'];
        expect(hotelCards).toHaveLength(2); // Only hotel with price 123 and 249 should remain
        expectedPrices.forEach(price => {
            // Look through all cards for each price
            const priceRegex = new RegExp(`S\\$\\s*${price}`);
            const cardWithPrice = hotelCards.find(card => 
                within(card).queryByText(priceRegex)
            );
            expect(cardWithPrice).toBeTruthy();
        });
    }, { timeout: 20000 });

    // Test search query update
    test('Search query updates trigger new hotel fetch', async () => {
        vi.restoreAllMocks();
        cleanup();

        const fetchSpy = vi.fn().mockImplementation(async (url) => ({
            ok: true,
            json: async () =>
            url.includes('/prices')
                ? { completed: true, hotels: mockPriceData.hotels }
                : mockHotelData,
        }));
        global.fetch = fetchSpy;

        const { rerender } = render(
            <MemoryRouter initialEntries={[{ pathname: '/', state: currentRouterState }]}>
            <Hotels />
            </MemoryRouter>
        );

        await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));

        // clear initial calls so we only inspect the "update" fetches
        fetchSpy.mockClear();

        // update router state and re-render so useLocation() is called again
        currentRouterState = {
            ...currentRouterState,
            destinationId: 'NEW_DEST',
            checkIn: '2025-11-01',
            checkOut: '2025-11-07',
        };
        useLocationMock.mockReturnValue({ state: currentRouterState });
        rerender(
            <MemoryRouter initialEntries={[{ pathname: '/', state: currentRouterState }]}>
            <Hotels />
            </MemoryRouter>
        );

        await waitFor(() => {
            const calls = fetchSpy.mock.calls.map(c => String(c[0]));
            expect(calls.some(u => u.includes('/api/hotels') && u.includes('destination_id=NEW_DEST'))).toBe(true);
            expect(calls.some(u => u.includes('/api/hotels/prices') && u.includes('checkin=2025-11-01'))).toBe(true);
        });
    });

    // Test lazy loading
    test('Lazy loading renders more cards when sentinel intersects', async () => {
        // Start fresh (your beforeEach renders already)
        vi.restoreAllMocks();
        cleanup();

        // 1) Build a large dataset + matching prices (no nulls so all render)
        const manyHotels = Array.from({ length: 30 }, (_, i) => ({
            id: `h${i + 1}`,
            name: `Hotel ${i + 1}`,
            address: `Addr ${i + 1}`,
            rating: 4.2,
            description: `Desc ${i + 1}`,
            trustyou: { score: { overall: 4.2 } },
        }));
        const manyPrices = {
            completed: true,
            hotels: manyHotels.map(h => ({ id: h.id, lowest_price: 100 + (h.id.length % 10) })),
        };

        // 2) Mock fetch to return the large dataset for this test only
        const fetchSpy = vi.fn().mockImplementation(async (url) => ({
            ok: true,
            json: async () => (String(url).includes('/prices') ? manyPrices : manyHotels),
        }));
        global.fetch = fetchSpy;

        // 3) Mock IntersectionObserver and capture the callback
        const observe = vi.fn();
        const unobserve = vi.fn();
        const disconnect = vi.fn();
        let ioCallback;
        window.IntersectionObserver = vi.fn((cb) => {
            ioCallback = cb;                 // keep the callback so we can trigger it
            return { observe, unobserve, disconnect };
        });

        // 4) Render
        render(
            <MemoryRouter initialEntries={[{ pathname: '/', state: { ...currentRouterState } }]}>
            <Hotels />
            </MemoryRouter>
        );

        // 5) Wait for initial load to finish
        await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));

        // 6) Capture initial number of cards (should be <= PAGE_SIZE)
        let cards = await screen.findAllByTestId('hotel-card');
        const initialCount = cards.length;
        expect(initialCount).toBeGreaterThan(0);
        expect(initialCount).toBeLessThan(manyHotels.length); // initial page is not everything

        // 7) Trigger the sentinel intersect to load the next page
        //    Your component will call observe() once; we now "intersect"
        expect(window.IntersectionObserver).toHaveBeenCalled();
        // simulate the sentinel being visible
        ioCallback?.([{ isIntersecting: true }]);

        // 8) Expect more cards than before
        await waitFor(() => {
            const afterMore = screen.getAllByTestId('hotel-card').length;
            expect(afterMore).toBeGreaterThan(initialCount);
        });

        // 9) Trigger again until everything loads (twice is usually enough for 30 items @ PAGE_SIZE=20)
        ioCallback?.([{ isIntersecting: true }]);
        await waitFor(() => {
            const all = screen.getAllByTestId('hotel-card').length;
            expect(all).toBe(manyHotels.length); // all pages loaded
        });
    });

    // Display fallback image
    test('Fallback image is displayed for hotels without proper image url', async () => {
        // Wait for the loading spinner to disappear
        await waitFor(() => {
            expect(screen.queryByText(/Loading hotels/i)).not.toBeInTheDocument();
        }, { timeout: 20000 });
        expect(screen.queryByText(/Loading hotels/i)).not.toBeInTheDocument();
        const hotelCards = await screen.findAllByTestId("hotel-card");
        for (let i = 0; i < hotelCards.length; i++){
            const img = screen.getByAltText(RegExp(mockHotelData[i].name, "i"));
            expect(img).toBeInTheDocument();
            expect(img).toHaveAttribute("src", "https://dummyimage.com/300x200/cccccc/000000&text=No+Image");
        }
    }, { timeout: 20000 });

    afterEach(() => {
        vi.unstubAllGlobals();
    });
})