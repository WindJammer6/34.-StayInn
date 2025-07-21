// src/pages/Hotels.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import HotelList from "../components/HotelList";
import limit from "p-limit";
import destinations from "../assets/destinations.json";

/* ───────────────────────────────────────────────────────── */
/* Hard-coded search params (replace later with form state)  */
/* ───────────────────────────────────────────────────────── */
const DEST   = "RsBU";  // try WD0M (fewer results) or RsBU (has a lot more search results)
const IN     = "2025-10-11";
const OUT    = "2025-10-17";
const GUESTS = "2";
const CURR   = "SGD";
const CC     = "SG";
const LANG   = "en_US";

const DEST_LABEL =
  destinations.find((d) => d.uid === DEST)?.term || DEST;

const PRICE_RANGES = [
  { label: "$ 0 – $ 250",   min:   0, max:  250 },
  { label: "$ 250 – $ 500", min: 250, max:  500 },
  { label: "$ 500 – $ 1 000",min: 500, max: 1000 },
  { label: "$ 1 000 – $ 2 000",min: 1000,max: 2000 },
  { label: "$ 2 000 – $ 5 000",min: 2000,max: 5000 },
  { label: "> $ 5 000",     min: 5000, max: Infinity }
];

const GUEST_THRESHOLDS = [9, 8, 7, 6];

/* pagination ---------------------------------------------- */
const PAGE_SIZE = 20;

/* cheapest-room range for ONE hotel ----------------------- */
const fetchPriceRange = async (id) => {
  const url =
    `http://localhost:8080/api/hotels/${id}/prices` +
    `?destination_id=${DEST}&checkin=${IN}&checkout=${OUT}` +
    `&guests=${GUESTS}&currency=${CURR}&country_code=${CC}&lang=${LANG}`;

  console.log("[API] Fetching price range:", url);

  const r = await fetch(url);
  if (!r.ok) return null;
  const j = await r.json();
  if (!j.rooms?.length) return null;

  const nums = j.rooms.map((rm) => rm.price).filter(Number.isFinite);
  return nums.length ? { min: Math.min(...nums), max: Math.max(...nums) } : null;
};

/* ───────────────────────────────────────────────────────── */
/* Search Destination Header Component                       */
/* ───────────────────────────────────────────────────────── */
const SearchHeader = () => (
  <Card>
    <CardContent className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
      {/* Destination */}  {/* … (same as before) */}
      <DestinationField />
      <DateRangeFields />
      <GuestField />
      <Button className="self-end lg:self-auto whitespace-nowrap h-10 lg:h-auto">
        Search Again
      </Button>
    </CardContent>
  </Card>
);

/* helper sub-components (same markup as before) */
const DestinationField = () => (
  <div className="flex-1">
    <label className="block text-sm font-medium mb-1">Destination</label>
    <input
      type="text"
      defaultValue="Singapore"
      className="w-full border rounded-md px-3 py-2"
    />
  </div>
);

const DateRangeFields = () => (
  <div className="flex gap-4 flex-1">
    <DateField label="Check-in"  defaultValue="11 Oct 2025" />
    <DateField label="Check-out" defaultValue="17 Oct 2025" />
  </div>
);

const GuestField = () => (
  <div className="flex-1">
    <label className="block text-sm font-medium mb-1">Guests</label>
    <input
      type="text"
      defaultValue="1 Room | 2 Adults"
      className="w-full border rounded-md px-3 py-2"
    />
  </div>
);

const DateField = ({ label, defaultValue }) => (
  <div className="flex-1">
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input
      type="text"
      defaultValue={defaultValue}
      className="w-full border rounded-md px-3 py-2"
    />
  </div>
);

/* ──────────────────────────────────────────────────────────────────── */
/* Sidebar Filters                                                      */
/* ──────────────────────────────────────────────────────────────────── */
const toggleSetItem = (set, value) => {
  const next = new Set(set);
  next.has(value) ? next.delete(value) : next.add(value);
  return next;
};

const toggleArrayItem = (arr, value) =>
  arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

const FilterRow = ({ label, checked, onToggle }) => (
  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
    <input
      type="checkbox"
      className="accent-blue-600"
      checked={checked}
      onChange={onToggle}
    />
    <span>{label}</span>
  </label>
);

const Filters = ({ draft, onChangeDraft, onApply }) => {
  // small helper
  const patch = (obj) => onChangeDraft({ ...draft, ...obj });

  return (
    <Card>
      <CardContent className="space-y-6">
        <h2 className="text-lg font-semibold mb-4">Search results</h2>

        {/* Price Range */}
        <div>
          <p className="text-sm font-medium mb-2">Price Range</p>
          {PRICE_RANGES.map((rng) => (
            <FilterRow
              key={rng.label}
              label={rng.label}
              checked={draft.priceRanges.includes(rng.label)}
              onToggle={() =>
                patch({
                  priceRanges: toggleArrayItem(draft.priceRanges, rng.label),
                })
              }
            />
          ))}
        </div>
        <Separator />

        {/* Star Rating */}
        <div>
          <p className="text-sm font-medium mb-2">Star Rating</p>
          {[5, 4, 3, 2, 1].map((stars) => (
            <FilterRow
              key={stars}
              label={"★".repeat(stars)}
              checked={draft.starRatings.includes(stars)}
              onToggle={() =>
                patch({
                  starRatings: toggleArrayItem(draft.starRatings, stars),
                })
              }
            />
          ))}
        </div>
        <Separator />

        {/* Guest Rating */}
        <div>
          <p className="text-sm font-medium mb-2">Guest Rating</p>
          {GUEST_THRESHOLDS.map((thr) => (
            <FilterRow
              key={thr}
              label={`${thr}+`}
              checked={draft.guestRatings.includes(thr)}
              onToggle={() =>
                patch({
                  guestRatings: toggleArrayItem(draft.guestRatings, thr),
                })
              }
            />
          ))}
        </div>
        <Separator />

        {/* Apply */}
        <Button className="w-full" onClick={onApply}>
          Apply filters
        </Button>
      </CardContent>
    </Card>
  );
};



/* ───────────────────────────────────────────────────────── */
/* Main component                                           */
/* ───────────────────────────────────────────────────────── */
export default function Hotels() {
  const [hotels,  setHotels]  = useState([]);
  const [sortKey, setSortKey] = useState("distance");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [page, setPage] = useState(0);        // 0-based batch index
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);           // <div> we’ll observe
  const [loadingPrices, setLoadingPrices] = useState(true);

  const limiter = limit(8);            // max 8 concurrent fetches

    /* ───────── filter state ───────── */
    const INIT_FILTERS = {
      priceRanges: [],      // e.g. ["$ 0 – $ 250"]
      starRatings: [],      // e.g. [4,5]
      guestRatings: [],     // e.g. [8,9]
    };

    const [filters, setFilters]   = useState(INIT_FILTERS);
    const [pending, setPending]   = useState(INIT_FILTERS);

  /* load catalogue + prices once -------------------------- */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // 1️⃣ First load just the catalogue (fast)
        const cat = await fetch(
          `http://localhost:8080/api/hotels?destination_id=${DEST}`
        ).then((r) => r.json());

        // Show basic hotel info immediately (without prices)
        setHotels(cat.map(h => ({...h, price: null})));
        setLoading(false);

        // 2️⃣ Then load prices in the background
        loadPricesInBatches(cat);
      } catch (e) {
        console.error(e);
        setError("Failed to load hotels.");
        setLoading(false);
      }
    })();
  }, []);

  const enrichHotel = async (hotel) => {
    const data = await fetchPriceRange(hotel.id);
    if (!data) return { price: null };          // keep previous behaviour

    /* ── aggregate room-level amenities ───────────────────── */
    const roomFacilities = new Set();
    for (const r of data.rooms ?? []) {
      r.amenities?.forEach((a) => roomFacilities.add(a.toLowerCase()));
    }

    return {
      price: data,                                   // or { min, max } if you prefer
      hero:  data.rooms?.[0]?.images?.[0]?.url ?? null,
      roomFacilities: Array.from(roomFacilities)     // lower-case strings
    };
  };

  const loadPricesInBatches = async (hotels) => {
    setLoadingPrices(true);

    const batchSize = 10;
    for (let i = 0; i < hotels.length; i += batchSize) {
      const batch = hotels.slice(i, i + batchSize);

      /* fetch price + room data for each hotel */
      const enriched = await Promise.all(
        batch.map((h) => limiter(() => enrichHotel(h)))
      );

      /* merge back into the master list */
      setHotels((prev) =>
        prev.map((h, idx) =>
          idx >= i && idx < i + batchSize
            ? { ...h, ...enriched[idx - i] }
            : h
        )
      );

      await new Promise((r) => setTimeout(r, 200));   // keep UI responsive
    }

    setLoadingPrices(false);
  };

  /* sorted view ------------------------------------------- */
  const sortedHotels = useMemo(() => {
    const preFiltered = hotels.filter((h) => {
      /* Price Range */
      if (filters.priceRanges.length && h.price) {
        const inRange = filters.priceRanges.some((label) => {
          const R = PRICE_RANGES.find((r) => r.label === label);
          return R && (h.price.min ?? 1e9) >= R.min && (h.price.min ?? 1e9) < R.max;
        });
        if (!inRange) return false;
      }

      /* Star Rating */
      if (filters.starRatings.length &&
          !filters.starRatings.includes(Math.round(h.rating || 0))) {
        return false;
      }

      /* Guest Rating */
      if (filters.guestRatings.length) {
        const s = h.trustyou?.score?.overall ?? 0;
        const ok = filters.guestRatings.some((thr) => s >= thr * 10);
        if (!ok) return false;
      }

      return true;
    });

    /* then sort that */
    const by = [...preFiltered].filter(h => h.price);

    switch (sortKey) {
      case "distance":
        by.sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9));
        break;
      case "top-reviewed":
        by.sort(
          (a, b) =>
            (b.trustyou?.score?.overall ?? 0) -
            (a.trustyou?.score?.overall ?? 0)
        );
        break;
      case "lowest-price":
        by.sort(
          (a, b) => (a.price.min ?? 1e9) - (b.price.min ?? 1e9)
        );
        break;
      case "highest-price":
        by.sort(
          (a, b) => (b.price.max ?? 0) - (a.price.max ?? 0)
        );
        break;
      case "star-rating":
        by.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
    }
    return by;
  }, [hotels, sortKey, filters]);

  /* infinite scroll pagination ------------------------------------------- */
  useEffect(() => {
    if (!sentinelRef.current || loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleCount < sortedHotels.length) {
          // Load next page
          setVisibleCount(prev => Math.min(prev + PAGE_SIZE, sortedHotels.length));
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [sortedHotels.length, visibleCount, loading]);

  // Get currently visible hotels
  const visibleHotels = useMemo(() => {
    return sortedHotels.slice(0, visibleCount);
  }, [sortedHotels, visibleCount]);

  const renderFiltersUsed = () => {
    const parts = [];

    if (filters.priceRanges.length) {
      parts.push(`Price: ${filters.priceRanges.join(", ")}`);
    }

    if (filters.starRatings.length) {
      parts.push(
        `Stars: ${filters.starRatings
          .map((s) => `${s}★`)
          .join(", ")}`
      );
    }

    if (filters.guestRatings.length) {
      parts.push(
        `Guest Rating: ${filters.guestRatings.map((g) => `${g}+`).join(", ")}`
      );
    }

    return parts.length > 0 ? (
      <div className="text-sm text-gray-600 mt-1">
        <strong>Filters used:</strong> {parts.join(" | ")}
      </div>
    ) : null;
  };

  /* render ------------------------------------------------- */
  if (loading) return <p className="text-center pt-40">Loading hotels…</p>;
  if (error)   return <p className="text-center pt-40 text-red-500">{error}</p>;

  return (
    <div className="container mx-auto px-4 pt-28 pb-12">
      <SearchHeader />

      <div className="mt-6 flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-72 w-full">
          <Filters
            draft={pending}
            onChangeDraft={(patch) => setPending((d) => ({ ...d, ...patch }))}
            onApply={() => setFilters(pending)}   /* ← Apply button */
          />
        </aside>

        <section className="flex-1">
          {/* header row */}
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-semibold">
                {DEST_LABEL}: {sortedHotels.length} results found
              </h1>
              {renderFiltersUsed()}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm font-medium">
                Sort results:
              </label>
              <select
                id="sort"
                className="border rounded-md px-3 py-1 text-sm"
                value={sortKey}
                onChange={(e) => {
                  setSortKey(e.target.value);
                  setPage(0);            // jump back to first batch
                }}
              >
                <option value="distance">Distance (near to far)</option>
                <option value="top-reviewed">Top reviewed</option>
                <option value="lowest-price">Lowest price</option>
                <option value="highest-price">Highest price</option>
                <option value="star-rating">Star rating (high to low)</option>
              </select>
            </div>
          </div>

          {/* Hotel list with loading states */}
          <HotelList hotels={visibleHotels} checkin={IN} checkout={OUT} />
          
          {/* Loading indicator when more hotels are available */}
          {visibleCount < sortedHotels.length && (
            <div ref={sentinelRef} className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
            </div>
          )}
          
          {/* End of results message */}
          {visibleCount >= sortedHotels.length && (
            <div className="flex justify-center py-8">
              {loadingPrices ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
              ) : sortedHotels.length === 0 ? (
                <p className="text-center text-sm text-gray-500">
                  No hotels match your search.
                </p>
              ) : (
                <p className="text-center text-sm text-gray-500">
                  You&rsquo;ve reached the end of the list.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
