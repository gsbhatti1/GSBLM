-- Seed data. Templates mirror the extension's bundled set; help_directory mirrors lib/help.ts.

insert into help_directory (name, kind, description, phone, url, jurisdiction) values
('211 (United Way)', 'local', 'Free, 24/7. Connects you to local food, housing, and benefits help.', '211', 'https://www.211.org', 'US'),
('Utah 211', 'local', 'Utah local services: food, rent, utilities, and more.', '211', 'https://211utah.org', 'US-UT'),
('VA Benefits Hotline', 'veteran', 'Help with VA disability, pension, and claim questions.', '1-800-827-1000', 'https://www.va.gov', 'US'),
('Accredited Veterans Service Officer (VSO)', 'veteran', 'A trained officer can file and manage VA claims with you, for free.', null, 'https://www.va.gov/ogc/apps/accreditation/index.asp', 'US'),
('Veterans Crisis Line', 'crisis', 'Free, confidential support, 24/7. You do not have to be in crisis to call.', '988 then press 1', 'https://www.veteranscrisisline.net', 'US')
on conflict do nothing;
