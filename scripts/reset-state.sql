-- Clear all stale data to reset the system
TRUNCATE TABLE waiting_queue;
DELETE FROM chat_sessions;
DELETE FROM messages;
