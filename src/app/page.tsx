import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main>
      <div className="relative h-[60vh] md:h-[70vh] w-full flex items-center justify-center text-center">
        <Image
          src="https://picsum.photos/seed/cityfix-hero/1920/1080"
          alt="A vibrant city street"
          fill
          priority
          className="object-cover"
          data-ai-hint="city street"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 px-4 text-white">
          <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tight drop-shadow-lg">
            CityFix
          </h1>
          <p className="mt-4 max-w-2xl text-lg md:text-xl text-neutral-200 drop-shadow-md">
            Help improve your city, one report at a time.
          </p>
        </div>
      </div>
      <div className="bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card p-8 rounded-lg shadow-lg border">
              <h2 className="text-3xl font-headline font-bold text-foreground">
                For Citizens
              </h2>
              <p className="mt-2 text-muted-foreground">
                Spotted a problem? A pothole, a broken streetlight, or uncollected trash? Report it in seconds.
              </p>
              <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
                <Link href="/report/new">
                  Report an Issue <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="bg-card p-8 rounded-lg shadow-lg border">
              <h2 className="text-3xl font-headline font-bold text-foreground">
                For City Employees
              </h2>
              <p className="mt-2 text-muted-foreground">
                Access the dashboard to view, manage, and resolve citizen reports efficiently.
              </p>
              <Button asChild size="lg" variant="secondary" className="mt-6 w-full sm:w-auto">
                <Link href="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
