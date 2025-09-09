-- Create PCM schema and user
-- NOTE: In production, use Oracle Wallet or environment variable for password
CREATE USER pcm_user IDENTIFIED BY PCMSystem123;

-- Grant necessary privileges (removed DBA which is excessive)
GRANT CONNECT, RESOURCE TO pcm_user;
GRANT CREATE SESSION TO pcm_user;
GRANT CREATE TABLE TO pcm_user;
GRANT CREATE VIEW TO pcm_user;
GRANT CREATE SEQUENCE TO pcm_user;
GRANT CREATE PROCEDURE TO pcm_user;
GRANT CREATE TRIGGER TO pcm_user;

-- Grant unlimited tablespace
ALTER USER pcm_user QUOTA UNLIMITED ON USERS;

-- Set default schema
ALTER SESSION SET CURRENT_SCHEMA = pcm_user;