import { gql } from "@apollo/client";

export const ALL_TENANTS = gql`
  query AllTenants {
    allTenants {
      id
      name
      subdomain
      domain
      isActive
      onTrial
      createdAt
    }
  }
`;

export const CREATE_TENANT = gql`
  mutation CreateTenant(
    $name: String!
    $subdomain: String!
    $adminUsername: String!
    $adminPassword: String!
    $adminEmail: String
  ) {
    createTenant(
      name: $name
      subdomain: $subdomain
      adminUsername: $adminUsername
      adminPassword: $adminPassword
      adminEmail: $adminEmail
    ) {
      tenant {
        id
        name
        subdomain
        domain
      }
      domain
      message
    }
  }
`;
