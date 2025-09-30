"use client";

import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { IconlySearch, IconlyCloseSquare } from "./icons";
import { useTheme } from "./ui/theme-provider";

interface SearchBarProps {
    onSearch: (searchTerm: string) => void;
    placeholder?: string;
    className?: string;
    isLoading?: boolean;
}

export default function SearchBar({
    onSearch,
    placeholder = "Search tickets...",
    className = "",
    isLoading = false
}: SearchBarProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const { theme } = useTheme();

    const handleSearch = () => {
        onSearch(searchTerm.trim());
    };

    const handleClear = () => {
        setSearchTerm("");
        onSearch("");
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="relative flex-1">
                <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={placeholder}
                    className="pl-10 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                />
                <IconlySearch
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                    color={theme === 'dark' ? "#ffffff" : "#000000"}
                    size={20}
                />
                {searchTerm && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                        disabled={isLoading}
                    >
                        <IconlyCloseSquare size={18} color={theme === 'dark' ? "#ffffff" : "#000000"} />
                    </button>
                )}
            </div>
            <Button
                onClick={handleSearch}
                disabled={isLoading || !searchTerm.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 disabled:opacity-50"
            >
                {isLoading ? "Searching..." : "Search"}
            </Button>
        </div>
    );
}
