import { DUMMY_TICKETS, DUMMY_STATS } from "@/utils/constants";
import TicketCard from '@/components/ui/new-ticket-card'
import { StatCard } from "@/components/stat-card";

export default function Dashboard() {
    return (
        <div className="pr-6 mt-10">
            <h1 className="font-bold mb-4 text-gray-900 dark:text-gray-100" style={{
                fontSize: "clamp(1.5rem, 12vw - 3.7rem, 3.75rem)"
            }}>Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {DUMMY_STATS.map((stat, index) => (
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
            >Recent tickets</h1>
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {DUMMY_TICKETS.slice(0, 2).map((ticket) => (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    <TicketCard key={ticket.id} ticket={ticket as any} />
                ))}
            </div>
        </div>
    );
}

