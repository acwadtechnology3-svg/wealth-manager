-- ============================================
-- Chat Performance Optimization - Database Indexes
-- ============================================
-- This file contains recommended database indexes for the team_messages table
-- to significantly improve chat query performance.
--
-- Run these in your Supabase SQL Editor
-- ============================================

-- 1. Composite index for conversation queries
-- This is the MOST IMPORTANT index for chat performance
-- Speeds up queries that fetch messages between two specific users
CREATE INDEX IF NOT EXISTS idx_team_messages_conversation 
ON team_messages(sender_id, recipient_id, created_at DESC);

-- Explanation:
-- - sender_id + recipient_id: Quickly finds messages between two users
-- - created_at DESC: Orders messages by time (newest first or oldest first)
-- Expected improvement: 60-80% faster conversation loading

-- ============================================

-- 2. Index for recipient-based queries
-- Speeds up queries for unread messages and messages sent to a specific user
CREATE INDEX IF NOT EXISTS idx_team_messages_recipient 
ON team_messages(recipient_id, is_read, created_at DESC);

-- Explanation:
-- - recipient_id: Finds all messages for a user
-- - is_read: Filters unread messages
-- - created_at DESC: Orders by time
-- Expected improvement: 50-70% faster unread count queries

-- ============================================

-- 3. Partial index for group messages
-- Optimized specifically for group chat queries
CREATE INDEX IF NOT EXISTS idx_team_messages_group 
ON team_messages(created_at DESC) 
WHERE recipient_id IS NULL;

-- Explanation:
-- - WHERE recipient_id IS NULL: Only indexes group messages (smaller index)
-- - created_at DESC: Orders by time
-- Expected improvement: 70-90% faster group chat loading

-- ============================================

-- 4. Index for sender-based queries
-- Speeds up queries for messages sent by a specific user
CREATE INDEX IF NOT EXISTS idx_team_messages_sender 
ON team_messages(sender_id, created_at DESC);

-- Explanation:
-- - sender_id: Finds all messages from a user
-- - created_at DESC: Orders by time
-- Expected improvement: 50-70% faster sender history queries

-- ============================================

-- 5. Composite index for direct messages only
-- Optimized for non-group message queries
CREATE INDEX IF NOT EXISTS idx_team_messages_direct 
ON team_messages(sender_id, recipient_id, created_at DESC)
WHERE recipient_id IS NOT NULL;

-- Explanation:
-- - WHERE recipient_id IS NOT NULL: Only indexes direct messages
-- - Smaller index size, faster queries for direct messages
-- Expected improvement: 40-60% faster direct message queries

-- ============================================

-- VERIFICATION QUERIES
-- Run these to verify indexes were created successfully
-- ============================================

-- Check all indexes on team_messages table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'team_messages'
ORDER BY indexname;

-- ============================================

-- PERFORMANCE TESTING
-- Run these queries before and after adding indexes to measure improvement
-- ============================================

-- Test 1: Conversation query (should use idx_team_messages_conversation)
EXPLAIN ANALYZE
SELECT * FROM team_messages
WHERE (sender_id = 'user1-uuid' AND recipient_id = 'user2-uuid')
   OR (sender_id = 'user2-uuid' AND recipient_id = 'user1-uuid')
ORDER BY created_at ASC
LIMIT 50;

-- Test 2: Unread count query (should use idx_team_messages_recipient)
EXPLAIN ANALYZE
SELECT COUNT(*) FROM team_messages
WHERE recipient_id = 'user-uuid' AND is_read = false;

-- Test 3: Group messages query (should use idx_team_messages_group)
EXPLAIN ANALYZE
SELECT * FROM team_messages
WHERE recipient_id IS NULL
ORDER BY created_at DESC
LIMIT 100;

-- ============================================

-- MAINTENANCE
-- ============================================

-- Reindex if needed (run during low-traffic periods)
-- REINDEX TABLE team_messages;

-- Update table statistics for better query planning
-- ANALYZE team_messages;

-- ============================================

-- MONITORING
-- Check index usage statistics
-- ============================================

SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'team_messages'
ORDER BY idx_scan DESC;

-- ============================================

-- CLEANUP (if you need to remove indexes)
-- ============================================

-- DROP INDEX IF EXISTS idx_team_messages_conversation;
-- DROP INDEX IF EXISTS idx_team_messages_recipient;
-- DROP INDEX IF EXISTS idx_team_messages_group;
-- DROP INDEX IF EXISTS idx_team_messages_sender;
-- DROP INDEX IF EXISTS idx_team_messages_direct;

-- ============================================
-- END OF FILE
-- ============================================
