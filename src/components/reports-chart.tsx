
"use client"

import * as React from "react"
import { Pie, PieChart, Sector } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

interface ReportsChartProps {
    total: number;
    resolved: number;
}

export function ReportsChart({ total, resolved }: ReportsChartProps) {
    const pending = total - resolved;
    const chartData = [
        { status: "Resolvidos", count: resolved, fill: "hsl(var(--chart-2))" },
        { status: "Pendentes", count: pending, fill: "hsl(var(--chart-1))" },
    ];

    const chartConfig = {
        count: {
            label: "Count",
        },
        Resolvidos: {
            label: "Resolvidos",
            color: "hsl(var(--chart-2))",
        },
        Pendentes: {
            label: "Pendentes",
            color: "hsl(var(--chart-1))",
        },
    }

    const totalCount = React.useMemo(() => {
        return chartData.reduce((acc, curr) => acc + curr.count, 0)
    }, [chartData]);


    if (total === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
                Ainda não há dados para exibir.
            </div>
        )
    }

    return (
      <div className="flex items-center">
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
                activeIndex={0}
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
                {totalCount.toLocaleString()}
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
                    <span className="font-semibold">{item.count}</span>
                </div>
            ))}
        </div>
      </div>
  )
}
