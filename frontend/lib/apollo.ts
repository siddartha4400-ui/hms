// frontend/lib/apollo.ts
// import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// const client = new ApolloClient({
//   link: new HttpLink({
//     uri: process.env.NEXT_PUBLIC_API_URL, // http://localhost:8000/graphql/
//     credentials: 'include', // Important: send cookies cross-origin
//     headers: {
//       'X-CSRFToken': typeof window !== 'undefined' ? getCsrfToken() : '',
//     },
//   }),
//   cache: new InMemoryCache(),
// });

// // Helper to read csrftoken from cookie
// function getCsrfToken(): string {
//   const match = document.cookie.match(new RegExp('(^| )csrftoken=([^;]+)'));
//   return match ? match[2] : '';
// }

// export default client;

// frontend/lib/apollo.ts
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getValidAuthToken } from './auth-token';

const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_API_URL, // e.g., http://localhost:8000/graphql/
    // Send cookies (e.g. sessionid / csrftoken) if the server relies on them
    credentials: "include",
  });

const authLink = setContext((_, { headers }) => {
  const token = getValidAuthToken();
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `JWT ${token}` } : {}),
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;