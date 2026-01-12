-- Assign subscriber role to users with active subscriptions who don't have the role yet
INSERT INTO user_roles (user_id, role, assigned_by, assigned_at)
SELECT DISTINCT 
    u.id as user_id, 
    'subscriber' as role,
    'system' as assigned_by,
    NOW() as assigned_at
FROM users u
INNER JOIN subscriptions s ON s.user_id = u.id
LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'subscriber'
WHERE s.status = 'active' 
  AND ur.id IS NULL
ON CONFLICT DO NOTHING;

-- Show results
SELECT 
    u.email,
    u.id as user_id,
    s.status as subscription_status,
    s.expires_at,
    string_agg(ur.role, ', ') as roles
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE s.status = 'active'
GROUP BY u.id, u.email, s.status, s.expires_at;
