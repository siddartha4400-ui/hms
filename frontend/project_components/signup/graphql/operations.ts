import { gql } from '@apollo/client';

export const SIGNUP_MUTATION = gql`
  mutation SignUp($email: String!, $password: String!, $passwordConfirm: String!, $mobileNumber: String!, $firstName: String!, $lastName: String!) {
    signup(email: $email, password: $password, passwordConfirm: $passwordConfirm, mobileNumber: $mobileNumber, firstName: $firstName, lastName: $lastName) {
      success
      message
      user
    }
  }
`;
