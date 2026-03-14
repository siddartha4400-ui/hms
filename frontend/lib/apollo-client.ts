import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import Cookies from "js-cookie";

function getGraphQLUri() {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:8000/graphql/";
  }
  // Use the same hostname as the browser so tenant middleware picks up the subdomain
  const hostname = window.location.hostname;
  return `http://${hostname}:8000/graphql/`;
}

const httpLink = createHttpLink({
  uri: getGraphQLUri(),
});

const authLink = setContext((_, { headers }) => {
  const token = Cookies.get("token");
  return {
    headers: {
      ...headers,
      authorization: token ? `JWT ${token}` : "",
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
