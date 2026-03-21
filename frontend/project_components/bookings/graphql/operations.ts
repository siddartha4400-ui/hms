import { gql } from '@apollo/client';

export const SEARCH_AVAILABILITY_QUERY = gql`
  query SearchAvailability(
    $cityId: Int
    $checkIn: String!
    $checkOut: String!
    $guestCount: Int!
    $hmsName: String
  ) {
    searchAvailability(
      cityId: $cityId
      checkIn: $checkIn
      checkOut: $checkOut
      guestCount: $guestCount
      hmsName: $hmsName
    ) {
      inventoryType
      bookingTargetId
      hmsId
      hmsName
      hmsDisplayName
      imageUrl
      cityId
      cityName
      buildingId
      buildingName
      location
      propertyType
      roomId
      roomNumber
      roomType
      bedId
      bedNumber
      guestCapacity
      pricePerDay
      pricePerMonth
      totalAmount
      available
    }
  }
`;

export const CREATE_BOOKING_MUTATION = gql`
  mutation CreateBooking(
    $inventoryType: String!
    $roomId: Int
    $bedId: Int
    $checkIn: String!
    $checkOut: String!
    $guestCount: Int!
    $paymentMethod: String!
    $specialRequest: String
    $guests: [BookingGuestInput!]!
  ) {
    createBooking(
      inventoryType: $inventoryType
      roomId: $roomId
      bedId: $bedId
      checkIn: $checkIn
      checkOut: $checkOut
      guestCount: $guestCount
      paymentMethod: $paymentMethod
      specialRequest: $specialRequest
      guests: $guests
    ) {
      success
      message
      booking {
        id
        bookingReference
        status
        inventoryType
        hmsDisplayName
        cityName
        buildingName
        roomNumber
        bedNumber
        checkIn
        checkOut
        guestCount
        totalAmount
        guests {
          id
          fullName
          mobileNumber
          aadhaarAttachmentId
          aadhaarAttachmentUrl
        }
      }
    }
  }
`;

export const LIST_BOOKINGS_QUERY = gql`
  query ListBookings($view: String!, $mine: Boolean, $hmsId: Int) {
    listBookings(view: $view, mine: $mine, hmsId: $hmsId) {
      id
      bookingReference
      status
      paymentMethod
      inventoryType
      hmsDisplayName
      cityName
      buildingName
      roomNumber
      bedNumber
      checkIn
      checkOut
      guestCount
      totalAmount
      createdAtUtc
    }
  }
`;