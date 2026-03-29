import { Suspense } from 'react';
import ResetPasswordOrganism from '@/project_components/common-routes/organisam/reset-password-organism';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm">Loading reset form...</div>}>
      <ResetPasswordOrganism />
    </Suspense>
  );
}
