"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  BarChart3,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/admin-supabase";



export default function KPICards() {
  const [values, setValues] = useState({toolCount: 0, stackCount: 0,userCount: 0, categoryCount: 0});

  useEffect(()=>{
     getAnalyticsData();
  }, []);
  async function getAnalyticsData(){
    const { count: toolsCount } = await supabase
  .from("products")
  .select("*", { count: "exact", head: true });
  const { count: stacksCount } = await supabase
  .from("stacks")
  .select("*", { count: "exact", head: true });
   const { count: usersCount } = await supabase
  .from("users")
  .select("*", { count: "exact", head: true });
   const { count: categoriesCount } = await supabase
  .from("categories")
  .select("*", { count: "exact", head: true });
  setValues({toolCount: toolsCount, stackCount: stacksCount, userCount: usersCount, categoryCount: categoriesCount});
  return ;
  }

  const kpiCards = [
  {
    title: "Total AI Tools",
    value: values.toolCount,
    change: "+12.5%",
    trend: "up",
    description: "New tools added this month",
    subtitle: "Tools discovered for the last 6 months",
    icon: Search,
  },
  {
    title: "Active Users",
    value:values.userCount,
    change: "+8.2%",
    trend: "up",
    description: "Growing user base",
    subtitle: "Users exploring AI tools",
    icon: Users,
  },
  {
    title: "AI Stacks",
    value: values.stackCount,
    change: "+15.0%",
    trend: "up",
    description: "Curated collections created",
    subtitle: "Stacks exceed targets",
    icon: Package,
  },
  {
    title: "Tool Categories",
    value: values.categoryCount,
    change: "+3.6%",
    trend: "up",
    description: "Categories expanded",
    subtitle: "Better organization achieved",
    icon: BarChart3,
  },
];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpiCards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {card.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span
                className={
                  card.trend === "up" ? "text-green-500" : "text-red-500"
                }
              >
                {card.change}
              </span>
              <span>{card.description}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
