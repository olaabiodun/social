
INSERT INTO public.categories (name, slug, emoji, display_order) VALUES
('Random Country Facebook', 'facebook', '📘', 1),
('Country TikTok', 'tiktok', '🎵', 2),
('USA Facebook', 'facebook-usa', '🇺🇸', 3),
('Instagram Accounts', 'instagram', '📷', 4),
('Twitter / X Accounts', 'twitter', '🐦', 5),
('YouTube Accounts', 'youtube', '▶️', 6),
('Snapchat Accounts', 'snapchat', '👻', 7),
('LinkedIn Accounts', 'linkedin', '💼', 8),
('Discord Accounts', 'discord', '🎮', 9),
('Gmail / Google Accounts', 'gmail', '📧', 10),
('Telegram Accounts', 'telegram', '✈️', 11),
('Private Proxies', 'proxies', '🔒', 12)
ON CONFLICT DO NOTHING;
