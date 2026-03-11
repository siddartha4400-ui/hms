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

const client = new ApolloClient({
  link: new HttpLink({
    uri: process.env.NEXT_PUBLIC_API_URL, // e.g., http://localhost:8000/graphql/
  }),
  cache: new InMemoryCache(),
});

export default client;