
import { Suspense } from 'react';
import { AuthActionClient } from './client';
import { Loader2 } from 'lucide-react';

export default function AuthActionPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
        <AuthActionClient />
      </Suspense>
    </div>
  );
}
