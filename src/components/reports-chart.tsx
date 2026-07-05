
"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ReportsChartProps {
    total: number;
    underReview: number;
    pending: number;
    inProgress: number;
    resolved: number;
}

export function ReportsChart({ total, underReview, pending, inProgress, resolved }: ReportsChartProps) {
    const [mounted, setMounted] = React.useState(false);
    
    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Se o total for 0, exibimos um gráfico neutro conforme solicitado
    const isChartEmpty = total === 0;
    
    const chartData = React.useMemo(() => {
        if (isChartEmpty) {
            // Usando uma cor suave e visível para o estado vazio
            return [{ status: "Sem Dados", count: 1, fill: "var(--empty-chart)" }];
        }
        return [
            { status: "Em Análise", count: underReview, fill: "#94a3b8" }, // Slate-400
            { status: "Pendentes", count: pending, fill: "#f59e0b" },    // Amber-500
            { status: "Em Andamento", count: inProgress, fill: "hsl(var(--primary))" },
            { status: "Resolvidos", count: resolved, fill: "#10b981" },   // Emerald-500
        ].filter(item => item.count > 0);
    }, [underReview, pending, inProgress, resolved, isChartEmpty]);

    const chartConfig = {
        count: { label: "Quantidade" },
        "Em Análise": { label: "Em Análise", color: "#94a3b8" },
        Pendentes: { label: "Pendentes", color: "#f59e0b" },
        "Em Andamento": { label: "Em Andamento", color: "hsl(var(--primary))" },
        Resolvidos: { label: "Resolvidos", color: "#10b981" },
        "Sem Dados": { label: "Sem Dados", color: "var(--empty-chart)" }
    }

    return (
        <div className="relative w-full aspect-square max-w-[200px] mx-auto">
            <style dangerouslySetInnerHTML={{ __html: `
                :root { --empty-chart: #e2e8f0; }
                .dark { --empty-chart: #334155; }
            `}} />
            <ChartContainer config={chartConfig} className="w-full h-full">
                <PieChart>
                    {!isChartEmpty && (
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                    )}
                    <Pie
                        data={chartData}
                        dataKey="count"
                        nameKey="status"
                        innerRadius={60}
                        outerRadius={80}
                        strokeWidth={4}
                        stroke="hsl(var(--card))"
                        animationBegin={0}
                        animationDuration={1500}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground text-3xl font-bold"
                    >
                        {mounted ? total.toLocaleString() : "..."}
                    </text>
                    <text
                        x="50%"
                        y="50%"
                        dy="1.5em"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-muted-foreground text-[10px] font-black uppercase tracking-widest"
                    >
                        Total
                    </text>
                </PieChart>
            </ChartContainer>
        </div>
    )
}
