import React from "react";
import { useNavigate } from "react-router-dom";
import starFull   from "../assets/starIconFilled.svg";
import starHalf   from "../assets/starIconHalf.svg";   // <- add a half-star SVG

const PLACEHOLDER =
  "https://dummyimage.com/300x200/cccccc/000000&text=No+Image";

/* ---------- helpers ---------- */
const getImageUrl = (h) => {
  if (h.image_details?.count) {
    const idx =
      h.image_details.default_image_index ??
      (h.image_details.count > 1 ? 1 : 0);
    return `${h.image_details.prefix}${idx}${h.image_details.suffix}`;
  }
  if (Array.isArray(h.images) && h.images.length) return h.images[0].url;
  if (
    Array.isArray(h.rooms) &&
    h.rooms.length &&
    Array.isArray(h.rooms[0].images) &&
    h.rooms[0].images.length
  )
    return h.rooms[0].images[0].url;
  return PLACEHOLDER;
};

const LocationPin = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={props.className || "w-4 h-4 text-red-500"}
  >
    <path d="M12 2C8.7 2 6 4.7 6 8c0 5 6 12 6 12s6-7 6-12c0-3.3-2.7-6-6-6zm0 8.5A2.5 2.5 0 1 1 12 5a2.5 2.5 0 0 1 0 5.5z" />
  </svg>
);

/* =================================== */
export default function HotelCard({
  hotel: h,
  checkin,
  checkout,
  dest,
  inDate,
  outDate,
  guests,
  currency,
  countryCode,
  lang,
  destLabel,
}) {
  const navigate = useNavigate();

  /* ---- stars & rating ---- */
  const rawRating   = h.rating ?? 0;              // e.g. 3.5
  const fullStars   = Math.floor(rawRating);      // 3
  const hasHalfStar = rawRating - fullStars >= 0.5;

  /* ---- guest score badge / fallback ---- */
  const guestScore  = h.trustyou?.score?.overall ?? null;
  const guestLabel  = guestScore
    ? `${(guestScore / 10).toFixed(1)}`
    : "No guest rating";

  /* ---- nights ---- */
  const nights = Math.max(
    1,
    (new Date(checkout) - new Date(checkin)) / 86_400_000
  );

  /* ---- price display (unchanged) ---- */
  const getPriceDisplay = () => {
    const price    = h.lowest_price ?? h.price ?? h.lowest_converted_price ?? h.converted_price;
    const maxPrice = h.max_cash_payment ?? h.coverted_max_cash_payment;

    if (price && maxPrice && price !== maxPrice) {
      return (
        <>
          <span className="text-xs font-normal">From </span>
          S$ {price.toFixed(0)} <br />– S$ {maxPrice.toFixed(0)}
        </>
      );
    }
    if (price) {
      return (
        <>
          <span className="text-xs font-normal">From </span>
          S${price.toFixed(0)}
        </>
      );
    }
    return "N/A";
  };

  /* ---- navigation handler ---- */
  const handleSelect = () => {
    navigate("/detail", {
      state: {
        hotelId: h.id,
        destinationId: h.destination_id || dest,
        checkin,
        checkout,
        lang,
        currency,
        countryCode,
        guests,
        hotelData: h,
        defaultValues: {
          DEST: dest,
          IN: inDate,
          OUT: outDate,
          GUESTS: guests,
          CURR: currency,
          CC: countryCode,
          LANG: lang,
          DEST_LABEL: destLabel,
        },
      },
    });
  };

  /* ---------- JSX ---------- */
  return (
    <li className="flex bg-white border border-gray-300 rounded-md overflow-hidden hover:shadow-md transition">
      {/* left: image */}
      <img
        src={getImageUrl(h)}
        alt={h.name}
        className="w-[180px] h-[150px] object-cover flex-shrink-0"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = PLACEHOLDER;
        }}
      />

      {/* middle */}
      <div className="flex-1 flex flex-col gap-1 px-4 py-3">
        {/* hotel name + score badge */}
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold leading-tight">{h.name}</h2>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${
              guestScore ? "bg-green-600 text-white" : "bg-gray-300 text-gray-700"
            }`}
          >
            {guestLabel}
          </span>
        </div>

        {/* address */}
        {h.address && (
          <p className="flex items-center gap-1 text-xs text-gray-600">
            <LocationPin className="w-3.5 h-3.5 text-red-500" />
            {h.address}
          </p>
        )}

        {/* stars row (no reviews) */}
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <div className="flex gap-[2px]">
            {Array.from({ length: fullStars }).map((_, i) => (
              <img key={`full-${i}`} src={starFull} alt="★" className="w-3.5 h-3.5" />
            ))}
            {hasHalfStar && (
              <img src={starHalf} alt="½" className="w-3.5 h-3.5" />
            )}
          </div>
          {rawRating ? (
            <span className="font-medium">({rawRating.toFixed(1)})</span>
          ) : (
            <span className="font-medium">(NR)</span> // NR = No rating
          )}
        </div>

        {/* one-line description */}
        {h.description && (
          <p className="text-xs text-gray-700 line-clamp-1">
            {h.description.split(".")[0]}.
          </p>
        )}
      </div>

      {/* right column */}
      <div className="w-[165px] flex flex-col items-end px-4 py-3 text-right">
        <div className="text-xs text-gray-600">
          1 room&nbsp;{nights}&nbsp;night{nights > 1 ? "s" : ""}
        </div>

        <div className="mt-auto mb-1 text-lg font-bold text-yellow-500 leading-snug">
          {getPriceDisplay()}
        </div>

        <button
          onClick={handleSelect}
          className="w-full text-center py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
        >
          Select
        </button>
      </div>
    </li>
  );
}