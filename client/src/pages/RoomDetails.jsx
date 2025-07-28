import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Users,
  LayoutGrid,
  Tv,
  Utensils,
  Bed,
  Bath,
  Wrench,
  AirVent,
  Info,
  Wifi,
  Accessibility,
  Leaf,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import parse, { domToReact } from "html-react-parser";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import defaultHotelImg from "@/assets/hotelImage.png";

// -----------------------------
// RoomCard Component
// -----------------------------
const RoomCard = ({ room }) => {
  const [showModal, setShowModal] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [sliderRef, instanceRef] = useKeenSlider({
    loop: true,
    slides: { perView: 1 },
  });

  const {
    images = [],
    roomDescription,
    long_description,
    amenities = [],
    price,
    converted_price,
    currency = "$",
    surcharges = [],
    roomAdditionalInfo = {},
    free_cancellation,
  } = room;

  const displayPrice = price ?? converted_price ?? "N/A";
  const { breakfastInfo, displayFields = {} } = roomAdditionalInfo;
  const {
    special_check_in_instructions: checkInInstructions,
    know_before_you_go: knowBeforeYouGo,
    fees_optional: feesOptional,
  } = displayFields;

  const boldIconMap = {
    entertainment: Tv,
    "food & drink": Utensils,
    sleep: Bed,
    bathroom: Bath,
    practical: Wrench,
    comfort: AirVent,
    "need to know": Info,
    "club/executive level": Users,
    layout: LayoutGrid,
    internet: Wifi,
    accessibility: Accessibility,
    eco: Leaf,
  };

  const replaceNode = (domNode) => {
    if (
      (domNode.name === "strong" || domNode.name === "b") &&
      domNode.children
    ) {
      const raw = domNode.children
        .map((c) => c.data || "")
        .join("")
        .toLowerCase()
        .trim();
      let Icon = boldIconMap[raw];
      if (!Icon) {
        const entry = Object.entries(boldIconMap).find(([kw]) =>
          raw.includes(kw)
        );
        Icon = entry?.[1] ?? null;
      }
      return (
        <span className="flex items-center gap-1">
          {Icon && <Icon className="w-4 h-4 text-primary flex-shrink-0" />}
          <strong>{domToReact(domNode.children)}</strong>
        </span>
      );
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Carousel */}
            <div className="w-full md:w-84 flex-shrink-0">
              {images.length > 0 ? (
                <>
                  <div className="relative group">
                    <div
                      ref={sliderRef}
                      className="keen-slider rounded overflow-hidden h-48"
                    >
                      {images.map((img, i) => {
                        const url = img.high_resolution_url || img.url;
                        return (
                          <div
                            key={i}
                            className="keen-slider__slide cursor-pointer"
                            onClick={() => {
                              setShowModal(true);
                              setCurrentImage(url);
                            }}
                          >
                            <img
                              src={url}
                              alt={`Room image ${i + 1}`}
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => instanceRef.current?.prev()}
                      className="absolute top-1/2 left-2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-100"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-800" />
                    </button>
                    <button
                      onClick={() => instanceRef.current?.next()}
                      className="absolute top-1/2 right-2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-100"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-800" />
                    </button>
                  </div>
                  <button
                    onClick={() => setShowMore((p) => !p)}
                    className="mt-3 text-primary text-sm font-medium hover:underline"
                  >
                    {showMore ? "Hide details ▲" : "Show more details ▼"}
                  </button>
                  {showMore && (
                    <div className="mt-3 space-y-2 text-xs text-gray-700 prose max-w-none">
                      {checkInInstructions && (
                        <>
                          <h5 className="font-semibold">
                            Check-in Instructions
                          </h5>
                          <div>{parse(checkInInstructions)}</div>
                        </>
                      )}
                      {knowBeforeYouGo && (
                        <>
                          <h5 className="font-semibold mt-3">
                            Know Before You Go
                          </h5>
                          <div>{parse(knowBeforeYouGo)}</div>
                        </>
                      )}
                      {feesOptional && (
                        <>
                          <h5 className="font-semibold mt-3">Optional Fees</h5>
                          <div>{parse(feesOptional)}</div>
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            {/* Room Info */}
            <div className="flex-grow space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  {roomDescription || "Room"}
                </h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    free_cancellation
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {free_cancellation ? "Free Cancellation" : "Non-refundable"}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                {parse(long_description || "", { replace: replaceNode })}
              </div>
              {amenities.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-1">Amenities:</h4>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((a, i) => (
                      <span
                        key={i}
                        className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-2xl font-bold text-primary">
                    {currency}
                    {typeof displayPrice === "number"
                      ? displayPrice.toLocaleString()
                      : displayPrice}
                  </span>
                  <p className="text-xs text-gray-500">per night</p>
                </div>
                <Button onClick={() => alert("test")} size="lg">
                  Reserve
                </Button>
              </div>
              {surcharges.length > 0 && (
                <div className="text-xs text-gray-500">
                  <strong>Taxes & fees included:</strong>{" "}
                  {surcharges
                    .map(
                      (s) =>
                        `${currency}${s.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                    )
                    .join(", ")}
                </div>
              )}
              {breakfastInfo && (
                <div className="text-xs text-gray-600 italic mt-1">
                  Breakfast Info: {breakfastInfo.replace(/_/g, " ")}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && currentImage && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 cursor-pointer p-4"
        >
          <img
            src={currentImage}
            alt="Room image"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 text-white text-3xl font-bold"
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
};

const GoogleMapEmbed = ({ lat, lng }) => {
  const url = `https://www.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`;
  return (
    <div className="w-full rounded-lg overflow-hidden shadow">
      <iframe
        title="Hotel Location"
        width="100%"
        height="325"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        src={url}
      />
    </div>
  );
};

// -----------------------------
// RoomDetails Page Component
// -----------------------------
const RoomDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const {
    hotelId,
    destinationId,
    checkin,
    checkout,
    lang,
    currency,
    countryCode,
    guests,
    hotelData: passedHotelData,
    defaultValues = {},
  } = state;

  const effectiveParams = {
    hotelId: hotelId || defaultValues.hotelId || "diH7",
    destinationId: destinationId || defaultValues.destinationId || "WD0M",
    checkin: checkin || defaultValues.checkin || "2025-10-10",
    checkout: checkout || defaultValues.checkout || "2025-10-17",
    lang: lang || defaultValues.lang || "en_US",
    currency: currency || defaultValues.currency || "SGD",
    countryCode: countryCode || defaultValues.countryCode || "SG",
    guests: guests || defaultValues.guests || "2",
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hotelData, setHotelData] = useState(passedHotelData || null);
  const [showModal, setShowModal] = useState(false);
  const [failedImages, setFailedImages] = useState(new Set());

  const fetchRoomDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:8080/api/hotels/${effectiveParams.hotelId}/price`,
        {
          params: {
            destination_id: effectiveParams.destinationId,
            checkin: effectiveParams.checkin,
            checkout: effectiveParams.checkout,
            lang: effectiveParams.lang,
            currency: effectiveParams.currency,
            country_code: effectiveParams.countryCode,
            guests: effectiveParams.guests,
            partner_id: "1089",
            landing_page: "wl-acme-earn",
            product_type: "earn",
          },
        }
      );
      setHotelData((prev) => ({
        ...prev,
        ...response.data,
        rooms: response.data.rooms?.map((room) => ({
          ...room,
          images: room.images || [],
        })),
        completed: true,
      }));
    } catch (err) {
      console.error(err);
      setError("Failed to load hotel details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hotelData?.rooms || !hotelData?.completed) {
      fetchRoomDetails();
    }
  }, [hotelId, destinationId, checkin, checkout]);

  const guestCounts = effectiveParams.guests.split("|").map(Number);
  const totalGuests = guestCounts.reduce((a, b) => a + b, 0);
  const roomCount = guestCounts.length;

  const images = [];
  if (hotelData?.image_details?.count > 0) {
    images.push(
      ...Array.from({ length: hotelData.image_details.count }).map(
        (_, idx) => ({
          src: `${hotelData.image_details.prefix}${idx}${hotelData.image_details.suffix}`,
          alt: `Hotel image ${idx + 1}`,
        })
      )
    );
  } else if (hotelData?.images?.length > 0) {
    images.push(
      ...hotelData.images.map((img) => ({
        src: img.high_resolution_url || img.url,
        alt: img.alt || "Hotel image",
      }))
    );
  } else if (hotelData?.rooms?.[0]?.images?.length > 0) {
    images.push(
      ...hotelData.rooms[0].images.map((img) => ({
        src: img.high_resolution_url || img.url,
        alt: img.alt || "Room image",
      }))
    );
  }

  const validImages = images.filter((_, idx) => !failedImages.has(idx));
  const visibleCount = 3;
  const remainingImages = Math.max(0, validImages.length - visibleCount);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (error || !hotelData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => navigate(-1)} variant="default">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-30 mx-auto px-4 py-8 space-y-6 max-w-6xl">
        <h1 className="text-2xl font-bold mb-4">{hotelData.name}</h1>

        {/* Image + Map Grid */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left: Image Grid */}
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <div
              className="relative w-full rounded overflow-hidden shadow"
              style={{ height: "200px" }}
            >
              <img
                src={validImages[0]?.src}
                alt={validImages[0]?.alt}
                className="absolute inset-0 w-full h-full object-contain bg-gray-100"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = defaultHotelImg || DEFAULT_ROOM_IMG;
                  e.currentTarget.alt = "Default room image";
                }}
              />
            </div>
            <div className="flex gap-2">
              <div
                className="w-1/2 relative bg-gray-100 rounded overflow-hidden flex items-center justify-center"
                style={{ height: "118px" }}
              >
                <img
                  src={validImages[1]?.src}
                  alt={validImages[1]?.alt}
                  className="object-contain max-w-full max-h-full"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = defaultHotelImg || DEFAULT_ROOM_IMG;
                    e.currentTarget.alt = "Default room image";
                  }}
                />
              </div>
              <div
                className="w-1/2 relative bg-gray-100 rounded overflow-hidden flex items-center justify-center cursor-pointer"
                style={{ height: "118px" }}
                onClick={() => setShowModal(true)}
              >
                <img
                  src={validImages[2]?.src}
                  alt={validImages[2]?.alt}
                  className="object-contain max-w-full max-h-full"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = defaultHotelImg || DEFAULT_ROOM_IMG;
                    e.currentTarget.alt = "Default room image";
                  }}
                />
                {remainingImages > 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded">
                    <span className="text-white text-lg font-semibold drop-shadow">
                      +{remainingImages}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Map */}
          <div className="w-full md:w-1/2">
            <GoogleMapEmbed
              lat={hotelData.latitude || 1.318685}
              lng={hotelData.longitude || 103.847882}
            />
          </div>
        </div>

        {/* Booking Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Check-in", effectiveParams.checkin],
              ["Check-out", effectiveParams.checkout],
              ["Guests", totalGuests],
              ["Rooms", roomCount],
              ["Currency", effectiveParams.currency],
            ].map(([label, val], i) => (
              <div key={i}>
                {i > 0 && <Separator />}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span>{val}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Full Gallery Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <div
              className="relative bg-white p-4 rounded shadow-lg max-h-[90vh] overflow-y-auto w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 text-gray-600 hover:text-black"
                onClick={() => setShowModal(false)}
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-bold mb-2 text-center">
                Hotel Gallery
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {validImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="w-full aspect-video bg-gray-100 flex items-center justify-center rounded overflow-hidden"
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="object-contain max-h-full max-w-full"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          defaultHotelImg || DEFAULT_ROOM_IMG;
                        e.currentTarget.alt = "Default room image";
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hotel Details */}
        <Card>
          <CardHeader>
            <CardTitle>Hotel Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2">Hotel ID: {hotelId}</p>
            {hotelData.completed ? (
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Search Completed</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <X className="w-5 h-5 text-red-500" />
                <span>Search In Progress</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Rooms */}
        <Card>
          <CardHeader>
            <CardTitle>Available Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            {hotelData.rooms?.length > 0 ? (
              hotelData.rooms.map((r, i) => (
                <RoomCard key={r.key || i} room={r} />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No rooms available.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RoomDetails;
