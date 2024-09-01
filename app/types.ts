export interface User {
    user_id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  }
  
  export interface Room {
    room_id: string;
    room_number: string;
    room_type: string;
    price_per_night: string;
  }
  
  export interface Booking {
    booking_id: string;
    user_id: string;
    room_id: string;
    check_in_date: string;
    check_out_date: string;
    total_price: string;
  }