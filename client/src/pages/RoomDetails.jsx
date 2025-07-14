import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Plane, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
            checkin: searchParams.get("checkin") || "2025-07-14",
            checkout: searchParams.get("checkout") || "2025-07-15",
            lang: searchParams.get("lang") || "en_US",
            currency: searchParams.get("currency") || "SGD",
            country_code: searchParams.get("country_code") || "SG",
            guests: searchParams.get("guests") || "2",
            partner_id: "1",
          },
        }
      );
      console.log(response.data);
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
  }, []);

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

  const firstRoom = hotelData.rooms ? hotelData.rooms[0] : null;

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
            <p className="text-muted-foreground mb-2">Hotel ID: diH7</p>
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
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">
                            {room.roomDescription || "Room"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {room.bedConfiguration || "Bed info not available"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary">
                            {room.currency || "$"}
                            {room.price || "N/A"}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            per night
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
