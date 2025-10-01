"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { departmentService, type Department } from "@/services/user-service";
import DepartmentsModal from "@/components/modals/departments-modal";
import { EntitiesCardSkeleton } from "@/components/skeletons/entities-card-skeleton";

export default function DepartmentsCard() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadDepartments();
    }, []);

    const loadDepartments = async () => {
        try {
            setIsLoading(true);
            const data = await departmentService.getAllDepartments();
            setDepartments(data);
        } catch (error) {
            console.error("Error loading departments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewAll = () => {
        setIsModalOpen(true);
    };

    const handleDepartmentsChange = () => {
        loadDepartments();
    };

    if (isLoading) {
        return <EntitiesCardSkeleton />;
    }

    return (
        <>
            <Card className="bg-white dark:bg-gray-800 shadow-md border-none min-w-[300px]">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Departments
                        </CardTitle>
                        <button
                            onClick={handleViewAll}
                            className="flex items-center gap-2 bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer rounded-xl"
                        >
                            <Eye size={16} />
                            View All
                        </button>
                    </div>
                </CardHeader>

                <CardContent className="pt-0">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {departments.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-sm text-gray-500 dark:text-gray-400">No departments found</div>
                            </div>
                        ) : (
                            departments.slice(0, 8).map((department) => (
                                <div key={department.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {department.name}
                                    </span>
                                    <Badge variant="secondary" className="text-xs text-gray-600/40 dark:text-gray-300/60 ">
                                        {department.id}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>

                    {departments.length > 8 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                +{departments.length - 8} more departments
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <DepartmentsModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                onDepartmentsChange={handleDepartmentsChange}
            />
        </>
    );
}
