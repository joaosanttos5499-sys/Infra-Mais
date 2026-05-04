import { ReportForm } from "@/components/report-form";

export default function NewReportPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 py-12 px-4 sm:px-6 md:px-8 flex items-start justify-center">
        <div className="w-full max-w-3xl">
          <ReportForm />
        </div>
      </main>
    </div>
  );
}
