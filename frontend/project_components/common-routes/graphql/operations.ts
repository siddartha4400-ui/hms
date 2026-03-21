import { gql } from '@apollo/client';

export const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email) {
      success
      message
    }
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $password: String!, $passwordConfirm: String!) {
    resetPassword(token: $token, password: $password, passwordConfirm: $passwordConfirm) {
      success
      message
    }
  }
`;

export const GET_USER_PROFILE_QUERY = gql`
  query GetUserProfile {
    getUserProfile {
      id
      email
      username
      firstName
      lastName
      mobileNumber
      addressLine1
      addressLine2
      city
      state
      postalCode
      country
      companyId
      profileId
      profilePictureUrl
      dob
      isVerified
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile(
    $firstName: String
    $lastName: String
    $profileId: Int
    $addressLine1: String
    $addressLine2: String
    $city: String
    $state: String
    $postalCode: String
    $country: String
    $dob: String
  ) {
    updateProfile(
      firstName: $firstName
      lastName: $lastName
      profileId: $profileId
      addressLine1: $addressLine1
      addressLine2: $addressLine2
      city: $city
      state: $state
      postalCode: $postalCode
      country: $country
      dob: $dob
    ) {
      success
      message
    }
  }
`;
