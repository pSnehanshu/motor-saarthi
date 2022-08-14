import { QueryClientProvider } from 'react-query';
import { queryClient } from './queries/client';
import { Routes } from './routes';
import { trpc, trpcClient } from './utils/trpc';

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Routes />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
