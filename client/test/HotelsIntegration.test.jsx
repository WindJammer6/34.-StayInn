import { render, screen, within, waitFor, waitForElementToBeRemoved, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import Hotels from '../src/pages/Hotels.jsx';
import React from 'react';
import { useNavigate } from 'react-router-dom';

function NavHarness({ initialState, onReady, children }) {
  function Registrar() {
    const navigate = useNavigate();
    React.useEffect(() => { onReady(navigate); }, [navigate]);
    return null;
  }
  return (
    <MemoryRouter initialEntries={[{ pathname: '/', state: initialState }]}>
      <Registrar />
      {children}
    </MemoryRouter>
  );
}

// Safe regex helpers
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const priceRe = (p) => new RegExp(`S\\$\\s*${esc(p)}`);

const defaultState = {
  destinationId: 'WD0M',
  checkIn: '2025-10-10',
  checkOut: '2025-10-17',
  currency: 'SGD',
  countryCode: 'SG',
  guestsPerRoom: '2',
  rooms: '1',
  lang: 'en_US',
  destLabel: 'Singapore, Singapore',
};

const baseDetails = [
  { id: 'h1', name: 'Hotel 1', address: 'Addr 1', rating: 1.49, description: 'Desc 1', trustyou: { score: { overall: 61 } } }, // floor 1★, guest 6.1
  { id: 'h2', name: 'Hotel 2', address: 'Addr 2', rating: 2.5,  description: 'Desc 2', trustyou: { score: { overall: 79 } } }, // floor 2★, guest 7.9
  { id: 'h3', name: 'Hotel 3', address: 'Addr 3', rating: 3.49, description: 'Desc 3', trustyou: { score: { overall: 90 } } }, // floor 3★, guest 9.0
  { id: 'h4', name: 'Hotel 4', address: 'Addr 4', rating: 4.4,  description: 'Desc 4', trustyou: { score: { overall: 44 } } }, // floor 4★, guest 4.4
  { id: 'h5', name: 'Hotel 5', address: 'Addr 5', rating: 5.0,  description: 'Desc 5', trustyou: { score: { overall: 99 } } }, // floor 5★, guest 9.9
];

const basePrices = {
  completed: true,
  hotels: [
    { id: 'h1', lowest_price: 123 },
    { id: 'h2', lowest_price: 249 }, // inside $0–$250
    { id: 'h3', lowest_price: 250 }, // boundary → NOT in $0–$250 (< max)
    { id: 'h4', lowest_price: 251 },
    { id: 'h5', lowest_price: null }, // excluded
  ],
};

function stubFetch({ details = baseDetails, prices = basePrices, fail = false }) {
  const fetchSpy = vi.fn().mockImplementation(async (url) => {
    if (fail) return { ok: false, status: 500, json: async () => ({}) };
    const isPrices = String(url).includes('/api/hotels/prices');
    return { ok: true, json: async () => (isPrices ? prices : details) };
  });
  global.fetch = fetchSpy;
  return fetchSpy;
}

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});

// ==========================================================
// 1) Fetch + Render (home → hotels) and direct load
// ==========================================================
describe('Hotels: fetch and render with search query', () => {
  test('Renders hotel cards with key fields from home→hotels flow', async () => {
    stubFetch({});

    render(
      <MemoryRouter initialEntries={[{ pathname: '/', state: defaultState }]}>
        <Hotels />
      </MemoryRouter>
    );

    await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));

    // Hotels with price: h1..h4 (h5 excluded)
    const cards = await screen.findAllByTestId('hotel-card');
    expect(cards.length).toBe(4);

    for (const id of ['h1', 'h2', 'h3', 'h4']) {
      const h = baseDetails.find(d => d.id === id);
      const p = basePrices.hotels.find(x => x.id === id);
      const card = cards.find(c => within(c).queryByText(new RegExp(esc(h.name), 'i')));
      expect(card).toBeTruthy();
      const w = within(card);

      expect(w.getByText(new RegExp(esc(h.name), 'i'))).toBeInTheDocument();
      expect(w.getByText(new RegExp(esc(h.address), 'i'))).toBeInTheDocument();
      expect(w.getByText(new RegExp(esc(h.description), 'i'))).toBeInTheDocument();

      const img = w.getByAltText(new RegExp(esc(h.name), 'i'));
      expect(img).toHaveAttribute('src', 'https://dummyimage.com/300x200/cccccc/000000&text=No+Image');

      expect(w.getByText(priceRe(p.lowest_price))).toBeInTheDocument();
    }
  });

  test('Direct load on /hotels fetches and renders', async () => {
    stubFetch({});

    render(
      <MemoryRouter initialEntries={[{ pathname: '/hotels', state: defaultState }]}>
        <Hotels />
      </MemoryRouter>
    );

    await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));
    const cards = await screen.findAllByTestId('hotel-card');
    expect(cards.length).toBeGreaterThan(0);
  });
});

// ==========================================================
// 2) Filters (price ranges, star threshold, guest rating threshold)
// ==========================================================
describe('Hotels: filters', () => {
  test('Price range boundary: "$ 0 – $ 250" shows 123 & 249, excludes 250', async () => {
    const user = userEvent.setup();
    stubFetch({});

    render(
      <MemoryRouter initialEntries={[{ pathname: '/', state: defaultState }]}>
        <Hotels />
      </MemoryRouter>
    );

    await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));

    await user.click(screen.getByLabelText('$ 0 – $ 250'));
    await user.click(screen.getByText(/Apply filters/i));

    const cards = await screen.findAllByTestId('hotel-card');
    expect(cards.length).toBe(2);

    const text = cards.map(c => c.textContent).join(' ');
    expect(text).toMatch(priceRe(123));
    expect(text).toMatch(priceRe(249));
    expect(text).not.toMatch(priceRe(250)); // boundary excluded (< max)
  });

  test('Star rating radio uses Math.floor threshold (e.g., ≥3★)', async () => {
    const user = userEvent.setup();
    stubFetch({});

    render(
      <MemoryRouter initialEntries={[{ pathname: '/', state: defaultState }]}>
        <Hotels />
      </MemoryRouter>
    );

    await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));

    // Your UI shows labels like "★★★+"
    await user.click(screen.getByLabelText('★★★+'));
    await user.click(screen.getByText(/Apply filters/i));

    const cards = await screen.findAllByTestId('hotel-card');
    const text = cards.map(c => c.textContent).join(' ');

    // floor(rating) >= 3 -> h3, h4 (h5 excluded by price=null)
    expect(text).toMatch(/Hotel 3/i);
    expect(text).toMatch(/Hotel 4/i);
    expect(text).not.toMatch(/Hotel 5/i);
    expect(text).not.toMatch(/Hotel 1/i);
    expect(text).not.toMatch(/Hotel 2/i);
  });

  test('Guest rating threshold radios ((overall/10) rounded to 1dp) → 9+ shows 9.0 and above', async () => {
    const user = userEvent.setup();
    stubFetch({});

    render(
      <MemoryRouter initialEntries={[{ pathname: '/', state: defaultState }]}>
        <Hotels />
      </MemoryRouter>
    );

    await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));

    await user.click(screen.getByLabelText('9+'));
    await user.click(screen.getByText(/Apply filters/i));

    const cards = await screen.findAllByTestId('hotel-card');
    const text = cards.map(c => c.textContent).join(' ');

    // overall=90 -> 9.0, overall=99 -> 9.9 (but h5 excluded by price=null)
    expect(text).toMatch(/Hotel 3/i);
    expect(text).not.toMatch(/Hotel 5/i);
    expect(text).not.toMatch(/Hotel 1|Hotel 2|Hotel 4/i);
  });
});

// ==========================================================
// 3) Negative paths
// ==========================================================
describe('Hotels: negative paths', () => {
  test('Null price hotels are excluded from rendering', async () => {
    stubFetch({});

    render(
      <MemoryRouter initialEntries={[{ pathname: '/', state: defaultState }]}>
        <Hotels />
      </MemoryRouter>
    );

    await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));

    const text = (await screen.findAllByTestId('hotel-card'))
      .map(c => c.textContent).join(' ');
    expect(text).not.toMatch(/Hotel 5/i);
  });

  test('Incomplete prices → problem screen; Retry triggers refetch', async () => {
    const fetchSpy = stubFetch({ prices: { ...basePrices, completed: false } });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={[{ pathname: '/', state: defaultState }]}>
        <Hotels />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Ascenda API problem lah/i)).toBeInTheDocument();
    });

    const callsBefore = fetchSpy.mock.calls.length;
    await user.click(screen.getByRole('button', { name: /Retry/i }));
    await waitFor(() => {
      expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  test('Hard fetch error → generic error message', async () => {
    stubFetch({ fail: true });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/', state: defaultState }]}>
        <Hotels />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load hotels/i)).toBeInTheDocument();
    });
  });
});

// ==========================================================
// 4) Lazy-loading via IntersectionObserver
// ==========================================================
describe('Hotels: lazy loading', () => {
  test('Sentinel intersection loads subsequent pages', async () => {
    const manyDetails = Array.from({ length: 30 }, (_, i) => ({
      id: `mh${i + 1}`,
      name: `Many Hotel ${i + 1}`,
      address: `Addr ${i + 1}`,
      rating: 4.2,
      description: `Desc ${i + 1}`,
      trustyou: { score: { overall: 80 } },
    }));
    const manyPrices = {
      completed: true,
      hotels: manyDetails.map(h => ({ id: h.id, lowest_price: 100 + (h.id.length % 10) })),
    };

    stubFetch({ details: manyDetails, prices: manyPrices });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/', state: defaultState }]}>
        <Hotels />
      </MemoryRouter>
    );

    await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));

    const firstCount = (await screen.findAllByTestId('hotel-card')).length;
    expect(firstCount).toBeGreaterThan(0);
    expect(firstCount).toBeLessThan(manyDetails.length);

    // Use the helper installed by vitest.setup.js
    // First intersection -> should load more
    // @ts-ignore
    triggerIntersect({ isIntersecting: true });
    await waitFor(() => {
      expect(screen.getAllByTestId('hotel-card').length).toBeGreaterThan(firstCount);
    });

    // Second intersection -> should load all
    // @ts-ignore
    triggerIntersect({ isIntersecting: true });
    await waitFor(() => {
      expect(screen.getAllByTestId('hotel-card').length).toBe(manyDetails.length);
    });
  });
});

// ==========================================================
// 5) Sorting: lowest/highest price, star asc/desc, guest asc/desc
// ==========================================================
describe('Hotels: sorting modes', () => {
  const makePricesWithPriceField = () => ({
    completed: true,
    hotels: [
      { id: 'h1', lowest_price: 123, price: 500 }, // highest
      { id: 'h2', lowest_price: 249, price: 100 },
      { id: 'h3', lowest_price: 250, price: 300 },
      { id: 'h4', lowest_price: 251, price: 50 },
    ],
  });

  const getNamesInOrder = () =>
    screen.getAllByTestId('hotel-card').map(c => within(c).getByText(/Hotel \d/i).textContent);

  test('Default lowest-price sort (ascending by lowest_price)', async () => {
    stubFetch({}); // uses basePrices
    render(<MemoryRouter initialEntries={[{ pathname: '/', state: defaultState }]}><Hotels /></MemoryRouter>);
    await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));

    // h1(123), h2(249), h3(250), h4(251)
    expect(getNamesInOrder()).toEqual(['Hotel 1', 'Hotel 2', 'Hotel 3', 'Hotel 4']);
  });

  test('Highest price sort uses the "price" field (descending)', async () => {
    const user = userEvent.setup();
    stubFetch({ prices: makePricesWithPriceField() });
    render(<MemoryRouter initialEntries={[{ pathname: '/', state: defaultState }]}><Hotels /></MemoryRouter>);
    await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));

    await user.selectOptions(screen.getByLabelText('Sort:'), 'highest-price');
    await waitFor(() => {
      expect(getNamesInOrder()[0]).toBe('Hotel 1'); // price=500 is highest
    });
  });

  test('Star rating: desc then asc', async () => {
    const user = userEvent.setup();
    stubFetch({});
    render(<MemoryRouter initialEntries={[{ pathname: '/', state: defaultState }]}><Hotels /></MemoryRouter>);
    await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));

    await user.selectOptions(screen.getByLabelText('Sort:'), 'star-desc');
    expect(getNamesInOrder()).toEqual(['Hotel 4', 'Hotel 3', 'Hotel 2', 'Hotel 1']); // 4.4 > 3.49 > 2.5 > 1.49

    await user.selectOptions(screen.getByLabelText('Sort:'), 'star-asc');
    expect(getNamesInOrder()).toEqual(['Hotel 1', 'Hotel 2', 'Hotel 3', 'Hotel 4']);
  });

  test('Guest rating: asc then desc (uses trustyou.score.overall)', async () => {
    const user = userEvent.setup();
    stubFetch({});
    render(<MemoryRouter initialEntries={[{ pathname: '/', state: defaultState }]}><Hotels /></MemoryRouter>);
    await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));

    await user.selectOptions(screen.getByLabelText('Sort:'), 'guest-asc');
    expect(getNamesInOrder()).toEqual(['Hotel 4', 'Hotel 1', 'Hotel 2', 'Hotel 3']); // 44 < 61 < 79 < 90

    await user.selectOptions(screen.getByLabelText('Sort:'), 'guest-desc');
    expect(getNamesInOrder()).toEqual(['Hotel 3', 'Hotel 2', 'Hotel 1', 'Hotel 4']);
  });
});

// ==========================================================
// 7) Empty state message when filters eliminate everything
// ==========================================================
describe('Hotels: empty state', () => {
  test('Selecting $0–$250 and 9+ yields no matches', async () => {
    const user = userEvent.setup();
    stubFetch({});
    render(<MemoryRouter initialEntries={[{ pathname: '/', state: defaultState }]}><Hotels /></MemoryRouter>);
    await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));

    await user.click(screen.getByLabelText('$ 0 – $ 250'));
    await user.click(screen.getByLabelText('9+'));
    await user.click(screen.getByText(/Apply filters/i));

    expect(await screen.findByText(/No hotels match your search criteria/i)).toBeInTheDocument();
  });
});


// ==========================================================
// 8) End-of-list message when all items are loaded
// ==========================================================
describe('Hotels: end-of-list indicator', () => {
  test('Displays "You\'ve reached the end of the list." after full pagination', async () => {
    const manyDetails = Array.from({ length: 25 }, (_, i) => ({
      id: `mh${i + 1}`,
      name: `Many Hotel ${i + 1}`,
      address: `Addr ${i + 1}`,
      rating: 4.2,
      description: `Desc ${i + 1}`,
      trustyou: { score: { overall: 80 } },
    }));
    const manyPrices = {
      completed: true,
      hotels: manyDetails.map(h => ({ id: h.id, lowest_price: 180 + (h.id.length % 10) })),
    };

    stubFetch({ details: manyDetails, prices: manyPrices });
    render(<MemoryRouter initialEntries={[{ pathname: '/', state: defaultState }]}><Hotels /></MemoryRouter>);

    await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));

    // Load all pages (PAGE_SIZE=20 → need 2 triggers)
    // @ts-ignore (helper from setup)
    triggerIntersect({ isIntersecting: true });
    // @ts-ignore
    triggerIntersect({ isIntersecting: true });

    await waitFor(() => {
      expect(screen.getByText(/You've reached the end of the list\./i)).toBeInTheDocument();
    });
  });
});

// ==========================================================
// 9) "Filters used" summary text
// ==========================================================
describe('Hotels: "Filters used" summary is shown when filters applied', () => {
  test('Summary includes Price, Stars, and Guest Rating parts', async () => {
    const user = userEvent.setup();
    stubFetch({});
    render(<MemoryRouter initialEntries={[{ pathname: '/', state: defaultState }]}><Hotels /></MemoryRouter>);
    await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));

    await user.click(screen.getByLabelText('$ 250 – $ 500'));
    await user.click(screen.getByLabelText('★★★+'));
    await user.click(screen.getByLabelText('9+'));
    await user.click(screen.getByText(/Apply filters/i));

    const summary = await screen.findByText(/Filters used:/i);
    const container = summary.parentElement;
    expect(container).toHaveTextContent('Price: $ 250 – $ 500');
    expect(container).toHaveTextContent('Stars: ★★★+');
    expect(container).toHaveTextContent('Guest Rating: 9+');
  });
});

// ==========================================================
// 10) Price-field fallbacks when lowest_price is missing
// ==========================================================
describe('Hotels: price fallbacks', () => {
  test('lowest_converted_price populates lowest_price for rendering', async () => {
    const prices = {
      completed: true,
      hotels: [
        { id: 'h1', lowest_price: null, lowest_converted_price: 130 }, // should render with 130
        { id: 'h2', lowest_price: 249 },
        { id: 'h3', lowest_price: 250 },
        { id: 'h4', lowest_price: 251 },
        { id: 'h5', lowest_price: null },
      ],
    };
    stubFetch({ prices });

    render(<MemoryRouter initialEntries={[{ pathname: '/', state: defaultState }]}><Hotels /></MemoryRouter>);
    await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));

    // Hotel 1 should render and show S$130 because mapping sets lowest_price := lowest_converted_price
    const card = (await screen.findAllByTestId('hotel-card')).find(c => within(c).queryByText(/Hotel 1/i));
    expect(card).toBeTruthy();
    expect(within(card).getByText(/S\$\s*130/)).toBeInTheDocument();
  });

  test('presence of "price" (without lowest_price) still makes hotel render', async () => {
    const prices = {
      completed: true,
      hotels: [
        { id: 'h1', lowest_price: 123 },
        { id: 'h2', lowest_price: null, price: 999 }, // has price only
        { id: 'h3', lowest_price: 250 },
        { id: 'h4', lowest_price: 251 },
        { id: 'h5', lowest_price: null },
      ],
    };
    stubFetch({ prices });

    render(<MemoryRouter initialEntries={[{ pathname: '/', state: defaultState }]}><Hotels /></MemoryRouter>);
    await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));

    // Should include Hotel 2 because hasPrice() returns true when "price" is present
    const names = screen.getAllByTestId('hotel-card').map(c => c.textContent);
    expect(names.join(' ')).toMatch(/Hotel 2/i);
  });
});

// ==========================================================
// 11) Search query updates (proxy for Hero-driven changes)
// ==========================================================
describe('Hotels: search query updates trigger new fetch', () => {
  test('Changing router state via navigate re-issues fetches', async () => {
    const fetchSpy = vi.fn().mockImplementation(async (url) => ({
        ok: true,
        json: async () =>
        String(url).includes('/prices') ? basePrices : baseDetails,
    }));
    global.fetch = fetchSpy;

    let navigateFn;
    render(
        <NavHarness initialState={defaultState} onReady={(nav) => (navigateFn = nav)}>
        <Hotels />
        </NavHarness>
    );

    await waitForElementToBeRemoved(() => screen.queryAllByText(/Loading hotels/i));
    fetchSpy.mockClear();

    const newState = { ...defaultState, destinationId: 'NEW_DEST', checkIn: '2025-11-01', checkOut: '2025-11-07' };

    // push a new entry with updated state
    await Promise.resolve(navigateFn('/', { state: newState }));

    await waitFor(() => {
        const calls = fetchSpy.mock.calls.map(c => String(c[0]));
        expect(calls.some(u => u.includes('/api/hotels?') && u.includes('destination_id=NEW_DEST'))).toBe(true);
        expect(calls.some(u => u.includes('/api/hotels/prices') && u.includes('checkin=2025-11-01'))).toBe(true);
    });
    });
});
