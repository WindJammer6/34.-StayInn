import { useEffect } from "react";
import axios from "axios";

const RoomDetails = () => {
  const fetchRoomDetails = async (hotelId) => {
    const searchParams = new URLSearchParams(window.location.search);

    const response = await axios.get(
      `http://localhost:8080/api/hotels/${hotelId}/prices`,
      {
        params: {
          destination_id: searchParams.get("destination_id"),
          checkin: searchParams.get("checkin"),
          checkout: searchParams.get("checkout"),
          guests: searchParams.get("guests"),
          lang: searchParams.get("lang"),
          currency: searchParams.get("currency"),
          country_code: searchParams.get("country_code"),
        },
      }
    );

    console.log(response.data);
  };

  useEffect(() => {
    fetchRoomDetails("1001"); // Example hotelId
  }, []);

  return (
    <main>
      <h1>Room Details</h1>
    </main>
  );
};

export default RoomDetails;
