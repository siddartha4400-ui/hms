import { gql } from '@apollo/client';

// Login Mutations
export const SIGNUP_MUTATION = gql`
  mutation Signup(
    $email: String!
    $password: String!
    $passwordConfirm: String!
    $mobileNumber: String!
    $firstName: String!
    $lastName: String
  ) {
    signup(
      email: $email
      password: $password
      passwordConfirm: $passwordConfirm
      mobileNumber: $mobileNumber
      firstName: $firstName
      lastName: $lastName
    ) {
      success
      message
      user
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login(
    $method: String!
    $email: String
    $password: String
    $mobileNumber: String
  ) {
    login(
      method: $method
      email: $email
      password: $password
      mobileNumber: $mobileNumber
    ) {
      success
      message
      token
      refreshToken
    }
  }
`;

export const VERIFY_LOGIN_OTP_MUTATION = gql`
  mutation VerifyLoginOTP(
    $identifier: String!
    $otp: String!
    $otpType: String!
  ) {
    verifyLoginOtp(
      identifier: $identifier
      otp: $otp
      otpType: $otpType
    ) {
      success
      message
      token
      refreshToken
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout($refreshToken: String!) {
    logout(refreshToken: $refreshToken) {
      success
      message
    }
  }
`;

export const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email) {
      success
      message
    }
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword(
    $token: String!
    $password: String!
    $passwordConfirm: String!
  ) {
    resetPassword(
      token: $token
      password: $password
      passwordConfirm: $passwordConfirm
    ) {
      success
      message
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile(
    $firstName: String
    $lastName: String
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
      user
    }
  }
`;

// Queries
export const GET_USER_PROFILE_QUERY = gql`
  query GetUserProfile {
    getUserProfile {
      id
      email
      username
      mobileNumber
      firstName
      lastName
      role
      addressLine1
      addressLine2
      city
      state
      postalCode
      country
      companyId
      profileId
      dob
      isVerified
      isActive
      createdAt
      updatedAt
    }
  }
`;
