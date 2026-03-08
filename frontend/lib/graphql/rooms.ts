import { gql } from "@apollo/client";

export const ALL_ROOMS = gql`
  query AllRooms($status: String) {
    allRooms(status: $status) {
      id
      number
      roomType
      capacity
      basePrice
      status
      building {
        id
        name
      }
      floor {
        id
        number
      }
    }
  }
`;

export const GET_ROOM = gql`
  query GetRoom($id: Int!) {
    room(id: $id) {
      id
      number
      roomType
      capacity
      basePrice
      status
      building {
        id
        name
      }
      floor {
        id
        number
      }
    }
  }
`;

export const ALL_BUILDINGS = gql`
  query AllBuildings($locationId: Int) {
    allBuildings(locationId: $locationId) {
      id
      name
      location {
        id
        name
      }
    }
  }
`;

export const ALL_FLOORS = gql`
  query AllFloors($buildingId: Int) {
    allFloors(buildingId: $buildingId) {
      id
      number
      building {
        id
        name
      }
    }
  }
`;

export const CREATE_ROOM = gql`
  mutation CreateRoom(
    $buildingId: Int!
    $floorId: Int!
    $number: String!
    $roomType: String
    $capacity: Int
    $basePrice: Decimal!
  ) {
    createRoom(
      buildingId: $buildingId
      floorId: $floorId
      number: $number
      roomType: $roomType
      capacity: $capacity
      basePrice: $basePrice
    ) {
      room {
        id
        number
        roomType
        status
      }
    }
  }
`;

export const UPDATE_ROOM = gql`
  mutation UpdateRoom(
    $id: Int!
    $roomType: String
    $capacity: Int
    $basePrice: Decimal
    $status: String
  ) {
    updateRoom(
      id: $id
      roomType: $roomType
      capacity: $capacity
      basePrice: $basePrice
      status: $status
    ) {
      room {
        id
        number
        roomType
        capacity
        basePrice
        status
      }
    }
  }
`;
