import { gql } from "@apollo/client";

export const ALL_TENANTS = gql`
  query AllTenants {
    allTenants {
      id
      name
      subdomain
      propertyType
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
    $propertyType: String!
    $adminUsername: String!
    $adminPassword: String!
    $adminEmail: String
  ) {
    createTenant(
      name: $name
      propertyType: $propertyType
      adminUsername: $adminUsername
      adminPassword: $adminPassword
      adminEmail: $adminEmail
    ) {
      tenant {
        id
        name
        subdomain
        propertyType
        domain
      }
      domain
      message
    }
  }
`;
