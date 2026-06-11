import { PageHeader } from '@/components/common/PageHeader';
import { BulkImportTable } from '@/components/admin/BulkImportTable';

export default function BulkImportPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Bulk Student Import"
        description="Import multiple student accounts from a CSV file."
      />
      <BulkImportTable />
    </div>
  );
}
