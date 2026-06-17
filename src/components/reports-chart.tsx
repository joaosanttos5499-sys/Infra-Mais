
"use client"

import * as React from "react"
import { Pie, PieChart, Sector } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ReportsChartProps {
    total: number;
    resolved: number;
    inProgress: number;
}

export function ReportsChart({ total, resolved, inProgress }: ReportsChartProps) {
    const [mounted, setMounted] = React.useState(false);
    
    React.useEffect(() => {
        setMounted(true);
    }, []);

    const pending = total - resolved - inProgress;
    const chartData = React.useMemo(() => [
        { status: "Pendentes", count: pending, fill: "hsl(var(--chart-1))" },
        { status: "Em Andamento", count: inProgress, fill: "hsl(var(--chart-3))" },
        { status: "Resolvidos", count: resolved, fill: "hsl(var(--chart-2))" },
    ].filter(item => item.count > 0), [pending, inProgress, resolved]);

    const chartConfig = {
        count: {
            label: "Count",
        },
        Pendentes: {
            label: "Pendentes",
            color: "hsl(var(--chart-1))",
        },
        "Em Andamento": {
            label: "Em Andamento",
            color: "hsl(var(--chart-3))",
        },
        Resolvidos: {
            label: "Resolvidos",
            color: "hsl(var(--chart-2))",
        },
    }

    const totalCount = React.useMemo(() => {
        return chartData.reduce((acc, curr) => acc + curr.count, 0)
    }, [chartData]);
    
    const activeIndex = React.useMemo(() => {
        return chartData.findIndex((item) => item.status === "Resolvidos");
    }, [chartData]);


    if (total === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
                Ainda não há dados para exibir.
            </div>
        )
    }

    return (
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-48"
        >
        <PieChart>
            <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
            />
             <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                innerRadius={60}
                strokeWidth={5}
                activeIndex={activeIndex}
                activeShape={({ outerRadius = 0, ...props }) => (
                    <g>
                        <Sector {...props} outerRadius={outerRadius + 8} />
                        <Sector {...props} outerRadius={outerRadius} innerRadius={outerRadius-8} />
                    </g>
                )}
            >
            </Pie>
             <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-3xl font-bold"
            >
                {mounted ? totalCount.toLocaleString() : "..."}
            </text>
            <text
                x="50%"
                y="50%"
                dy="1.5em"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-sm"
            >
                Total
            </text>
        </PieChart>
        </ChartContainer>
         <div className="flex flex-col gap-2 text-sm">
            {chartData.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span>{item.status}:</span>
                    <span className="font-semibold">{mounted ? item.count.toLocaleString() : "..."}</span>
                </div>
            ))}
        </div>
      </div>
  )
}
