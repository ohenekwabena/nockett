import { TicketCard } from "@/components/ticket-card";
import { SideNav } from "@/components/layout/side-nav";
import { DUMMY_TICKETS } from "@/utils/constants";

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <SideNav />

            <div className="ml-28 p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage and track your support tickets
                    </p>
                </div>

                <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Open Tickets
                            </h3>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {DUMMY_TICKETS.filter(t => t.status === 'OPEN').length}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                In Progress
                            </h3>
                            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                {DUMMY_TICKETS.filter(t => t.status === 'IN_PROGRESS').length}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                High Priority
                            </h3>
                            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                                {DUMMY_TICKETS.filter(t => t.priority === 'HIGH').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Recent Tickets
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {DUMMY_TICKETS.map((ticket) => (
                            <TicketCard key={ticket.id} ticket={ticket} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
