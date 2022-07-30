import axios from 'axios';
import { Routes } from './routes';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queries/client';

axios.defaults.baseURL = 'http://192.168.29.42:4080/c';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes />
    </QueryClientProvider>
  );
}
