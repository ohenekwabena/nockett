import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
    value: React.ReactNode;
    description: string;
    className?: string;
    variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
}

const StatCard = ({
    value,
    description,
    className,
    variant = 'default',
}: StatCardProps) => {
    const getVariantClasses = () => {
        switch (variant) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'danger':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-amber-50 border-amber-200';
            case 'info':
                return 'bg-blue-50 border-blue-200';
            default:
                return 'bg-white border-gray-200';
        }
    };

    const getValueTextColor = () => {
        switch (variant) {
            case 'success':
                return 'text-green-600';
            case 'danger':
                return 'text-red-600';
            case 'warning':
                return 'text-amber-600';
            case 'info':
                return 'text-blue-600';
            default:
                return 'text-gray-900';
        }
    };

    return (
        <Card className={cn(`p-6 shadow-sm border ${getVariantClasses()}`, className)}>
            <div className="space-y-1">
                <p className="text-base font-bold text-black">
                    {description}
                </p>
                <p className={`text-5xl font-bold ${getValueTextColor()}`}>
                    {value}
                </p>
            </div>
        </Card>
    );
};

export default StatCard;