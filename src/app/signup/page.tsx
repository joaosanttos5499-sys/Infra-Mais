import { SignupForm } from "@/components/signup-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md bg-card border-border shadow-xl">
            <CardHeader>
                <CardTitle className="text-foreground">Criar Conta</CardTitle>
            </CardHeader>
            <CardContent>
                <SignupForm />
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
