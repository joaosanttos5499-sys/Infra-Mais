import { AuthReportClient } from "./client";

export default function AuthReportPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
            <AuthReportClient />
        </main>
    </div>
  )
}