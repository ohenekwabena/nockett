"use client";

import { useState, useEffect } from "react";
import TicketCard from '@/components/ui/new-ticket-card';
import { StatCard } from "@/components/cards/stat-card";
import { ticketService } from "@/services/ticket-service";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";

interface DashboardStats {
    total: number;
    open: number;
    inProgress: number;
    closed: number;
    highPriority: number;
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        total: 0,
        open: 0,
        inProgress: 0,
        closed: 0,
        highPriority: 0
    });
    const [recentTickets, setRecentTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();

        // Listen for ticket updates from anywhere in the app
        const handleTicketUpdated = () => {
            loadDashboardData();
        };

        window.addEventListener('ticketCreated', handleTicketUpdated);

        return () => {
            window.removeEventListener('ticketCreated', handleTicketUpdated);
        };
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            const [statsResult, ticketsResult] = await Promise.all([
                ticketService.getDashboardStats(),
                ticketService.getRecentTicketsWithDetails(5)
            ]);

            if (statsResult.error) {
                setError(statsResult.error.message);
            } else if (statsResult.data) {
                setStats(statsResult.data);
            }

            if (ticketsResult.error) {
                console.error("Error loading recent tickets:", ticketsResult.error);
            } else {
                setRecentTickets(ticketsResult.data || []);
            }
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const statsData = [
        {
            title: "Total Tickets",
            value: stats.total,
            iconType: "ticket" as const,
            lightColor: "#3B82F6",
            darkColor: "#60A5FA"
        },
        {
            title: "Open Tickets",
            value: stats.open,
            iconType: "unlock" as const, // Changed from "open" to "unlock"
            lightColor: "#10B981",
            darkColor: "#34D399"
        },
        {
            title: "In Progress",
            value: stats.inProgress,
            iconType: "activity" as const, // Changed from "progress" to "activity"
            lightColor: "#F59E0B",
            darkColor: "#FBBF24"
        },
        {
            title: "High Priority",
            value: stats.highPriority,
            iconType: "lock" as const, // Changed from "priority" to "lock"
            lightColor: "#EF4444",
            darkColor: "#F87171"
        }
    ];

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return (
            <div className="pr-6 mt-10 flex justify-center items-center h-64">
                <div className="text-red-600 dark:text-red-400">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="pr-6 mt-10">
            <h1 className="font-bold mb-4 text-gray-900 dark:text-gray-100" style={{
                fontSize: "clamp(2rem, 9.3vw - 2.1rem, 3.75rem)"
            }}>
                Dashboard
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {statsData.map((stat, index) => (
                    <StatCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        iconType={stat.iconType}
                        lightColor={stat.lightColor}
                        darkColor={stat.darkColor}
                    />
                ))}
            </div>

            <h1 className="font-bold mb-4 mt-16 text-gray-900 dark:text-gray-100"
                style={{
                    fontSize: "clamp(1.5rem, 2.7vw + 0.3rem, 2rem)"
                }}
            >
                Recent tickets
            </h1>

            {recentTickets.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No tickets found</p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm">
                        Click the "Add New" button in the top right to create your first ticket
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                    {recentTickets.map((ticket) => (
                        <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            onTicketUpdated={loadDashboardData}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}