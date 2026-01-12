-- Manually verify the user account
UPDATE users 
SET email_verified = true, 
    email_verification_token = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'paladinmarketers@gmail.com';

-- Check the update
SELECT id, email, email_verified, created_at 
FROM users 
WHERE email = 'paladinmarketers@gmail.com';
