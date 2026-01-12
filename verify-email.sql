-- Verify email for paladinmarketers@gmail.com
UPDATE users 
SET email_verified = true, 
    email_verification_token = NULL 
WHERE email = 'paladinmarketers@gmail.com';

-- Check the result
SELECT id, email, email_verified, created_at 
FROM users 
WHERE email = 'paladinmarketers@gmail.com';
