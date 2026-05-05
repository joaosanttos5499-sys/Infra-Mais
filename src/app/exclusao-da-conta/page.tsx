import { ExclusaoContaClient } from "./client";

export default function ExclusaoContaPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <main className="flex-1 py-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="w-full max-w-md">
          <ExclusaoContaClient />
        </div>
      </main>
    </div>
  );
}