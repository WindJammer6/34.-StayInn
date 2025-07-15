import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import HotelList from "../components/HotelList";

/* ───────────────────────────────────────────────────────────────────── */
/* Main page component                                                   */
/* ───────────────────────────────────────────────────────────────────── */

const Hotels = () => {
  const [hotels, setHotels] = useState([]);

  /* Fetch the demo data exactly once */
  useEffect(() => {
    fetch("/testhotels.json")
      .then((r) => r.json())
      .then((json) => setHotels(json.hotels || []))
      .catch((err) => console.error("Could not load hotels:", err));
  }, []);

  return (
    <div className="container mx-auto px-4 pt-28 pb-12">
      {/* Search-bar header */}
      <SearchHeader />

      {/* Content grid */}
      <div className="mt-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar filters */}
        <aside className="lg:w-72 w-full">
          <Filters />
        </aside>

        {/* Results list */}
        <section className="flex-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h1 className="text-xl font-semibold">
                Singapore: {hotels.length.toLocaleString()} results found
              </h1>

              {/* Sort dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm font-medium">
                  Sort results:
                </label>
                <select
                  id="sort"
                  className="border rounded-md px-3 py-1 text-sm"
                  // onChange={...} ← optional sorting logic
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
          <HotelList hotels={hotels} />
        </section>
      </div>
    </div>
  );
};

export default Hotels;

/* ───────────────────────────────────────────────────────────────────── */
/* Search Header                                                         */
/* ───────────────────────────────────────────────────────────────────── */

const SearchHeader = () => (
  <Card>
    <CardContent className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
      {/* Destination select (static for now) */}
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Destination</label>
        <input
          type="text"
          defaultValue="Singapore"
          className="w-full border rounded-md px-3 py-2"
        />
      </div>

      {/* Check-in / Check-out */}
      <div className="flex gap-4 flex-1">
        <DateField label="Check-in" defaultValue="09 Jul 2024" />
        <DateField label="Check-out" defaultValue="10 Jul 2024" />
      </div>

      {/* Room / Guest selector */}
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Guests</label>
        <input
          type="text"
          defaultValue="1 Room | 2 Adults"
          className="w-full border rounded-md px-3 py-2"
        />
      </div>

      {/* Search Again button */}
      <Button className="self-end lg:self-auto whitespace-nowrap h-10 lg:h-auto">
        Search Again
      </Button>
    </CardContent>
  </Card>
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
          <FilterRow key={stars} label={`${"★".repeat(stars)}`} />
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
        {["Hotel", "Apartment", "Hostel", "Capsule", "Boutique Hotel"].map((type) => (
          <FilterRow key={type} label={type} />
        ))}
      </div>
      <Separator />

      {/* Property Facilities */}
      <div>
        <p className="text-sm font-medium mb-2">Property Facilities</p>
        {["Pool", "Gym", "Spa", "Parking", "Restaurant", "Bar"].map((facility) => (
          <FilterRow key={facility} label={facility} />
        ))}
      </div>
      <Separator />

      {/* Room Facilities */}
      <div>
        <p className="text-sm font-medium mb-2">Room Facilities</p>
        {["Balcony", "WiFi", "Kitchen", "TV", "Washing Machine", "Hair Dryer"].map((facility) => (
          <FilterRow key={facility} label={facility} />
        ))}
      </div>
      <Separator />

      {/* Bed Type */}
      <div>
        <p className="text-sm font-medium mb-2">Bed Type</p>
        {["1 Double Bed", "1 Single Bed", "2 Single Beds", "Queen Bed", "King Bed"].map((bed) => (
          <FilterRow key={bed} label={bed} />
        ))}
      </div>
      <Separator />

      {/* Reviews */}
      <div>
        <p className="text-sm font-medium mb-2">Number of Reviews</p>
        {["500+", "400+", "300+", "200+", "100+", "0+"].map((range) => (
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
