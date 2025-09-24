import React, { useState } from "react";
import { ProgressBar } from "./progress-bar";
import { capitalizeAllWords, capitalizeFirstLetter, cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowRight } from "lucide-react";
import CategorySelectionModal from "@/components/inspection-components/CategorySelectionModal";
import { useInspectionForm } from "@/hooks/useInspectionForm";
import { Button } from "./button";
import { useRouter } from "next/navigation";

interface InspectionSectionHeaderProps {
    title: string;
    progress: number;
    className?: string;
    categories?: { id: string; name: string }[];
    activeCategory?: string;
    onCategoryChange?: (categoryId: string) => void;
}

export function InspectionSectionHeader({
    title,
    progress,
    className,
    categories = [],

}: InspectionSectionHeaderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isMobile = useIsMobile();
    const { currentProject, changeActiveCategory } = useInspectionForm();
    const router = useRouter();


    const handleCategoryClick = (categoryId: string) => {
        if (currentProject?.activeCategory !== categoryId) {
            changeActiveCategory(categoryId);
        }
        setIsModalOpen(false);
    };

    return (
        <div className={cn(`flex-1 flex lg:items-center items-start lg:justify-between mb-3 flex-col lg:flex-row`, className)}>
            <div className="flex flex-col lg:flex-row items-center justify-between w-full ">
                {!isMobile && <h1 className="text-2xl font-bold">{title}</h1>}
                {isMobile && <div className="flex flex-col justify-center items-center "><h1 className="text-2xl font-bold">{currentProject?.clientInfo?.propertyAddress}</h1>
                    <p className="text-gray-500 w-fit">{capitalizeAllWords(currentProject?.inspectionType || '')}</p></div>}
                <ProgressBar progress={progress} className="lg:w-5/12 w-full" />
                {isMobile && <div className="w-full flex flex-col sm:flex-row sm:items-center items-start justify-between mt-4">
                    <h2 className="text-2xl font-bold ml-2">{capitalizeFirstLetter(currentProject?.activeCategory || "property")} Inspection</h2>
                    <div className="flex sm:items-center mt-2 sm:mt-0">
                        <button
                            className="bg-transparent text-orange-500 text-sm hover:bg-orange-50 hover:text-orange-600 rounded-md px-4 py-2 flex items-center cursor-pointer mr-2"
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <p className="font-medium">Change Category</p>
                            <ArrowRight className="ml-2 h-3 w-3 translate-y-0.5" />
                        </button>
                        <Button type="button" size="sm" onClick={() => router.push(`/report/${currentProject?.id}`)}>
                            View Report
                        </Button>
                    </div>
                </div>}
            </div>

            <CategorySelectionModal
                categories={categories}
                activeCategory={currentProject?.activeCategory || "property"}
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                onCategoryClick={handleCategoryClick}
            />

        </div>
    );
}