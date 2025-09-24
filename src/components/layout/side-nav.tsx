"use client";
import { useRouter } from "next/navigation";
import { IconlyChart } from "../icons/chart";
import { IconlyLogout } from "../icons/logout";
import { IconlySetting } from "../icons/settings";
import { IconlyTicket } from "../icons/ticket";

export function SideNav() {

    const router = useRouter();
    const handlePageRoute = (path: string) => {
        router.push(path);
    }

    return <div className="min-w-10 w-15 h-[80vh] bg-white dark:bg-gray-800 px-2 py-4 rounded-2xl fixed left-4 top-1/2 -translate-y-1/2 flex flex-col justify-between gap-6">
        <div className="flex justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 cursor-pointer transition-all duration-200 hover:scale-110"
            onClick={handlePageRoute.bind(null, '/dashboard')}
        >
            <IconlyChart color="currentColor" />
        </div>
        <div className="flex justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 cursor-pointer transition-all duration-200 hover:scale-110"
            onClick={handlePageRoute.bind(null, '/tickets')}

        >
            <IconlyTicket color="currentColor" />
        </div>
        <div className="flex justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 cursor-pointer transition-all duration-200 hover:scale-110"
            onClick={handlePageRoute.bind(null, '/settings')}

        >
            <IconlySetting color="currentColor" />
        </div>
        <div className="mt-auto flex justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 cursor-pointer transition-all duration-200 hover:scale-110"
        >
            <IconlyLogout color="currentColor" />
        </div>
    </div>;
}