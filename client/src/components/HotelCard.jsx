// src/components/HotelCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import starFilled from "../assets/starIconFilled.svg";

/* fallback image */
const PLACEHOLDER =
  "https://dummyimage.com/300x200/cccccc/000000&text=No+Image";
  
const getImageUrl = (h) => {
  // 1. Kaligo-style top-level image_details
  if (h.image_details?.count) {
    const idx =
      h.image_details.default_image_index ??
      (h.image_details.count > 1 ? 1 : 0);
    return `${h.image_details.prefix}${idx}${h.image_details.suffix}`;
  }

  // 2. Expedia-style top-level images[]
  if (Array.isArray(h.images) && h.images.length) {
    return h.images[0].url;
  }

  // 3. Rate payload: rooms[0].images[]
  if (
    Array.isArray(h.rooms) &&
    h.rooms.length &&
    Array.isArray(h.rooms[0].images) &&
    h.rooms[0].images.length
  ) {
    return h.rooms[0].images[0].url;
  }

  // 4. Fallback
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

export default function HotelCard({ hotel: h, checkin, checkout }) {
  const stars = Math.round(h.rating || 0);
  const guestScore = h.trustyou?.score?.overall ?? null;
  const reviewLabel = h.trustyou?.score?.overall
    ? `${h.trustyou.score.overall} reviews`
    : "No reviews";

  const nights = Math.max(
    1,
    (new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24)
  );

  const priceText = h.price
    ? h.price.min === h.price.max
      ? `S$ ${h.price.min.toFixed(0)} (${nights} night${nights > 1 ? "s" : ""})`
      : `S$ ${h.price.min.toFixed(0)} – S$ ${h.price.max.toFixed(0)} (${nights} night${nights > 1 ? "s" : ""})`
    : "Price not available";

  return (
    <li className="flex bg-white border border-gray-300 rounded-md overflow-hidden hover:shadow-md transition">

      {/* ── Fixed-size image (180 × 150) ───────────────────── */}
      <img
        src={getImageUrl(h)}
        alt={h.name}
        className="w-[180px] h-[150px] object-cover flex-shrink-0"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = PLACEHOLDER;
        }}
      />

      {/* ── Middle section ────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-1 px-4 py-3">

        {/* Hotel name + score badge */}
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold leading-tight">{h.name}</h2>
          {guestScore && (
            <span className="bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
              {(guestScore / 10).toFixed(1)}
            </span>
          )}
        </div>

        {/* Address */}
        {h.address && (
          <p className="flex items-center gap-1 text-xs text-gray-600">
            <LocationPin className="w-3.5 h-3.5 text-red-500" />
            {h.address}
          </p>
        )}

        {/* Stars + review count */}
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <div className="flex gap-[2px]">
            {Array.from({ length: stars }).map((_, i) => (
              <img key={i} src={starFilled} alt="★" className="w-3.5 h-3.5" />
            ))}
          </div>
          {h.rating && <span className="font-medium">({h.rating.toFixed(1)})</span>}
          <span className="text-gray-500">({reviewLabel})</span>
        </div>

        {/* One-line description */}
        {h.description && (
          <p className="text-xs text-gray-700 line-clamp-1">
            {h.description.split(".")[0]}.
          </p>
        )}

        {/* Distance */}
        {h.distance && (
          <span className="text-[11px] text-gray-400 mt-auto">
            {(h.distance / 1000).toFixed(1)} km away
          </span>
        )}
      </div>

      {/* ── Right column: nights • price • button ─────────── */}
      <div className="w-[165px] flex flex-col items-end px-4 py-3 text-right">

        {/* nights */}
        <div className="text-xs text-gray-600">
          1 room&nbsp;{nights}&nbsp;night{nights > 1 ? "s" : ""}
        </div>

        {/* price range */}
        <div className="mt-auto mb-1 text-lg font-bold text-yellow-500 text-right leading-snug">
          {h.price?.min
            ? h.price.min === h.price.max
              ? `S$${h.price.min.toLocaleString()}`
              : <>
                  S$ {h.price.min.toLocaleString()} <br />
                  – S$ {h.price.max.toLocaleString()}
                </>
            : "N/A"}
        </div>

        {/* select button */}
        <Link
          to={`/detail?hotel_id=${h.id}`}
          className="w-full text-center py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
        >
          Select
        </Link>
      </div>
    </li>

  );
}