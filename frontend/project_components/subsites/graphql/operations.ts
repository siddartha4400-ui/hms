import { gql } from '@apollo/client';

export const LIST_HMS_QUERY = gql`
  query ListHms {
    subsiteBaseDomain
    listHms {
      id
      hmsName
      subsiteUrl
      hmsType
      isActive
      hmsDisplayName
      adminName
      email
      mobileNumber
      timePeriod
      aboutHms
      logo
      attachmentId
    }
  }
`;

export const CHECK_HMS_NAME_QUERY = gql`
  query CheckHmsNameAvailability($hmsName: String!, $excludeHmsId: Int) {
    checkHmsNameAvailability(hmsName: $hmsName, excludeHmsId: $excludeHmsId) {
      isAvailable
      message
      normalizedName
      subsiteUrl
    }
  }
`;

export const CREATE_HMS_MUTATION = gql`
  mutation CreateHms(
    $hmsName: String!
    $hmsType: Int!
    $isActive: Boolean
    $hmsDisplayName: String!
    $aboutHms: String
    $adminName: String
    $email: String
    $mobileNumber: String
    $password: String
    $timePeriod: Int
    $attachmentId: Int
  ) {
    createHms(
      hmsName: $hmsName
      hmsType: $hmsType
      isActive: $isActive
      hmsDisplayName: $hmsDisplayName
      aboutHms: $aboutHms
      adminName: $adminName
      email: $email
      mobileNumber: $mobileNumber
      password: $password
      timePeriod: $timePeriod
      attachmentId: $attachmentId
    ) {
      success
      message
      hms {
        id
        hmsName
      }
    }
  }
`;

export const UPDATE_HMS_MUTATION = gql`
  mutation UpdateHms(
    $hmsId: Int!
    $hmsName: String
    $hmsType: Int
    $isActive: Boolean
    $hmsDisplayName: String
    $aboutHms: String
    $mobileNumber: String
    $timePeriod: Int
    $attachmentId: Int
  ) {
    updateHms(
      hmsId: $hmsId
      hmsName: $hmsName
      hmsType: $hmsType
      isActive: $isActive
      hmsDisplayName: $hmsDisplayName
      aboutHms: $aboutHms
      mobileNumber: $mobileNumber
      timePeriod: $timePeriod
      attachmentId: $attachmentId
    ) {
      success
      message
      hms {
        id
        hmsName
      }
    }
  }
`;

export const DELETE_HMS_MUTATION = gql`
  mutation DeleteHms($hmsId: Int!) {
    deleteHms(hmsId: $hmsId) {
      success
      message
    }
  }
`;
