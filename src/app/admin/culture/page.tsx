import { PageHeader } from '@/components/common/PageHeader';
import { CultureEditor } from '@/components/admin/CultureEditor';

export default function AdminCulturePage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="School Culture & Identity"
        description="Define your school's values, mission, and founder quotes."
      />
      <CultureEditor />
    </div>
  );
}
