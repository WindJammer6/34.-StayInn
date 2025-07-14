import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Plane, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import parse from 'html-react-parser';

const RoomCard = ({ room }) => {
  const [showModal, setShowModal] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const {
    images = [],
    roomDescription,
    long_description,
    amenities = [],
    price,
    converted_price,
    currency = "$",
    surcharges = [],
    points,
    roomAdditionalInfo = {},
    free_cancellation,
  } = room;

  const displayPrice = price || converted_price || "N/A";
  const {
    breakfastInfo,
    displayFields = {},
  } = roomAdditionalInfo;
  const {
    special_check_in_instructions: checkInInstructions,
    know_before_you_go: knowBeforeYouGo,
    fees_optional: feesOptional,
  } = displayFields;

  const heroImage = images.find((img) => img.hero_image) || images[0];
  const displayImageUrl = heroImage?.high_resolution_url || heroImage?.url;

  const toggleShowMore = () => setShowMore((prev) => !prev);

  return (
    <>
      <Card>
        {displayImageUrl && (
          <img
            src={displayImageUrl}
            alt={roomDescription}
            className="w-full h-48 object-cover cursor-pointer rounded-t"
            onClick={() => setShowModal(true)}
          />
        )}

        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">{roomDescription || "Room"}</h3>
            {free_cancellation ? (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                Free Cancellation
              </span>
            ) : (
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                Non-refundable
              </span>
            )}
          </div>

          <div className="prose max-w-none text-sm text-gray-700">
            {parse(long_description || "No description available")}
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
            {points && (
              <div className="text-right text-sm text-gray-600">
                or {points.toLocaleString()} points
              </div>
            )}
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

          <button
            onClick={toggleShowMore}
            className="mt-3 text-primary text-sm font-medium hover:underline focus:outline-none"
            aria-expanded={showMore}
          >
            {showMore ? "Hide details ▲" : "Show more details ▼"}
          </button>

          {showMore && (
            <div className="mt-3 space-y-2 text-xs text-gray-700 prose max-w-none">
              {checkInInstructions && (
                <>
                  <h5 className="font-semibold">Check-in Instructions</h5>
                  <div>{parse(checkInInstructions)}</div>
                </>
              )}
              {knowBeforeYouGo && (
                <>
                  <h5 className="font-semibold mt-3">Know Before You Go</h5>
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
        </CardContent>
      </Card>

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 cursor-pointer p-4"
        >
          <img
            src={displayImageUrl}
            alt={roomDescription}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded shadow-lg"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking the image
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

const RoomDetails = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hotelData, setHotelData] = useState(null);
  const searchParams = new URLSearchParams(window.location.search);
  const hotelId = searchParams.get("hotel_id") || "diH7";

  const fetchRoomDetails = async (hotelId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:8080/api/hotels/${hotelId}/price`,
        {
          params: {
            destination_id: searchParams.get("destination_id") || "WD0M",
            checkin: searchParams.get("checkin") || "2025-10-10",
            checkout: searchParams.get("checkout") || "2025-10-17",
            lang: searchParams.get("lang") || "en_US",
            currency: searchParams.get("currency") || "SGD",
            country_code: searchParams.get("country_code") || "SG",
            guests: searchParams.get("guests") || "2",
            partner_id: "1",
          },
        }
      );
      setHotelData(response.data);
    } catch (err) {
      console.error("Failed to load hotel details:", err);
      setError("Failed to load hotel details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomDetails(hotelId);
  }, [hotelId]);

  const guestsString = searchParams.get("guests") || "1";
  const guestCounts = guestsString.split("|").map(Number);
  const totalGuests = guestCounts.reduce((a, b) => a + b, 0);
  const roomCount = guestCounts.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (error || !hotelData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">
          {error || "Hotel data unavailable."}
        </p>
        <Button onClick={() => navigate(-1)} variant="default">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-30 container mx-auto px-4 py-8 space-y-6">
        {/* Hotel Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Check-in</span>
              <span>{searchParams.get("checkin") || "-"}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Check-out</span>
              <span>{searchParams.get("checkout") || "-"}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Guests</span>
              <span>{totalGuests}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rooms</span>
              <span>{roomCount}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Currency</span>
              <span>{searchParams.get("currency") || "-"}</span>
            </div>
          </CardContent>
        </Card>

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
            {hotelData.rooms && hotelData.rooms.length > 0 ? (
              <div className="space-y-4">
                {hotelData.rooms.map((room, idx) => (
                  <RoomCard key={room.key || idx} room={room} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No rooms available for your selected dates.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RoomDetails;

