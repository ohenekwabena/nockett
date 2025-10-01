import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface PersonEntityAvatarProps {
    name?: string;
    image?: string;
    type: "user" | "assignee";
    className?: string;
}

export default function PersonEntityAvatar({
    name,
    image,
    type,
    className = ""
}: PersonEntityAvatarProps) {
    const getBackgroundColor = () => {
        switch (type) {
            case "user":
                return "bg-green-500 dark:bg-green-400";
            case "assignee":
                return "bg-blue-500 dark:bg-blue-300";
            default:
                return "bg-gray-500 dark:bg-gray-400";
        }
    };

    const getInitials = (fullName?: string) => {
        if (!fullName) return type === "user" ? "U" : "A";
        return fullName.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const displayName = name || (type === "user" ? "Unknown User" : "Unassigned");

    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            <Avatar className={`w-10 h-10 ${getBackgroundColor()} text-gray-200 dark:text-gray-800 p-4`}>
                <AvatarImage src={image || ""} alt={`${type} Avatar`} />
                <AvatarFallback className="text-xs sm:text-sm font-medium">
                    {getInitials(name)}
                </AvatarFallback>
            </Avatar>
            <span className="font-semibold dark:text-gray-400 text-gray-600 text-sm ">
                {displayName}
            </span>
        </div>
    );
}