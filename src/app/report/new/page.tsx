
import { ReportForm } from "@/components/report-form";

export default function NewReportPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 sm:p-6 md:p-8 flex items-start justify-center">
        <ReportForm />
      </main>
    </div>
  );
}
