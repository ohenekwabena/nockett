import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TicketsPageSkeleton() {
    return (
        <div className="pr-6 mt-10">
            {/* Header Section Skeleton */}
            <div className="mb-8">
                <Skeleton className="h-16 w-64 mb-2 bg-gray-200 dark:bg-gray-700" />
                <Skeleton className="h-5 w-48 bg-gray-200 dark:bg-gray-600" />
            </div>

            {/* Tickets Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {Array.from({ length: 9 }).map((_, index) => (
                    <Card key={index} className="bg-white dark:bg-gray-800 rounded-2xl border border-transparent drop-shadow-xl">
                        <CardHeader className="flex-row items-start justify-between">
                            <div className="flex flex-col space-y-2">
                                <Skeleton className="h-4 w-20 bg-gray-200 dark:bg-gray-600" />
                                <Skeleton className="h-6 w-48 bg-gray-200 dark:bg-gray-600" />
                            </div>
                            <Skeleton className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 mb-4">
                                <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-600" />
                                <Skeleton className="h-4 w-4/5 bg-gray-200 dark:bg-gray-600" />
                                <Skeleton className="h-4 w-3/5 bg-gray-200 dark:bg-gray-600" />
                            </div>
                        </CardContent>
                        <div className="px-6 pb-6 flex items-center justify-between">
                            <Skeleton className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600" />
                            <Skeleton className="h-5 w-5 bg-gray-200 dark:bg-gray-600" />
                        </div>
                    </Card>
                ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="flex justify-center items-center gap-2">
                <Skeleton className="h-10 w-20 rounded-lg bg-gray-200 dark:bg-gray-600" />
                {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-600" />
                ))}
                <Skeleton className="h-10 w-16 rounded-lg bg-gray-200 dark:bg-gray-600" />
            </div>
        </div>
    );
}
