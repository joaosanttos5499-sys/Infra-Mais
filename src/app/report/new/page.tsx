import { ReportForm } from "@/components/report-form";

export default function NewReportPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 py-12 px-8 sm:px-12 md:px-20 flex items-start justify-center">
        <div className="w-full max-w-[1750px]">
          <ReportForm />
        </div>
      </main>
    </div>
  );
}
