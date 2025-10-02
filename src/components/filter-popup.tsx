import { useState, useEffect } from "react";
import { IconlyFilter } from "./icons";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";
import { ticketService, type TicketCategory, type TicketPriority } from "@/services/ticket-service";
import { STATUSES, STATUS_COLORS, PRIORITY_COLORS } from "@/utils/constants";
import { capitalizeString } from "@/utils/functions";

interface FilterPopupProps {
    onFiltersChange: (filters: {
        statuses: string[];
        categories: string[];
        priorities: string[];
    }) => void;
    initialFilters?: {
        statuses: string[];
        categories: string[];
        priorities: string[];
    };
}

export default function FilterPopup({ onFiltersChange, initialFilters }: FilterPopupProps) {
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(initialFilters?.statuses || []);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters?.categories || []);
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>(initialFilters?.priorities || []);
    const [categories, setCategories] = useState<TicketCategory[]>([]);
    const [priorities, setPriorities] = useState<TicketPriority[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        loadFilterData();
    }, []);

    const loadFilterData = async () => {
        try {
            const [categoriesRes, prioritiesRes] = await Promise.all([
                ticketService.getTicketCategories(),
                ticketService.getTicketPriorities()
            ]);

            if (categoriesRes.data) setCategories(categoriesRes.data);
            if (prioritiesRes.data) setPriorities(prioritiesRes.data);
        } catch (err) {
            console.error("Error loading filter data:", err);
        }
    };

    const handleStatusChange = (status: string, checked: boolean) => {
        const newStatuses = checked
            ? [...selectedStatuses, status]
            : selectedStatuses.filter(s => s !== status);
        setSelectedStatuses(newStatuses);
        onFiltersChange({
            statuses: newStatuses,
            categories: selectedCategories,
            priorities: selectedPriorities
        });
    };

    const handleCategoryChange = (category: string, checked: boolean) => {
        const newCategories = checked
            ? [...selectedCategories, category]
            : selectedCategories.filter(c => c !== category);
        setSelectedCategories(newCategories);
        onFiltersChange({
            statuses: selectedStatuses,
            categories: newCategories,
            priorities: selectedPriorities
        });
    };

    const handlePriorityChange = (priority: string, checked: boolean) => {
        const newPriorities = checked
            ? [...selectedPriorities, priority]
            : selectedPriorities.filter(p => p !== priority);
        setSelectedPriorities(newPriorities);
        onFiltersChange({
            statuses: selectedStatuses,
            categories: selectedCategories,
            priorities: newPriorities
        });
    };

    const clearAllFilters = () => {
        setSelectedStatuses([]);
        setSelectedCategories([]);
        setSelectedPriorities([]);
        onFiltersChange({
            statuses: [],
            categories: [],
            priorities: []
        });
    };

    const hasActiveFilters = selectedStatuses.length > 0 || selectedCategories.length > 0 || selectedPriorities.length > 0;
    const totalActiveFilters = selectedStatuses.length + selectedCategories.length + selectedPriorities.length;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={`relative flex items-center gap-2 px-3 py-2 h-auto border 
                        text-gray-700 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-100 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${hasActiveFilters ? 'ring-2 ring-blue-500 border-blue-500' : ''
                        }`}
                >
                    <IconlyFilter size={20} />
                    <span className="text-sm">Filter</span>
                    {hasActiveFilters && (
                        <Badge className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white">
                            {totalActiveFilters}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl mr-2">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Filter Tickets</h4>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAllFilters}
                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                                Clear all
                            </Button>
                        )}
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                            Status
                        </label>
                        <div className="space-y-2">
                            {STATUSES.map((status) => (
                                <div key={status} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`status-${status}`}
                                        checked={selectedStatuses.includes(status)}
                                        onCheckedChange={(checked) => handleStatusChange(status, checked as boolean)}
                                    />
                                    <label
                                        htmlFor={`status-${status}`}
                                        className="text-sm cursor-pointer flex items-center gap-2"
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }}
                                        />
                                        {capitalizeString(status)}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                            Category
                        </label>
                        <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-hide">
                            {categories.map((category) => (
                                <div key={category.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`category-${category.id}`}
                                        checked={selectedCategories.includes(category.name.toUpperCase())}
                                        onCheckedChange={(checked) => handleCategoryChange(category.name.toUpperCase(), checked as boolean)}
                                    />
                                    <label
                                        htmlFor={`category-${category.id}`}
                                        className="text-sm cursor-pointer"
                                    >
                                        {capitalizeString(category.name)}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Priority Filter */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                            Priority
                        </label>
                        <div className="space-y-2">
                            {priorities.map((priority) => (
                                <div key={priority.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`priority-${priority.id}`}
                                        checked={selectedPriorities.includes(priority.name.toUpperCase())}
                                        onCheckedChange={(checked) => handlePriorityChange(priority.name.toUpperCase(), checked as boolean)}
                                    />
                                    <label
                                        htmlFor={`priority-${priority.id}`}
                                        className="text-sm cursor-pointer flex items-center gap-2"
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: PRIORITY_COLORS[priority.name.toUpperCase() as keyof typeof PRIORITY_COLORS] }}
                                        />
                                        {capitalizeString(priority.name)}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Filters Summary */}
                    {hasActiveFilters && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Active filters:</div>
                            <div className="flex flex-wrap gap-1">
                                {selectedStatuses.map((status) => (
                                    <Badge
                                        key={`status-${status}`}
                                        variant="secondary"
                                        className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                                    >
                                        {capitalizeString(status)}
                                        <X
                                            className="w-3 h-3 ml-1 cursor-pointer hover:text-blue-600"
                                            onClick={() => handleStatusChange(status, false)}
                                        />
                                    </Badge>
                                ))}
                                {selectedCategories.map((category) => (
                                    <Badge
                                        key={`category-${category}`}
                                        variant="secondary"
                                        className="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
                                    >
                                        {capitalizeString(category)}
                                        <X
                                            className="w-3 h-3 ml-1 cursor-pointer hover:text-green-600"
                                            onClick={() => handleCategoryChange(category, false)}
                                        />
                                    </Badge>
                                ))}
                                {selectedPriorities.map((priority) => (
                                    <Badge
                                        key={`priority-${priority}`}
                                        variant="secondary"
                                        className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200"
                                    >
                                        {capitalizeString(priority)}
                                        <X
                                            className="w-3 h-3 ml-1 cursor-pointer hover:text-orange-600"
                                            onClick={() => handlePriorityChange(priority, false)}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}