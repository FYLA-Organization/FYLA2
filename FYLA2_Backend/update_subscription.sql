-- Update provider subscription tier to test access control
UPDATE AspNetUsers 
SET SubscriptionTier = 'basic' 
WHERE Email = 'provider1@fyla2.com';

-- Check the update
SELECT Id, Email, FirstName, LastName, SubscriptionTier 
FROM AspNetUsers 
WHERE Email = 'provider1@fyla2.com';
