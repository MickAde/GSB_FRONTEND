import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
        <FileQuestion className="h-10 w-10 text-primary" />
      </div>
      <div>
        <h1 className="text-4xl font-black text-foreground">404</h1>
        <p className="mt-2 text-lg font-semibold text-foreground">Page not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link href="/">
        <Button className="gradient-primary rounded-xl font-bold text-white shadow-md shadow-primary/25 hover:opacity-90">
          Go home
        </Button>
      </Link>
    </main>
  );
}
