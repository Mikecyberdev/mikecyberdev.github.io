## Supabase Setup

1. Open the Supabase SQL editor for your project.
2. Open [supabase/setup.sql](/home/fearless/Documents/Portfolios%20project/New%20Portfolio%20project/supabase/setup.sql).
3. Confirm the admin email in the SQL file is `micnduokojun@gmail.com`.
4. Run the SQL script.
5. In `Authentication -> Sign In / Providers`, make sure `Email` is enabled.
6. In `Authentication -> Users`, create that user or reset its password in Supabase Auth.
7. Open [admin.html](/home/fearless/Documents/Portfolios%20project/New%20Portfolio%20project/admin.html) and sign in.
8. Upload your profile image, CV, and project images, then click `Save Changes`.

### What the setup script creates

- `public.site_content`: one row of portfolio content
- `public.admin_users`: the list of allowed admin emails
- `storage` bucket: `site-assets`
- policies:
  - public read for portfolio content and uploaded assets
  - authenticated admin-only writes

### Important

- Do not put your `service_role` key in the browser.
- If your login works but the dashboard says you are not authorized, check the email in `admin_users`.
