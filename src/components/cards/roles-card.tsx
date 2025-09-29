"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { roleService, type Role } from "@/services/user-service";
import RolesModal from "@/components/modals/roles-modal";
import { EntitiesCardSkeleton } from "@/components/skeletons/entities-card-skeleton";

export default function RolesCard() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        try {
            setIsLoading(true);
            const data = await roleService.getAllRoles();
            setRoles(data);
        } catch (error) {
            console.error("Error loading roles:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewAll = () => {
        setIsModalOpen(true);
    };

    const handleRolesChange = () => {
        loadRoles();
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
                            Roles
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
                        {roles.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-sm text-gray-500 dark:text-gray-400">No roles found</div>
                            </div>
                        ) : (
                            roles.slice(0, 8).map((role) => (
                                <div key={role.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {role.name}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                        {role.id}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>

                    {roles.length > 8 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                +{roles.length - 8} more roles
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <RolesModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                onRolesChange={handleRolesChange}
            />
        </>
    );
}
