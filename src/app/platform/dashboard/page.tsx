'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { getPlatformSchools } from '@/lib/api/platform';
import { queryKeys } from '@/lib/query-keys';

export default function PlatformDashboardPage() {
  const { data } = useQuery({
    queryKey: queryKeys.platformSchools(),
    queryFn:  getPlatformSchools,
  });
  const total  = data?.length ?? 0;
  const active = data?.filter((s) => s.is_active).length ?? 0;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Platform Overview" description="Manage all schools on the GSB platform." />
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <span className="text-3xl font-bold text-primary">{total}</span>
            <span className="text-sm text-muted-foreground">Total Schools</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <span className="text-3xl font-bold text-green-600">{active}</span>
            <span className="text-sm text-muted-foreground">Active Schools</span>
          </CardContent>
        </Card>
      </div>
      <Link href="/platform/schools">
        <Button className="bg-primary hover:bg-primary/90">Manage Schools</Button>
      </Link>
    </div>
  );
}
