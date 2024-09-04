"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Flights from "./flights/page";

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <Flights />
    </QueryClientProvider>
  );
}
