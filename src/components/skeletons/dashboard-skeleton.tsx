import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
    return (
        <div className="pr-6 mt-10">
            {/* Header Skeleton */}
            <div className="mb-8">
                <Skeleton className="h-16 w-80 mb-4 bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-4xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-600" />
                            <Skeleton className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-10 w-16 bg-gray-200 dark:bg-gray-600" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Tickets Section Header */}
            <div className="mb-4 mt-16">
                <Skeleton className="h-8 w-48 bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Recent Tickets Skeleton */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                {Array.from({ length: 5 }).map((_, index) => (
                    <Card key={index} className="bg-white dark:bg-gray-800 rounded-2xl border border-transparent">
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
                                <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-600" />
                            </div>
                        </CardContent>
                        <div className="px-6 pb-6 flex items-center space-x-2">
                            <Skeleton className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600" />
                            <Skeleton className="h-5 w-5 ml-auto bg-gray-200 dark:bg-gray-600" />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
