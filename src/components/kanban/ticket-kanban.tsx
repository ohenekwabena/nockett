import React, { useState, useEffect } from 'react';
import {
    DndContext,
    DragEndEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import { DroppableColumn } from './droppable-column';

interface TicketKanbanProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tickets: any[];
    onTicketUpdated: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateTicketWithOptimism?: (ticketId: string, updates: any, serverUpdates: any) => Promise<void>;
    deleteTicketWithOptimism?: (ticketId: string) => Promise<void>;
}

const COLUMNS = [
    { id: 'OPEN', title: 'Open' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'CLOSED', title: 'Closed' },
];

export function TicketKanban({
    tickets,
    onTicketUpdated,
    updateTicketWithOptimism,
    deleteTicketWithOptimism
}: TicketKanbanProps) {
    // Local state to handle optimistic updates
    const [localTickets, setLocalTickets] = useState(tickets);

    // Configure sensors with activation constraints
    const mouseSensor = useSensor(MouseSensor, {
        // Require the mouse to move by 10 pixels before activating
        activationConstraint: {
            distance: 10,
        },
    });

    const touchSensor = useSensor(TouchSensor, {
        // Press delay of 250ms, with tolerance of 5px of movement
        activationConstraint: {
            delay: 250,
            tolerance: 5,
        },
    });

    const sensors = useSensors(mouseSensor, touchSensor);

    // Update local tickets when props change
    useEffect(() => {
        setLocalTickets(tickets);
    }, [tickets]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const ticketId = active.id as string;
        const newStatus = over.id as string;
        const ticket = active.data.current?.ticket;

        if (!ticket || ticket.status === newStatus) {
            return;
        }

        // Immediately update the local state for optimistic UI
        setLocalTickets(prevTickets =>
            prevTickets.map(t =>
                t.id === ticketId
                    ? { ...t, status: newStatus }
                    : t
            )
        );

        // Update ticket status optimistically if function is provided
        if (updateTicketWithOptimism) {
            try {
                await updateTicketWithOptimism(
                    ticketId,
                    { status: newStatus },
                    { status: newStatus }
                );
                // Don't call onTicketUpdated here as it might cause a reload that conflicts with our optimistic update
            } catch (error) {
                console.error('Failed to update ticket status:', error);
                // Revert the optimistic update on error
                setLocalTickets(prevTickets =>
                    prevTickets.map(t =>
                        t.id === ticketId
                            ? { ...t, status: ticket.status }
                            : t
                    )
                );
                // Optionally show error message to user
            }
        } else {
            // If no optimistic update function, trigger refresh
            onTicketUpdated();
        }
    };

    const getTicketsByStatus = (status: string) => {
        return localTickets.filter(ticket => ticket.status === status);
    };

    return (
        <div className="h-full overflow-x-auto">
            <DndContext
                onDragEnd={handleDragEnd}
                sensors={sensors}
            >
                <div className="grid grid-cols-3 gap-6 h-full min-w-[1000px] p-4 backdrop:blur-sm  rounded-2xl bg-gray-300/20 dark:bg-gray-800/50">
                    {COLUMNS.map((column) => (
                        <DroppableColumn
                            key={column.id}
                            id={column.id}
                            title={column.title}
                            tickets={getTicketsByStatus(column.id)}
                            onTicketUpdated={onTicketUpdated}
                            updateTicketWithOptimism={updateTicketWithOptimism}
                            deleteTicketWithOptimism={deleteTicketWithOptimism}
                        />
                    ))}
                </div>
            </DndContext>
        </div>
    );
}
