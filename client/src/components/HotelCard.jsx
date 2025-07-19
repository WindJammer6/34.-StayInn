// src/components/HotelCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import starFilled from "../assets/starIconFilled.svg";

/* fallback image */
const PLACEHOLDER =
  "https://dummyimage.com/300x200/cccccc/000000&text=No+Image";

const getImageUrl = (h) => {
  const img = h.image_details;
  if (!img || img.count === 0) return PLACEHOLDER;

  const idx =
    img.default_image_index !== undefined
      ? img.default_image_index
      : img.count > 1
      ? 1
      : 0;

  return `${img.prefix}${idx}${img.suffix}`;
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
    <li>
      <Link
        to={`/detail?hotel_id=${h.id}`}
        className="flex flex-col md:flex-row items-stretch bg-gray-100 rounded-lg shadow-sm hover:bg-gray-200 hover:shadow-md transition overflow-hidden"
      >
        {/* Image column */}
        <div className="w-full md:w-56 shrink-0 flex">
          <img
            src={getImageUrl(h)}
            alt={h.name}
            className="w-full h-full object-cover md:rounded-l-lg rounded-t-lg md:rounded-t-none"
          />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col gap-2 py-3 px-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{h.name}</h2>
              {guestScore && (
                <span className="px-2.5 py-1 bg-green-600 text-white text-sm rounded-md font-semibold">
                  {(guestScore / 10).toFixed(1)}
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mt-1 flex items-center gap-1">
              <LocationPin className="w-4 h-4 text-red-500 shrink-0" />
              <span>{h.address}</span>
            </p>
          </div>

          {/* Stars + Review count */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex gap-0.5">
              {Array.from({ length: stars }).map((_, i) => (
                <img key={i} src={starFilled} alt="★" className="w-4 h-4" />
              ))}
            </div>
            {h.rating && <span className="text-gray-700">({h.rating.toFixed(1)})</span>}
            <span className="text-gray-500">({reviewLabel})</span>
          </div>

          {/* Description first sentence */}
          {h.description && (
            <p className="text-sm text-gray-700 line-clamp-2">
              {h.description.split(".")[0]}.
            </p>
          )}

          <div className="border-t my-2" />

          <div className="flex justify-between items-end mt-auto pb-0">
            {h.distance && (
              <span className="text-sm text-gray-500">
                {(h.distance / 1000).toFixed(1)} km away
              </span>
            )}
            <span className="text-lg font-semibold text-right">
              {priceText}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
