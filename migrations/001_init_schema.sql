-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  sid varchar PRIMARY KEY,
  sess jsonb NOT NULL,
  expire timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id varchar PRIMARY KEY NOT NULL,
  email varchar UNIQUE,
  first_name varchar,
  last_name varchar,
  username varchar UNIQUE,
  bio text,
  profile_image_url varchar,
  role varchar DEFAULT 'user',
  provider varchar,
  provider_id varchar,
  is_active boolean DEFAULT true,
  last_login timestamp,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id serial PRIMARY KEY,
  title varchar NOT NULL,
  slug varchar UNIQUE NOT NULL,
  content text NOT NULL,
  excerpt text,
  author_id varchar REFERENCES users(id),
  published boolean DEFAULT false,
  approved boolean DEFAULT false,
  is_draft boolean DEFAULT true,
  is_auto_generated boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  views integer DEFAULT 0,
  github_repo varchar,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create user_drafts table
CREATE TABLE IF NOT EXISTS user_drafts (
  id serial PRIMARY KEY,
  user_id varchar NOT NULL REFERENCES users(id),
  title varchar NOT NULL,
  content text NOT NULL,
  excerpt text,
  tags text[] DEFAULT '{}',
  reading_time integer DEFAULT 1,
  is_shared boolean DEFAULT false,
  share_id varchar UNIQUE,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create user_bookmarks table
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id serial PRIMARY KEY,
  user_id varchar NOT NULL REFERENCES users(id),
  post_id integer NOT NULL REFERENCES blog_posts(id),
  reading_progress integer DEFAULT 0,
  bookmarked_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id serial PRIMARY KEY,
  name varchar NOT NULL,
  email varchar NOT NULL,
  subject varchar NOT NULL,
  message text NOT NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create audio_play_logs table
CREATE TABLE IF NOT EXISTS audio_play_logs (
  id serial PRIMARY KEY,
  user_id varchar REFERENCES users(id),
  audio_type varchar NOT NULL,
  played_at timestamp DEFAULT CURRENT_TIMESTAMP,
  session_id varchar
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id serial PRIMARY KEY,
  user_id varchar REFERENCES users(id),
  action varchar NOT NULL,
  resource varchar,
  resource_id varchar,
  details jsonb,
  ip_address varchar,
  user_agent varchar,
  session_id varchar,
  method varchar,
  endpoint varchar,
  status_code integer,
  duration integer,
  severity varchar DEFAULT 'info',
  category varchar DEFAULT 'general',
  risk_score integer DEFAULT 0,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create failed_login_attempts table
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id serial PRIMARY KEY,
  email varchar,
  ip_address varchar NOT NULL,
  user_agent varchar,
  attempted_at timestamp DEFAULT CURRENT_TIMESTAMP,
  provider varchar
);

-- Create system_health table
CREATE TABLE IF NOT EXISTS system_health (
  id serial PRIMARY KEY,
  metric_type varchar NOT NULL,
  metric_name varchar NOT NULL,
  value jsonb,
  status varchar DEFAULT 'healthy',
  checked_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id serial PRIMARY KEY,
  path varchar NOT NULL,
  user_agent text,
  ip_address varchar,
  timestamp timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create github_projects table
CREATE TABLE IF NOT EXISTS github_projects (
  id serial PRIMARY KEY,
  github_id integer UNIQUE,
  name varchar NOT NULL UNIQUE,
  full_name varchar,
  description text,
  language varchar,
  stars integer DEFAULT 0,
  forks integer DEFAULT 0,
  size integer DEFAULT 0,
  url varchar NOT NULL,
  homepage varchar,
  topics text[] DEFAULT '{}',
  is_private boolean DEFAULT false,
  created_at timestamp,
  updated_at timestamp,
  last_updated timestamp DEFAULT CURRENT_TIMESTAMP,
  last_synced_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id serial PRIMARY KEY,
  sender_id varchar NOT NULL REFERENCES users(id),
  recipient_id varchar REFERENCES users(id),
  content text NOT NULL,
  original_content text,
  is_moderated boolean DEFAULT false,
  moderation_action varchar,
  room_id varchar,
  message_type varchar DEFAULT 'text',
  is_read boolean DEFAULT false,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id serial PRIMARY KEY,
  blog_post_id integer NOT NULL REFERENCES blog_posts(id),
  author_id varchar NOT NULL REFERENCES users(id),
  content text NOT NULL,
  original_content text,
  is_moderated boolean DEFAULT false,
  moderation_action varchar,
  approved boolean DEFAULT true,
  parent_comment_id integer,
  depth integer DEFAULT 0,
  is_deleted boolean DEFAULT false,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id serial PRIMARY KEY,
  user_id varchar NOT NULL REFERENCES users(id),
  blog_post_id integer REFERENCES blog_posts(id),
  comment_id integer REFERENCES comments(id),
  like_type varchar NOT NULL DEFAULT 'like',
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create github_repo_integration table
CREATE TABLE IF NOT EXISTS github_repo_integration (
  id serial PRIMARY KEY,
  user_id varchar NOT NULL REFERENCES users(id),
  repo_name varchar NOT NULL,
  repo_url varchar NOT NULL,
  repo_description text,
  is_private boolean DEFAULT false,
  default_branch varchar DEFAULT 'main',
  language varchar,
  stars integer DEFAULT 0,
  forks integer DEFAULT 0,
  last_commit_sha varchar,
  last_commit_date timestamp,
  is_enabled boolean DEFAULT true,
  auto_blog_generated boolean DEFAULT false,
  blog_post_id integer REFERENCES blog_posts(id),
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_messages table
CREATE TABLE IF NOT EXISTS admin_messages (
  id serial PRIMARY KEY,
  admin_id varchar NOT NULL REFERENCES users(id),
  recipient_id varchar NOT NULL REFERENCES users(id),
  subject varchar NOT NULL,
  content text NOT NULL,
  message_type varchar DEFAULT 'direct',
  priority varchar DEFAULT 'normal',
  is_read boolean DEFAULT false,
  read_at timestamp,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create user_github_tokens table
CREATE TABLE IF NOT EXISTS user_github_tokens (
  id serial PRIMARY KEY,
  user_id varchar NOT NULL UNIQUE REFERENCES users(id),
  encrypted_token text NOT NULL,
  token_scope text,
  is_valid boolean DEFAULT true,
  last_validated timestamp,
  expires_at timestamp,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create moderation_logs table
CREATE TABLE IF NOT EXISTS moderation_logs (
  id serial PRIMARY KEY,
  content_type varchar NOT NULL,
  content_id varchar NOT NULL,
  user_id varchar NOT NULL REFERENCES users(id),
  original_text text NOT NULL,
  moderated_text text,
  action varchar NOT NULL,
  reason text,
  sentiment_score integer,
  toxicity_level varchar,
  ai_provider varchar,
  reviewed_by varchar REFERENCES users(id),
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id serial PRIMARY KEY,
  user_id varchar NOT NULL REFERENCES users(id),
  type varchar NOT NULL,
  title varchar NOT NULL,
  message text NOT NULL,
  related_id integer,
  related_type varchar,
  is_read boolean DEFAULT false,
  action_url varchar,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create user_site_data table
CREATE TABLE IF NOT EXISTS user_site_data (
  id serial PRIMARY KEY,
  user_id varchar NOT NULL UNIQUE,
  name varchar,
  title varchar,
  bio text,
  email varchar,
  github varchar,
  website varchar,
  skills text,
  theme varchar DEFAULT 'cybersecurity',
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create user_security_settings table
CREATE TABLE IF NOT EXISTS user_security_settings (
  id serial PRIMARY KEY,
  user_id varchar NOT NULL UNIQUE REFERENCES users(id),
  two_factor_enabled boolean DEFAULT false,
  session_timeout integer DEFAULT 1440,
  login_notifications boolean DEFAULT true,
  suspicious_activity_alerts boolean DEFAULT true,
  ip_whitelist_enabled boolean DEFAULT false,
  device_tracking_enabled boolean DEFAULT true,
  ip_whitelist text[] DEFAULT '{}',
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create user_notification_settings table
CREATE TABLE IF NOT EXISTS user_notification_settings (
  id serial PRIMARY KEY,
  user_id varchar NOT NULL UNIQUE REFERENCES users(id),
  email_notifications boolean DEFAULT true,
  blog_comment_notifications boolean DEFAULT true,
  blog_like_notifications boolean DEFAULT true,
  security_alerts boolean DEFAULT true,
  github_sync_notifications boolean DEFAULT true,
  system_updates boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  weekly_digest boolean DEFAULT false,
  email_frequency varchar DEFAULT 'immediate',
  quiet_hours_enabled boolean DEFAULT false,
  quiet_hours_start varchar DEFAULT '22:00',
  quiet_hours_end varchar DEFAULT '08:00',
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create user_api_tokens table
CREATE TABLE IF NOT EXISTS user_api_tokens (
  id serial PRIMARY KEY,
  user_id varchar NOT NULL REFERENCES users(id),
  token_hash varchar NOT NULL,
  token_prefix varchar NOT NULL,
  name varchar,
  expires_at timestamp,
  last_used_at timestamp,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);
