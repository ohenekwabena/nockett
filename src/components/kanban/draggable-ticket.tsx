import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import TicketCard from '../ui/new-ticket-card';

interface DraggableTicketProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ticket: any;
    onTicketUpdated: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateTicketWithOptimism?: (ticketId: string, updates: any, serverUpdates: any) => Promise<void>;
    deleteTicketWithOptimism?: (ticketId: string) => Promise<void>;
}

export function DraggableTicket({
    ticket,
    onTicketUpdated,
    updateTicketWithOptimism,
    deleteTicketWithOptimism
}: DraggableTicketProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: ticket.id,
        data: {
            type: 'ticket',
            ticket,
        },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`${isDragging ? 'opacity-50' : ''}`}
        >
            <TicketCard
                ticket={ticket}
                onTicketUpdated={onTicketUpdated}
                updateTicketWithOptimism={updateTicketWithOptimism}
                deleteTicketWithOptimism={deleteTicketWithOptimism}
            />
        </div>
    );
}
