"use client"
import React from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { useTheme } from "./ui/theme-provider";
import { ICON_MAP } from "@/utils/constants";

interface StatCardProps {
    title: string;
    value: number;
    iconType: keyof typeof ICON_MAP;
    lightColor?: string;
    darkColor?: string;
}

export function StatCard({ title, value, iconType, lightColor, darkColor }: StatCardProps) {
    const { theme } = useTheme();
    const iconColor = theme === 'dark' ? darkColor : lightColor;
    const Icon = ICON_MAP[iconType];

    return (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow rounded-4xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
                <div className="text-gray-600 dark:text-gray-400">
                    <Icon size={30} color={iconColor} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
            </CardContent>
        </Card>
    );
}