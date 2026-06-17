'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthBootstrap } from '@/components/layout/AuthBootstrap';

const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then((m) => m.ReactQueryDevtools),
  { ssr: false },
);

export function RootProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:            60 * 1000,
        gcTime:               5 * 60 * 1000,
        retry:                1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap>
          {children}
        </AuthBootstrap>
        <Toaster position="bottom-right" richColors closeButton />
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
