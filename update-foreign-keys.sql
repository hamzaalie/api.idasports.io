-- Update foreign key constraints to allow user deletion
-- This script updates all foreign keys referencing the users table

-- 1. Update audit_logs foreign keys to SET NULL on delete
ALTER TABLE audit_logs 
DROP CONSTRAINT IF EXISTS "FK_bd2726fd31b35443f2245b93ba0";

ALTER TABLE audit_logs
ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE audit_logs 
DROP CONSTRAINT IF EXISTS "FK_audit_logs_target_user";

ALTER TABLE audit_logs
ADD CONSTRAINT "FK_audit_logs_target_user" 
FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 2. Update user_roles assigned_by to SET NULL on delete
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS "FK_user_roles_assigned_by";

ALTER TABLE user_roles
ADD CONSTRAINT "FK_user_roles_assigned_by" 
FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;

-- 3. Update payments foreign key to CASCADE on delete (already should be CASCADE, but ensuring)
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS "FK_payments_user_id";

ALTER TABLE payments
ADD CONSTRAINT "FK_payments_user_id" 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 4. Update invoices foreign key to CASCADE on delete
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS "FK_invoices_user_id";

ALTER TABLE invoices
ADD CONSTRAINT "FK_invoices_user_id" 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Verify the changes
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'users'
ORDER BY tc.table_name, kcu.column_name;
