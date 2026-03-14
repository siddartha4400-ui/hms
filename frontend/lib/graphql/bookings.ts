import { gql } from "@apollo/client";

export const ALL_BOOKINGS = gql`
  query AllBookings($status: String) {
    allBookings(status: $status) {
      id
      checkIn
      checkOut
      status
      totalPrice
      notes
      createdAt
      guest {
        id
        name
        email
        phone
      }
      room {
        id
        number
        building {
          name
        }
      }
    }
  }
`;

export const GET_BOOKING = gql`
  query GetBooking($id: Int!) {
    booking(id: $id) {
      id
      checkIn
      checkOut
      status
      totalPrice
      notes
      createdAt
      guest {
        id
        name
        email
      }
      room {
        id
        number
        building {
          name
        }
      }
    }
  }
`;

export const ALL_GUESTS = gql`
  query AllGuests {
    allGuests {
      id
      name
      email
      phone
      verified
      createdAt
    }
  }
`;

export const CREATE_GUEST = gql`
  mutation CreateGuest($name: String!, $email: String!, $phone: String) {
    createGuest(name: $name, email: $email, phone: $phone) {
      guest {
        id
        name
        email
      }
    }
  }
`;

export const CREATE_BOOKING = gql`
  mutation CreateBooking(
    $guestId: Int!
    $roomId: Int!
    $checkIn: Date!
    $checkOut: Date!
    $totalPrice: Decimal
    $notes: String
  ) {
    createBooking(
      guestId: $guestId
      roomId: $roomId
      checkIn: $checkIn
      checkOut: $checkOut
      totalPrice: $totalPrice
      notes: $notes
    ) {
      booking {
        id
        status
      }
      message
    }
  }
`;

export const UPDATE_BOOKING_STATUS = gql`
  mutation UpdateBookingStatus($id: Int!, $status: String!) {
    updateBookingStatus(id: $id, status: $status) {
      booking {
        id
        status
      }
    }
  }
`;

export const DASHBOARD_STATS = gql`
  query DashboardStats {
    dashboardStats
  }
`;
