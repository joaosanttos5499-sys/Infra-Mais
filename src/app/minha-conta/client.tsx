
'use client';

import { useUser } from "@/firebase";
import { type Report } from "@/lib/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getCategory } from "@/lib/categories";
import Image from "next/image";
import { StatusBadge } from "@/components/status-badge";
import { ReportTime } from "@/components/report-time";

function MyReportsList({ reports }: { reports: Report[] }) {
    if (reports.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">Você ainda não relatou nenhum problema.</h3>
                <p className="mt-2">Quando você relatar um problema, ele aparecerá aqui.</p>
                <Link href="/report/new">
                    <button className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md">Relatar um Problema</button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reports.map((report) => {
                const category = getCategory(report.category);
                const problem = category?.problems.find(p => p.value === report.problem);
                return (
                    <Link href={`/dashboard#report-${report.id}`} key={report.id} className="block group">
                        <Card className="overflow-hidden flex flex-col sm:flex-row h-full transition-all group-hover:shadow-lg group-hover:-translate-y-1">
                            <div className="relative aspect-video sm:aspect-square sm:w-48 flex-shrink-0">
                                <Image
                                    src={report.photoUrl}
                                    alt={report.description}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 100vw, 192px"
                                />
                                <div className="absolute top-2 right-2">
                                    <StatusBadge status={report.status} />
                                </div>
                            </div>
                            <div className="flex flex-col flex-grow">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {category?.icon && <category.icon className="h-5 w-5" style={{ color: category.color }} />}
                                        <span>{category?.label || report.category}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow flex flex-col">
                                    <div className="flex-grow">
                                        <p className="font-semibold text-sm line-clamp-1">{problem?.label || report.problem}</p>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {report.location}
                                        </p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                        <ReportTime date={report.createdAt} />
                                    </p>
                                </CardContent>
                            </div>
                        </Card>
                    </Link>
                )
            })}
        </div>
    )
}


export function MinhaContaClient({ allReports }: { allReports: Report[] }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const [userReports, setUserReports] = useState<Report[]>([]);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        } else if (user) {
            const filteredReports = allReports.filter(report => report.userId === user.uid);
            setUserReports(filteredReports);
        }
    }, [user, isUserLoading, allReports, router]);


    if (isUserLoading || !user) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Verificando autenticação...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Meus Relatórios</CardTitle>
                </CardHeader>
                <CardContent>
                    <MyReportsList reports={userReports} />
                </CardContent>
            </Card>
        </div>
    )
}
