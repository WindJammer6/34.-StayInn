// src/pages/Hotels.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import parse, { domToReact } from "html-react-parser";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import HotelList from "../components/HotelList";
import Hero from "../components/Hero";
import destinations from "../assets/destinations.json";

/* Hardcoded search params */
// const DEST = "RsBU";
// const IN = "2025-10-01";
// const OUT = "2025-10-07";
// const GUESTS = "2";
// const CURR = "SGD";
// const CC = "SG";
// const LANG = "en_US";

// const DEST_LABEL = destinations.find((d) => d.uid === DEST)?.term || DEST;

const PRICE_RANGES = [
  { label: "$ 0 – $ 250", min: 0, max: 250 },
  { label: "$ 250 – $ 500", min: 250, max: 500 },
  { label: "$ 500 – $ 1 000", min: 500, max: 1000 },
  { label: "$ 1 000 – $ 2 000", min: 1000, max: 2000 },
  { label: "$ 2 000 – $ 5 000", min: 2000, max: 5000 },
  { label: "> $ 5 000", min: 5000, max: Infinity },
];

const GUEST_THRESHOLDS = [9, 8, 7, 6];

const PAGE_SIZE = 20;

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
  const patch = (obj) => onChangeDraft({ ...draft, ...obj });

  return (
    <Card>
      <CardContent className="space-y-6">
        <h2 className="text-lg font-semibold mb-4">Search filters</h2>
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
        <Button className="w-full" onClick={onApply}>
          Apply filters
        </Button>
      </CardContent>
    </Card>
  );
};

/** keep only hotels that have at least one valid cash price */
const hasPrice = (h) => {
  const price = h.lowest_price ??
    h.price ??
    h.lowest_converted_price ??
    h.converted_price ??
    h.max_cash_payment ??
    h.coverted_max_cash_payment;
  
  // console.log(`Hotel ${h.name} (${h.id}) price check:`, {
  //   lowest_price: h.lowest_price,
  //   price: h.price,
  //   lowest_converted_price: h.lowest_converted_price,
  //   converted_price: h.converted_price,
  //   max_cash_payment: h.max_cash_payment,
  //   coverted_max_cash_payment: h.coverted_max_cash_payment,
  //   finalPrice: price,
  //   hasPrice: price != null
  // });
  
  return price != null;
};

export default function Hotels() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const {
    destinationId,
    checkIn,
    checkOut,
    currency,
    countryCode,
    guestsPerRoom,
    rooms,
    lang,
    destLabel
  } = state;

  // const effectiveParams = {
  //     destinationId: destinationId || defaultValues.destinationId || "WD0M",
  //     checkIn: checkIn || defaultValues.checkin || "2025-10-10",
  //     checkOut: checkOut || defaultValues.checkout || "2025-10-17",
  //     lang: lang || defaultValues.lang || "en_US",
  //     currency: currency || defaultValues.currency || "SGD",
  //     countryCode: countryCode || defaultValues.countryCode || "SG",
  //     rooms: rooms || defaultValues.rooms || "1",
  //     guestsPerRoom: guestsPerRoom || defaultValues.guestsPerRoom || "2",
  //     destLabel: destLabel || defaultValues.destLabel || "Singapore, Singapore"
  //   };

  const DEST = destinationId || "WD0M"
  const IN = checkIn || "2025-10-10"
  const OUT = checkOut || "2025-10-17"
  const GUESTS = Array(Number(rooms) || "1").fill(guestsPerRoom || "2").join("|")
  const CURR = currency || "SGD"
  const CC = countryCode || "SG"
  const LANG = lang || "en_US"
  const DEST_LABEL = destLabel || "Singapore, Singapore"

  // Add debugging
  // console.log("Hotels component rendered with state:", state);
  // console.log("Search params:", { DEST, IN, OUT, GUESTS, CURR, CC, LANG, DEST_LABEL });

  const [hotels, setHotels] = useState([]);
  const [sortKey, setSortKey] = useState("lowest-price");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [problemlah, setProblemLah] = useState(false);
  const [retry, setRetry] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  const INIT_FILTERS = {
    priceRanges: [],
    starRatings: [],
    guestRatings: [],
  };
  const [filters, setFilters] = useState(INIT_FILTERS);
  const [pending, setPending] = useState(INIT_FILTERS);

  /* Combined API calls to fetch hotels with details and prices */
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error state
        setVisibleCount(PAGE_SIZE); // Reset pagination
        setFilters(INIT_FILTERS); // Reset filters
        setPending(INIT_FILTERS); // Reset pending filters

        // console.log("Fetching hotels with params:", { DEST, IN, OUT, LANG, CURR, CC, GUESTS });

        // First fetch hotel details
        const detailsResponse = await fetch(
          `http://localhost:8080/api/hotels?destination_id=${DEST}`
        );

        if (!detailsResponse.ok)
          throw new Error(
            "Failed to fetch hotel details: " + detailsResponse.status
          );

        const detailsData = await detailsResponse.json();

        // Then fetch prices
        const pricesResponse = await fetch(
          `http://localhost:8080/api/hotels/prices?destination_id=${DEST}&checkin=${IN}&checkout=${OUT}&lang=${LANG}&currency=${CURR}&country_code=${CC}&guests=${GUESTS}`
        );

        if (!pricesResponse.ok) throw new Error("Failed to fetch hotel prices");

        const pricesData = await pricesResponse.json();

        console.log("Hotel details response:", detailsData);
        console.log("Prices response:", pricesData);
        // console.log("First hotel from details:", detailsData[0]);
        // console.log("Prices data hotels array:", pricesData.hotels);

        // Check whether Ascenda API problem lah
        if (!pricesData.completed){
          setProblemLah(true);
        } else {
          setProblemLah(false);
        }

        // Create a map of prices by hotel ID for quick lookup
        const pricesMap = {};
        pricesData.hotels?.forEach((priceInfo) => {
          pricesMap[priceInfo.id] = {
            lowest_price:
              priceInfo.lowest_price || priceInfo.lowest_converted_price,
            price: priceInfo.price || priceInfo.converted_price,
            free_cancellation: priceInfo.free_cancellation,
            rooms_available: priceInfo.rooms_available,
            // Add other price-related fields you want to display
          };
        });

        // Combine the data
        const combinedHotels = detailsData.map((hotel) => {
          const priceInfo = pricesMap[hotel.id] || {};
          return {
            ...hotel,
            ...priceInfo, // Spread all price info into the hotel object
          };
        });

        // console.log("Combined hotels:", combinedHotels);
        setHotels(combinedHotels);
      } catch (err) {
        console.error("Error fetching hotels:", err);
        setError("Failed to load hotels.");
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [DEST, IN, OUT, LANG, CURR, CC, GUESTS, retry]);

  const sortedHotels = useMemo(() => {
    // console.log("Starting to filter hotels. Total hotels:", hotels.length);
    
    let hotelsWithPrice = hotels.filter(hasPrice);
    // console.log("Hotels with price after filtering:", hotelsWithPrice.length);
    // console.log("First hotel with price:", hotelsWithPrice[0]);
    
    let filtered = hotelsWithPrice.filter((h) => {
      // Price range filter
      if (filters.priceRanges.length) {
        const inRange = filters.priceRanges.some((label) => {
          const range = PRICE_RANGES.find((r) => r.label === label);
          return (
            range && h.lowest_price >= range.min && h.lowest_price < range.max
          );
        });
        if (!inRange) return false;
      }

      // Star rating filter
      if (filters.starRatings.length) {
        const hotelStarRating = Math.round(h.rating || 0);
        if (!filters.starRatings.includes(hotelStarRating)) {
          return false;
        }
      }

      // Guest rating filter
      if (filters.guestRatings.length) {
        // Convert guest rating to 0-10 scale (assuming API returns 0-1)
        const guestRating = (h.trustyou?.score?.overall ?? 0) * 10;
        // Check if hotel meets any of the selected thresholds
        const meetsThreshold = filters.guestRatings.some(
          (threshold) => guestRating >= threshold
        );
        if (!meetsThreshold) return false;
      }

      return true;
    });

    // Sorting logic
    switch (sortKey) {
      case "lowest-price":
        filtered.sort(
          (a, b) => (a.lowest_price ?? Infinity) - (b.lowest_price ?? Infinity)
        );
        break;
      case "highest-price":
        filtered.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "star-desc":
        filtered.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "star-asc":
        filtered.sort((a, b) => (a.rating ?? Infinity) - (b.rating ?? Infinity));
        break;
      case "guest-desc":
        filtered.sort(
          (a, b) => (b.trustyou?.score?.overall ?? 0) - (a.trustyou?.score?.overall ?? 0)
        );
        break;
      case "guest-asc":
        filtered.sort(
          (a, b) => (a.trustyou?.score?.overall ?? Infinity) - (b.trustyou?.score?.overall ?? Infinity)
        );
        break;
      default:
        // Default sorting (lowest price)
        filtered.sort(
          (a, b) => (a.lowest_price ?? Infinity) - (b.lowest_price ?? Infinity)
        );
    }

    return filtered;
  }, [hotels, filters, sortKey]);

  useEffect(() => {
    if (!sentinelRef.current || loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleCount < sortedHotels.length) {
          setVisibleCount((prev) =>
            Math.min(prev + PAGE_SIZE, sortedHotels.length)
          );
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [sortedHotels.length, visibleCount, loading]);

  const visibleHotels = useMemo(
    () => sortedHotels.slice(0, visibleCount),
    [sortedHotels, visibleCount]
  );

  const renderFiltersUsed = () => {
    const parts = [];

    if (filters.priceRanges.length) {
      parts.push(`Price: ${filters.priceRanges.join(", ")}`);
    }

    if (filters.starRatings.length) {
      parts.push(
        `Stars: ${filters.starRatings.map((s) => `${s}★`).join(", ")}`
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

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading hotels ...</p>
        </div>
      </div>
    );
  if (error) return <p className="text-center pt-40 text-red-500">{error}</p>;

  if (problemlah)
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Ascenda API problem lah ...</p>
        <Button
          onClick={() => setRetry(prev => !prev)}
          className="mt-2 bg-blue-950"
        >
          Retry...
        </Button>
      </div>
    </div>
  );

  if (error) return <p className="text-center pt-40 text-red-500">{error}</p>;

  return (
    <div className="container mx-auto px-4 pt-28 pb-12">
      <Hero
        isCompact={true}
        initialDestination={DEST_LABEL}
        initialDestinationId={DEST}
        initialCheckIn={IN}
        initialCheckOut={OUT}
        initialRooms={parseInt(rooms) || 1}
        initialGuestsPerRoom={parseInt(GUESTS) || 2}
      />

      <div className="mt-6 flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-72 w-full">
          <Filters
            draft={pending}
            onChangeDraft={(patch) => setPending((d) => ({ ...d, ...patch }))}
            onApply={() => setFilters(pending)}
          />
        </aside>

        <section className="flex-1">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-semibold">
                {DEST_LABEL}: {sortedHotels.length} results
              </h1>
              {renderFiltersUsed()}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm font-medium">
                Sort:
              </label>
              <select
                id="sort"
                className="border rounded-md px-3 py-1 text-sm"
                value={sortKey}
                onChange={(e) => {
                  setSortKey(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                <option value="lowest-price">Lowest price</option>
                <option value="highest-price">Highest price</option>
                <option value="star-desc">Star rating (high→low)</option>
                <option value="star-asc">Star rating (low→high)</option>
                <option value="guest-desc">Guest rating (high→low)</option>
                <option value="guest-asc">Guest rating (low→high)</option>
              </select>
            </div>
          </div>

          {sortedHotels.length > 0 ? (
            <>
              <HotelList
                hotels={visibleHotels}
                checkin={IN}
                checkout={OUT}
                // Add these new props
                dest={DEST}
                inDate={IN}
                outDate={OUT}
                guests={GUESTS}
                currency={CURR}
                countryCode={CC}
                lang={LANG}
                destLabel={DEST_LABEL}
              />

              {visibleCount < sortedHotels.length && (
                <div ref={sentinelRef} className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                </div>
              )}

              {visibleCount >= sortedHotels.length && (
                <p className="text-center text-sm text-gray-500 py-8">
                  You've reached the end of the list.
                </p>
              )}
            </>
          ) : (
            <p className="text-center text-sm text-gray-500 py-8">
              No hotels match your search criteria.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
