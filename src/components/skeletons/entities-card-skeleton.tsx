import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function EntitiesCardSkeleton() {
    return (
        <Card className="bg-white dark:bg-gray-800 shadow-md border-none min-w-[300px]">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24 bg-gray-200 dark:bg-gray-600" />
                    <Skeleton className="h-9 w-20 bg-gray-200 dark:bg-gray-600" />
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="space-y-2 max-h-64">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                            <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-600" />
                            <Skeleton className="h-5 w-8 bg-gray-200 dark:bg-gray-600" />
                        </div>
                    ))}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <Skeleton className="h-3 w-32 mx-auto bg-gray-200 dark:bg-gray-600" />
                </div>
            </CardContent>
        </Card>
    );
}
