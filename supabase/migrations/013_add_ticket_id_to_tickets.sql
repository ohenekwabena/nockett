alter table public.tickets
add column if not exists ticket_id text;

create unique index if not exists tickets_ticket_id_unique_idx
on public.tickets (ticket_id)
where ticket_id is not null;