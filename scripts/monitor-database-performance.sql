-- ============================================
-- DATABASE MONITORING - ULTRA MINIMAL
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================
-- 1. SLOW QUERIES
-- ============================================

SELECT 
    SUBSTRING(query, 1, 100) AS query_preview,
    calls,
    ROUND(mean_exec_time::numeric, 2) AS avg_time_ms
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- ============================================
-- 2. INDEX USAGE
-- ============================================

SELECT 
    indexrelname AS index_name,
    idx_scan AS scans
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 20;

-- ============================================
-- 3. TABLE SIZES
-- ============================================

SELECT 
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(oid)) AS size
FROM pg_class
WHERE relkind = 'r'
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY pg_total_relation_size(oid) DESC
LIMIT 10;

-- ============================================
-- 4. CONNECTIONS
-- ============================================

SELECT 
    COUNT(*) AS total_connections,
    COUNT(*) FILTER (WHERE state = 'active') AS active
FROM pg_stat_activity
WHERE datname = current_database();

-- ============================================
-- 5. DATABASE SIZE
-- ============================================

SELECT pg_size_pretty(pg_database_size(current_database())) AS database_size;

-- Success
DO $$
BEGIN
    RAISE NOTICE '✅ Monitoring complete!';
END $$;
