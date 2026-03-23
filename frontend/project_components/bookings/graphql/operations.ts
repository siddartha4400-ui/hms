import { gql } from '@apollo/client';

export const SEARCH_AVAILABILITY_QUERY = gql`
  query SearchAvailability(
    $cityId: Int
    $checkIn: String!
    $checkOut: String!
    $guestCount: Int!
    $hmsName: String
    $propertyType: String
  ) {
    searchAvailability(
      cityId: $cityId
      checkIn: $checkIn
      checkOut: $checkOut
      guestCount: $guestCount
      hmsName: $hmsName
      propertyType: $propertyType
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
      floorId
      floorNumber
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
        bookedByName
        bookedByEmail
        primaryGuestMobile
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

export const APPROVE_BOOKING_MUTATION = gql`
  mutation ApproveBooking($bookingReference: String!, $hmsId: Int) {
    approveBooking(bookingReference: $bookingReference, hmsId: $hmsId) {
      success
      message
      booking {
        id
        bookingReference
        status
      }
    }
  }
`;

export const REJECT_BOOKING_MUTATION = gql`
  mutation RejectBooking($bookingReference: String!, $hmsId: Int) {
    rejectBooking(bookingReference: $bookingReference, hmsId: $hmsId) {
      success
      message
      booking {
        id
        bookingReference
        status
      }
    }
  }
`;

export const CANCEL_BOOKING_MUTATION = gql`
  mutation CancelBooking($bookingReference: String!, $hmsId: Int) {
    cancelBooking(bookingReference: $bookingReference, hmsId: $hmsId) {
      success
      message
      booking {
        id
        bookingReference
        status
      }
    }
  }
`;

export const COMPLETE_BOOKING_MUTATION = gql`
  mutation CompleteBooking($bookingReference: String!, $hmsId: Int) {
    completeBooking(bookingReference: $bookingReference, hmsId: $hmsId) {
      success
      message
      booking {
        id
        bookingReference
        status
      }
    }
  }
`;

export const CHECK_IN_BOOKING_MUTATION = gql`
  mutation CheckInBooking($bookingReference: String!, $hmsId: Int) {
    checkInBooking(bookingReference: $bookingReference, hmsId: $hmsId) {
      success
      message
      booking {
        id
        bookingReference
        status
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
      bookedByName
      bookedByEmail
      primaryGuestMobile
      createdAtUtc
    }
  }
`;