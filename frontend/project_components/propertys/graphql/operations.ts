import { gql } from '@apollo/client';

export const LIST_CITIES_QUERY = gql`
  query ListCities($isActive: Boolean) {
    listCities(isActive: $isActive) {
      id
      cityName
      state
      country
      isActive
    }
  }
`;

export const LIST_BUILDINGS_QUERY = gql`
  query ListBuildings($companyId: Int, $cityId: Int, $isActive: Boolean) {
    listBuildings(companyId: $companyId, cityId: $cityId, isActive: $isActive) {
      id
      companyId
      cityId
      cityName
      name
      location
      latitude
      longitude
      propertyType
      buildingImageAttachmentId
      floorImageAttachmentId
      roomImageAttachmentId
      bathroomImageAttachmentId
      buildingImageUrl
      floorImageUrl
      roomImageUrl
      bathroomImageUrl
      galleryImages
      isActive
    }
  }
`;

export const LIST_FLOORS_QUERY = gql`
  query ListFloors($buildingId: Int, $isActive: Boolean) {
    listFloors(buildingId: $buildingId, isActive: $isActive) {
      id
      buildingId
      floorNumber
      description
      isActive
    }
  }
`;

export const LIST_ROOMS_QUERY = gql`
  query ListRooms($buildingId: Int, $floorId: Int, $isActive: Boolean) {
    listRooms(buildingId: $buildingId, floorId: $floorId, isActive: $isActive) {
      id
      buildingId
      floorId
      roomNumber
      roomType
      pricePerDay
      pricePerMonth
      status
      capacity
      bedCount
      isActive
    }
  }
`;

export const LIST_BEDS_QUERY = gql`
  query ListBeds($roomId: Int, $isActive: Boolean) {
    listBeds(roomId: $roomId, isActive: $isActive) {
      id
      roomId
      bedNumber
      status
      isActive
    }
  }
`;

export const CREATE_CITY_MUTATION = gql`
  mutation CreateCity($cityName: String!, $state: String, $country: String, $isActive: Boolean) {
    createCity(cityName: $cityName, state: $state, country: $country, isActive: $isActive) {
      success
      message
      city {
        id
        cityName
      }
    }
  }
`;

export const UPDATE_CITY_MUTATION = gql`
  mutation UpdateCity($cityId: Int!, $cityName: String, $state: String, $country: String, $isActive: Boolean) {
    updateCity(cityId: $cityId, cityName: $cityName, state: $state, country: $country, isActive: $isActive) {
      success
      message
      city {
        id
        isActive
      }
    }
  }
`;

export const CREATE_BUILDING_MUTATION = gql`
  mutation CreateBuilding(
    $companyId: Int!
    $cityId: Int!
    $name: String!
    $location: String
    $latitude: Float
    $longitude: Float
    $propertyType: String!
    $buildingImageAttachmentId: Int
    $floorImageAttachmentId: Int
    $roomImageAttachmentId: Int
    $bathroomImageAttachmentId: Int
    $isActive: Boolean
  ) {
    createBuilding(
      companyId: $companyId
      cityId: $cityId
      name: $name
      location: $location
      latitude: $latitude
      longitude: $longitude
      propertyType: $propertyType
      buildingImageAttachmentId: $buildingImageAttachmentId
      floorImageAttachmentId: $floorImageAttachmentId
      roomImageAttachmentId: $roomImageAttachmentId
      bathroomImageAttachmentId: $bathroomImageAttachmentId
      isActive: $isActive
    ) {
      success
      message
      building {
        id
      }
    }
  }
`;

export const UPDATE_BUILDING_MUTATION = gql`
  mutation UpdateBuilding(
    $buildingId: Int!
    $cityId: Int
    $name: String
    $location: String
    $latitude: Float
    $longitude: Float
    $propertyType: String
    $buildingImageAttachmentId: Int
    $floorImageAttachmentId: Int
    $roomImageAttachmentId: Int
    $bathroomImageAttachmentId: Int
    $isActive: Boolean
  ) {
    updateBuilding(
      buildingId: $buildingId
      cityId: $cityId
      name: $name
      location: $location
      latitude: $latitude
      longitude: $longitude
      propertyType: $propertyType
      buildingImageAttachmentId: $buildingImageAttachmentId
      floorImageAttachmentId: $floorImageAttachmentId
      roomImageAttachmentId: $roomImageAttachmentId
      bathroomImageAttachmentId: $bathroomImageAttachmentId
      isActive: $isActive
    ) {
      success
      message
    }
  }
`;

export const DELETE_BUILDING_MUTATION = gql`
  mutation DeleteBuilding($buildingId: Int!) {
    deleteBuilding(buildingId: $buildingId) {
      success
      message
    }
  }
`;

export const CREATE_FLOOR_MUTATION = gql`
  mutation CreateFloor($buildingId: Int!, $floorNumber: Int!, $description: String, $isActive: Boolean) {
    createFloor(buildingId: $buildingId, floorNumber: $floorNumber, description: $description, isActive: $isActive) {
      success
      message
      floor {
        id
      }
    }
  }
`;

export const UPDATE_FLOOR_MUTATION = gql`
  mutation UpdateFloor($floorId: Int!, $floorNumber: Int, $description: String, $isActive: Boolean) {
    updateFloor(floorId: $floorId, floorNumber: $floorNumber, description: $description, isActive: $isActive) {
      success
      message
    }
  }
`;

export const DELETE_FLOOR_MUTATION = gql`
  mutation DeleteFloor($floorId: Int!) {
    deleteFloor(floorId: $floorId) {
      success
      message
    }
  }
`;

export const CREATE_ROOM_MUTATION = gql`
  mutation CreateRoom(
    $buildingId: Int!
    $floorId: Int!
    $roomNumber: String!
    $roomType: String
    $pricePerDay: Float
    $pricePerMonth: Float
    $status: String
    $capacity: Int
    $isActive: Boolean
  ) {
    createRoom(
      buildingId: $buildingId
      floorId: $floorId
      roomNumber: $roomNumber
      roomType: $roomType
      pricePerDay: $pricePerDay
      pricePerMonth: $pricePerMonth
      status: $status
      capacity: $capacity
      isActive: $isActive
    ) {
      success
      message
      room {
        id
      }
    }
  }
`;

export const UPDATE_ROOM_MUTATION = gql`
  mutation UpdateRoom(
    $roomId: Int!
    $roomNumber: String
    $roomType: String
    $pricePerDay: Float
    $pricePerMonth: Float
    $status: String
    $capacity: Int
    $isActive: Boolean
  ) {
    updateRoom(
      roomId: $roomId
      roomNumber: $roomNumber
      roomType: $roomType
      pricePerDay: $pricePerDay
      pricePerMonth: $pricePerMonth
      status: $status
      capacity: $capacity
      isActive: $isActive
    ) {
      success
      message
    }
  }
`;

export const DELETE_ROOM_MUTATION = gql`
  mutation DeleteRoom($roomId: Int!) {
    deleteRoom(roomId: $roomId) {
      success
      message
    }
  }
`;

export const CREATE_BED_MUTATION = gql`
  mutation CreateBed($roomId: Int!, $bedNumber: String!, $status: String, $isActive: Boolean) {
    createBed(roomId: $roomId, bedNumber: $bedNumber, status: $status, isActive: $isActive) {
      success
      message
      bed {
        id
      }
    }
  }
`;

export const UPDATE_BED_MUTATION = gql`
  mutation UpdateBed($bedId: Int!, $bedNumber: String, $status: String, $isActive: Boolean) {
    updateBed(bedId: $bedId, bedNumber: $bedNumber, status: $status, isActive: $isActive) {
      success
      message
    }
  }
`;

export const DELETE_BED_MUTATION = gql`
  mutation DeleteBed($bedId: Int!) {
    deleteBed(bedId: $bedId) {
      success
      message
    }
  }
`;
