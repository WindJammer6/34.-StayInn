// src/pages/Hotels.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import parse, { domToReact } from "html-react-parser";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import HotelList from "../components/HotelList";
import destinations from "../assets/destinations.json";

/* Hardcoded search params */
const DEST = "RsBU";
const IN = "2025-10-01";
const OUT = "2025-10-07";
const GUESTS = "2";
const CURR = "SGD";
const CC = "SG";
const LANG = "en_US";

const DEST_LABEL = destinations.find((d) => d.uid === DEST)?.term || DEST;

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

/* Search Destination Header Component */
const SearchHeader = () => (
  <Card>
    <CardContent className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
      <DestinationField />
      <DateRangeFields />
      <GuestField />
      <Button className="self-end lg:self-auto whitespace-nowrap h-10 lg:h-auto">
        Search Again
      </Button>
    </CardContent>
  </Card>
);

/* Helper components */
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
    <DateField label="Check-in" defaultValue="01 Oct 2025" />
    <DateField label="Check-out" defaultValue="07 Oct 2025" />
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

const HotelCard = ({ hotel, checkin, checkout }) => {
  const getImageUrl = () => {
    if (hotel.image_details?.prefix && hotel.image_details?.count > 0) {
      return `${hotel.image_details.prefix}${hotel.default_image_index || 1}${
        hotel.image_details.suffix || ".jpg"
      }`;
    }
    return "https://via.placeholder.com/300x200?text=No+Image";
  };

  // Format price display
  const formatPrice = (price) => {
    if (price === undefined || price === null) {
      // Try alternative price fields if lowest_price isn't available
      return formatPrice(
        hotel.price || hotel.converted_price || hotel.lowest_converted_price
      );
    }
    return new Intl.NumberFormat("en-SG", {
      style: "currency",
      currency: CURR,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/3">
            <img
              src={getImageUrl()}
              alt={hotel.name}
              className="w-full h-48 object-cover rounded-md"
            />
          </div>
          <div className="md:w-2/3">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{hotel.name}</h2>
                <div className="flex items-center mt-1">
                  <span className="text-yellow-500">
                    {"★".repeat(Math.round(hotel.rating || 0))}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    ({hotel.rating?.toFixed(1) || "N/A"})
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{hotel.address}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(hotel.lowest_price)}
                </div>
                <p className="text-sm text-gray-500">per night</p>
                {hotel.free_cancellation && (
                  <p className="text-xs text-green-600 mt-1">
                    Free cancellation
                  </p>
                )}
              </div>
            </div>

            {hotel.description && (
              <div className="mt-4 text-sm text-gray-700">
                <h3 className="font-medium mb-1">Description:</h3>
                <div className="prose prose-sm max-w-none">
                  {parse(hotel.description, {
                    replace: (domNode) => {
                      if (domNode.type === "tag" && domNode.name === "br") {
                        return <br />;
                      }
                      return domNode;
                    },
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Button>View Deal</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

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

export default function Hotels() {
  const [hotels, setHotels] = useState([]);
  const [sortKey, setSortKey] = useState("lowest-price");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

        // First fetch hotel details
        const detailsResponse = await fetch(
          `http://localhost:8080/api/hotels?destination_id=${DEST}`
        );

        if (!detailsResponse.ok)
          throw new Error("Failed to fetch hotel details");

        const detailsData = await detailsResponse.json();

        // Then fetch prices
        const pricesResponse = await fetch(
          `http://localhost:8080/api/hotels/prices?destination_id=${DEST}&checkin=${IN}&checkout=${OUT}&lang=${LANG}&currency=${CURR}&country_code=${CC}&guests=${GUESTS}`
        );

        if (!pricesResponse.ok) throw new Error("Failed to fetch hotel prices");

        const pricesData = await pricesResponse.json();

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

        setHotels(combinedHotels);
      } catch (err) {
        console.error(err);
        setError("Failed to load hotels.");
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, []);

  const sortedHotels = useMemo(() => {
    let filtered = hotels.filter((h) => {
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
      case "star-rating":
        filtered.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "distance":
        filtered.sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9));
        break;
      case "top-reviewed":
        filtered.sort(
          (a, b) =>
            (b.trustyou?.score?.overall ?? 0) -
            (a.trustyou?.score?.overall ?? 0)
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

  return (
    <div className="container mx-auto px-4 pt-28 pb-12">
      <SearchHeader />

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
                <option value="star-rating">Star rating</option>
                <option value="distance">Distance (near to far)</option>
                <option value="top-reviewed">Top reviewed</option>
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
