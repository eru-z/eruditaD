export const DEFAULT_BOOKING_URL =
  "https://calendar.google.com/calendar/u/0/r/eventedit?text=Project%20Discovery%20Call%20with%20Erudita%20Zilbeari&location=Google%20Meet&add=eruditazilbearids%40gmail.com&details=Let's%20schedule%20a%20Google%20Meet%20video%20call%20to%20talk%20through%20the%20project%2C%20goals%2C%20timeline%2C%20and%20next%20steps.%20Erudita%20will%20receive%20this%20calendar%20invite%20at%20eruditazilbearids%40gmail.com.";

export function getBookingUrl(data) {
  return data?.bookingUrl || DEFAULT_BOOKING_URL;
}
