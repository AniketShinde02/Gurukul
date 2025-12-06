-- ============================================
-- OPTIMIZED INDEXES - BEST PRACTICES
-- ============================================
-- Following database indexing best practices:
-- ✅ Index foreign keys (most important)
-- ✅ Index columns used in WHERE clauses
-- ✅ Index columns used in ORDER BY
-- ✅ Composite indexes for common query patterns
-- ❌ Avoid indexing frequently updated columns
-- ❌ Avoid indexing low-cardinality columns alone
-- ============================================

-- ============================================
-- ANALYSIS OF YOUR QUERIES
-- ============================================
-- Query 1: Fetch conversations
--   WHERE: user1_id OR user2_id (foreign keys)
--   ORDER BY: last_message_at DESC
--   FILTER: archived_by_user1, archived_by_user2
--
-- Query 2: Fetch messages
--   WHERE: conversation_id (foreign key)
--   ORDER BY: created_at DESC
--
-- Query 3: Mark as read
--   WHERE: conversation_id, is_read
-- ============================================

-- ============================================
-- DM CONVERSATIONS - OPTIMIZED INDEXES
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'dm_conversations') THEN
        
        -- PRIMARY INDEX: Order by last_message_at (used in ORDER BY)
        -- This is READ-HEAVY, updated only when new message arrives
        -- VERDICT: ✅ GOOD - Not updated frequently enough to matter
        CREATE INDEX IF NOT EXISTS idx_dm_conversations_last_message 
        ON dm_conversations(last_message_at DESC NULLS LAST);
        
        -- COMPOSITE INDEX: User1 + Archived status
        -- Used in WHERE clause: user1_id=X AND archived_by_user1=false
        -- VERDICT: ✅ GOOD - Composite index is efficient for this pattern
        CREATE INDEX IF NOT EXISTS idx_dm_conversations_user1_archived 
        ON dm_conversations(user1_id, archived_by_user1) 
        WHERE archived_by_user1 = false;  -- Partial index (smaller, faster)
        
        -- COMPOSITE INDEX: User2 + Archived status
        -- Used in WHERE clause: user2_id=X AND archived_by_user2=false
        -- VERDICT: ✅ GOOD - Composite index is efficient for this pattern
        CREATE INDEX IF NOT EXISTS idx_dm_conversations_user2_archived 
        ON dm_conversations(user2_id, archived_by_user2)
        WHERE archived_by_user2 = false;  -- Partial index (smaller, faster)
        
        -- COMPOSITE INDEX: Both users (for finding existing conversations)
        -- Used when starting new DM: WHERE user1_id=X AND user2_id=Y
        -- VERDICT: ✅ GOOD - Rarely updated, frequently queried
        CREATE INDEX IF NOT EXISTS idx_dm_conversations_users 
        ON dm_conversations(user1_id, user2_id);
        
        ANALYZE dm_conversations;
        RAISE NOTICE '✅ Added 4 optimized indexes to dm_conversations';
        
    ELSE
        RAISE NOTICE '⚠️ Table dm_conversations does not exist';
    END IF;
END $$;

-- ============================================
-- DM MESSAGES - OPTIMIZED INDEXES
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'dm_messages') THEN
        
        -- COMPOSITE INDEX: Conversation + Created (most important!)
        -- Used in: WHERE conversation_id=X ORDER BY created_at DESC
        -- VERDICT: ✅ EXCELLENT - Covers both WHERE and ORDER BY
        -- created_at is INSERT-only (never updated), perfect for indexing
        CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation_created 
        ON dm_messages(conversation_id, created_at DESC);
        
        -- FOREIGN KEY INDEX: Sender
        -- Used in: WHERE sender_id=X (find all my messages)
        -- VERDICT: ✅ GOOD - Foreign key, frequently queried
        CREATE INDEX IF NOT EXISTS idx_dm_messages_sender 
        ON dm_messages(sender_id);
        
        -- COMPOSITE INDEX: Conversation + Read status (for unread count)
        -- Used in: WHERE conversation_id=X AND is_read=false
        -- VERDICT: ⚠️ CONDITIONAL - is_read is updated frequently
        -- SOLUTION: Use partial index (only index unread messages)
        CREATE INDEX IF NOT EXISTS idx_dm_messages_unread 
        ON dm_messages(conversation_id, created_at DESC)
        WHERE is_read = false;  -- Partial index (much smaller, faster)
        
        ANALYZE dm_messages;
        RAISE NOTICE '✅ Added 3 optimized indexes to dm_messages';
        
    ELSE
        RAISE NOTICE '⚠️ Table dm_messages does not exist';
    END IF;
END $$;

-- ============================================
-- PROFILES - OPTIMIZED INDEXES
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'profiles') THEN
        
        -- UNIQUE INDEX: Username (for lookups and uniqueness)
        -- VERDICT: ✅ EXCELLENT - Rarely updated, frequently queried
        CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique 
        ON profiles(LOWER(username));  -- Case-insensitive
        
        -- INDEX: Email (for login lookups)
        -- VERDICT: ✅ GOOD - Rarely updated, used in authentication
        CREATE INDEX IF NOT EXISTS idx_profiles_email 
        ON profiles(LOWER(email));  -- Case-insensitive
        
        -- INDEX: ID (usually auto-created, but let's verify)
        -- This is the primary key, should already have an index
        
        ANALYZE profiles;
        RAISE NOTICE '✅ Added 2 optimized indexes to profiles';
        
    ELSE
        RAISE NOTICE '⚠️ Table profiles does not exist';
    END IF;
END $$;

-- ============================================
-- OPTIONAL: ROOM/SERVER INDEXES (if tables exist)
-- ============================================

-- Messages (Server messages)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'messages') THEN
        
        -- COMPOSITE INDEX: Session + Created
        -- Same pattern as DM messages
        CREATE INDEX IF NOT EXISTS idx_messages_session_created 
        ON messages(session_id, created_at DESC);
        
        -- FOREIGN KEY INDEX: Sender
        CREATE INDEX IF NOT EXISTS idx_messages_sender 
        ON messages(sender_id);
        
        ANALYZE messages;
        RAISE NOTICE '✅ Added 2 optimized indexes to messages';
    ELSE
        RAISE NOTICE '⚠️ Table messages does not exist, skipping...';
    END IF;
END $$;

-- Room Channels
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'room_channels') THEN
        
        -- COMPOSITE INDEX: Room + Position
        -- Used for: WHERE room_id=X ORDER BY position
        CREATE INDEX IF NOT EXISTS idx_room_channels_room_position 
        ON room_channels(room_id, position);
        
        ANALYZE room_channels;
        RAISE NOTICE '✅ Added 1 optimized index to room_channels';
    ELSE
        RAISE NOTICE '⚠️ Table room_channels does not exist, skipping...';
    END IF;
END $$;

-- ============================================
-- BEST PRACTICES APPLIED
-- ============================================
-- ✅ Partial indexes for boolean columns (smaller, faster)
-- ✅ Composite indexes for multi-column queries
-- ✅ DESC ordering for timestamp columns
-- ✅ Case-insensitive indexes for text searches
-- ✅ Only index columns used in WHERE/ORDER BY
-- ✅ Avoided indexing frequently updated columns
-- ============================================

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
    '✅ OPTIMIZED INDEXES CREATED' as status,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes 
WHERE indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================
-- PERFORMANCE NOTES
-- ============================================
-- Partial indexes (WHERE clause in index):
--   - Smaller size (only indexes matching rows)
--   - Faster queries (less data to scan)
--   - Less maintenance (fewer rows to update)
--
-- Composite indexes:
--   - Cover multiple columns in one index
--   - More efficient than multiple single-column indexes
--   - Order matters: (conversation_id, created_at) ≠ (created_at, conversation_id)
--
-- Case-insensitive indexes:
--   - LOWER(column) allows case-insensitive searches
--   - Prevents duplicate usernames with different cases
-- ============================================
