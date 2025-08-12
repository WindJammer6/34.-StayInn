import { act, render, screen, within, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Hotels from "../src/pages/Hotels.jsx"
import { vi } from 'vitest';

vi.mock('axios');

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
]

const mockPriceData = {
    hotels: [
        { id: 'h1', lowest_price: 123 },
        { id: 'h2', lowest_price: 456 }
    ],
    completed: true
}

const mockRouterState = {
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
                <MemoryRouter initialEntries={[{ pathname: "/", state: mockRouterState }]}>
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
        screen.debug()
        for (let i = 0; i < hotelCards.length; i++){
            const card = within(hotelCards[i]);
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
    }, { timeout: 20000 });

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