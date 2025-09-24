import { cn } from "@/lib/utils";

interface ProgressBarProps {
    progress: number;
    className?: string;
    showPercentage?: boolean;
}

export function ProgressBar({
    progress,
    className,
    showPercentage = true
}: ProgressBarProps) {
    return (
        <div className={cn("w-full flex flex-col gap-2 align-center ", className)}>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden translate-y-2.5">
                <div
                    className="h-full bg-orange-500"
                    style={{ width: `${progress}%` }}
                />
            </div>
            {showPercentage && (
                <p className="text-right text-sm text-gray-500 mt-1 ml:auto">{Math.round(progress)}% complete</p>
            )}
        </div>
    );
}