// src/pages/Hotels.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import HotelList from "../components/HotelList";
import limit from "p-limit";

/* ───────────────────────────────────────────────────────── */
/* Hard-coded search params (replace later with form state)  */
/* ───────────────────────────────────────────────────────── */
const DEST   = "WD0M";  // try RsBU (has a lot more search results)
const IN     = "2025-10-11";
const OUT    = "2025-10-17";
const GUESTS = "2";
const CURR   = "SGD";
const CC     = "SG";
const LANG   = "en_US";

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

  const limiter = limit(8);            // max 8 concurrent fetches

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

  const loadPricesInBatches = async (hotels) => {
    const batchSize = 10; // Smaller batches for smoother loading
    for (let i = 0; i < hotels.length; i += batchSize) {
      const batch = hotels.slice(i, i + batchSize);
      const prices = await Promise.all(
        batch.map(h => limiter(() => fetchPriceRange(h.id)))
      );

      setHotels(prev => prev.map((h, idx) =>
        idx >= i && idx < i + batchSize
          ? {...h, price: prices[idx - i]}
          : h
      ));

      // Small delay between batches to keep UI responsive
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  /* sorted view ------------------------------------------- */
  const sortedHotels = useMemo(() => {
    // 🔍 Ignore hotels with no available rooms (price === null)
    const by = [...hotels].filter(h => h.price);

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
      /* “recommended” keeps original order */
    }
    return by;
  }, [hotels, sortKey]);

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

  /* render ------------------------------------------------- */
  if (loading) return <p className="text-center pt-40">Loading hotels…</p>;
  if (error)   return <p className="text-center pt-40 text-red-500">{error}</p>;

  return (
    <div className="container mx-auto px-4 pt-28 pb-12">
      <SearchHeader />

      <div className="mt-6 flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-72 w-full">
          <Filters />
        </aside>

        <section className="flex-1">
          {/* header row */}
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
            <h1 className="text-xl font-semibold">
              Singapore: {sortedHotels.length} results found
            </h1>

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
                <option value="recommended">Recommended</option>
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
          {visibleCount >= sortedHotels.length && sortedHotels.length > 0 && (
            <p className="text-center text-sm text-gray-500 py-4">
              You've reached the end of the list.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────── */
/* Search Header Component                                   */
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

const Filters = () => (
  <Card>
    <CardContent className="space-y-6">

      {/* Search result header */}
      <h2 className="text-lg font-semibold mb-4">Search results</h2>

      {/* Search by hotel name */}
      <div>
        <p className="text-sm font-medium mb-2">Search by hotel name</p>
        <input
          type="text"
          placeholder="e.g. The Fullerton Hotel"
          className="w-full border rounded-md px-3 py-2"
        />
      </div>

      <Separator />

      {/* Price range */}
      <div>
        <p className="text-sm font-medium mb-2">Price Range</p>
        {[
          "$ 0 – $ 250",
          "$ 250 – $ 500",
          "$ 500 – $ 1 000",
          "$ 1 000 – $ 2 000",
          "$ 2 000 – $ 5 000",
        ].map((range, idx) => (
          <FilterRow key={idx} label={range} />
        ))}
      </div>

      <Separator />

      {/* Budget slider */}
      <div>
        <p className="text-sm font-medium mb-2">Budget (SGD)</p>
        <input type="range" min={0} max={200} defaultValue={100} className="w-full" />
        <div className="flex justify-between text-sm mt-1 text-gray-600">
          <span>$0</span>
          <span>$200+</span>
        </div>
      </div>
      <Separator />

      {/* Star Rating */}
      <div>
        <p className="text-sm font-medium mb-2">Star Rating</p>
        {[5, 4, 3, 2, 1].map((stars) => (
          <FilterRow key={stars} label={"★".repeat(stars)} />
        ))}
      </div>
      <Separator />

      {/* Guest Rating */}
      <div>
        <p className="text-sm font-medium mb-2">Guest Rating</p>
        {[9, 8, 7, 6].map((score) => (
          <FilterRow key={score} label={`${score}+`} />
        ))}
      </div>
      <Separator />

      {/* Property Type */}
      <div>
        <p className="text-sm font-medium mb-2">Property Type</p>
        {['Hotel', 'Apartment', 'Hostel', 'Capsule', 'Boutique Hotel'].map((type) => (
          <FilterRow key={type} label={type} />
        ))}
      </div>
      <Separator />

      {/* Property Facilities */}
      <div>
        <p className="text-sm font-medium mb-2">Property Facilities</p>
        {['Pool', 'Gym', 'Spa', 'Parking', 'Restaurant', 'Bar'].map((facility) => (
          <FilterRow key={facility} label={facility} />
        ))}
      </div>
      <Separator />

      {/* Room Facilities */}
      <div>
        <p className="text-sm font-medium mb-2">Room Facilities</p>
        {['Balcony', 'WiFi', 'Kitchen', 'TV', 'Washing Machine', 'Hair Dryer'].map((facility) => (
          <FilterRow key={facility} label={facility} />
        ))}
      </div>
      <Separator />

      {/* Bed Type */}
      <div>
        <p className="text-sm font-medium mb-2">Bed Type</p>
        {['1 Double Bed', '1 Single Bed', '2 Single Beds', 'Queen Bed', 'King Bed'].map((bed) => (
          <FilterRow key={bed} label={bed} />
        ))}
      </div>
      <Separator />

      {/* Reviews */}
      <div>
        <p className="text-sm font-medium mb-2">Number of Reviews</p>
        {['500+', '400+', '300+', '200+', '100+', '0+'].map((range) => (
          <FilterRow key={range} label={range} />
        ))}
      </div>
    </CardContent>
  </Card>
);

const FilterRow = ({ label }) => (
  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
    <input type="checkbox" className="accent-blue-600" />
    <span>{label}</span>
  </label>
);