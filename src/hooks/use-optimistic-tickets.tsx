import { useState, useCallback } from 'react';
import { ticketService, type Ticket } from '@/services/ticket-service';

export interface OptimisticTicket extends Ticket {
    // Add fields for joined data
    ticket_categories?: { id: number; name: string }[];
    ticket_priorities?: { id: number; name: string }[];
    assignee?: { id: number; name: string }[];
    users?: { id: string; name: string; email: string }[];
}

export function useOptimisticTickets() {
    const [tickets, setTickets] = useState<OptimisticTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadTickets = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { data, error } = await ticketService.getTicketsWithDetails();
            if (error) {
                setError(error.message);
            } else {
                setTickets(data || []);
            }
        } catch (err) {
            setError('Failed to load tickets');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const optimisticUpdateTicket = useCallback((ticketId: string, updates: Partial<OptimisticTicket>) => {
        setTickets(prev => prev.map(ticket =>
            ticket.id === ticketId
                ? { ...ticket, ...updates, updated_at: new Date().toISOString() }
                : ticket
        ));
    }, []);

    const optimisticAddTicket = useCallback((newTicket: OptimisticTicket) => {
        setTickets(prev => [newTicket, ...prev]);
    }, []);

    const optimisticRemoveTicket = useCallback((ticketId: string) => {
        setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
    }, []);

    const updateTicketWithOptimism = useCallback(async (
        ticketId: string,
        updates: Partial<OptimisticTicket>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serverUpdates: any
    ) => {
        // Apply optimistic update immediately
        optimisticUpdateTicket(ticketId, updates);

        try {
            // Perform server update
            const { error } = await ticketService.updateTicket(ticketId, serverUpdates);

            if (error) {
                // Revert optimistic update on error
                await loadTickets();
                throw error;
            }
        } catch (err) {
            // Revert optimistic update on error
            await loadTickets();
            throw err;
        }
    }, [optimisticUpdateTicket, loadTickets]);

    const deleteTicketWithOptimism = useCallback(async (ticketId: string) => {
        const originalTickets = tickets;

        // Apply optimistic delete immediately
        optimisticRemoveTicket(ticketId);

        try {
            const { error } = await ticketService.deleteTicket(ticketId);

            if (error) {
                // Revert optimistic delete on error
                setTickets(originalTickets);
                throw error;
            }
        } catch (err) {
            // Revert optimistic delete on error
            setTickets(originalTickets);
            throw err;
        }
    }, [tickets, optimisticRemoveTicket]);

    return {
        tickets,
        loading,
        error,
        loadTickets,
        optimisticUpdateTicket,
        optimisticAddTicket,
        optimisticRemoveTicket,
        updateTicketWithOptimism,
        deleteTicketWithOptimism
    };
}
