import { SignupForm } from "@/components/signup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white border-gray-200">
            <CardHeader>
                <CardTitle className="text-gray-900">Criar Conta</CardTitle>
                <CardDescription className="text-gray-500">Preencha os campos abaixo para criar sua conta.</CardDescription>
            </CardHeader>
            <CardContent>
                <SignupForm />
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
