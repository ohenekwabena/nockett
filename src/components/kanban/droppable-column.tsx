import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { DraggableTicket } from './draggable-ticket';
import { Badge } from '../ui/badge';
import { STATUS_COLORS } from '@/utils/constants';

interface DroppableColumnProps {
    id: string;
    title: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tickets: any[];
    onTicketUpdated: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateTicketWithOptimism?: (ticketId: string, updates: any, serverUpdates: any) => Promise<void>;
    deleteTicketWithOptimism?: (ticketId: string) => Promise<void>;
}

export function DroppableColumn({
    id,
    title,
    tickets,
    onTicketUpdated,
    updateTicketWithOptimism,
    deleteTicketWithOptimism
}: DroppableColumnProps) {
    const { isOver, setNodeRef } = useDroppable({
        id: id,
    });

    const columnStyle = {
        backgroundColor: isOver ? 'rgba(59, 130, 246, 0.1)' : undefined,
        borderColor: isOver ? 'rgb(59, 130, 246)' : undefined,
    };

    const getStatusColor = (statusId: string) => {
        return STATUS_COLORS[statusId as keyof typeof STATUS_COLORS] || STATUS_COLORS.DEFAULT;
    };

    return (
        <div className="flex flex-col h-full">
            <h3 className=" text-sm font-semibold mb-4 text-gray-800/40 dark:text-gray-200/60 ml-2">
                {title} <Badge
                    variant="secondary"
                    className="text-white"
                    style={{ backgroundColor: getStatusColor(id) }}
                >
                    {tickets.length}
                </Badge>
            </h3>
            <div
                ref={setNodeRef}
                style={columnStyle}
                className="flex-1 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors min-h-[200px]"
            >
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <DraggableTicket
                            key={ticket.id}
                            ticket={ticket}
                            onTicketUpdated={onTicketUpdated}
                            updateTicketWithOptimism={updateTicketWithOptimism}
                            deleteTicketWithOptimism={deleteTicketWithOptimism}
                        />
                    ))}
                    {tickets.length === 0 && (
                        <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                            Drop tickets here
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
