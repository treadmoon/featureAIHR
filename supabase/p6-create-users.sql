-- ============================================
-- P6.5: 批量创建 auth 用户（33人）
-- 在 Supabase SQL Editor 中执行
-- 密码统一 Pass1234，后续可改
-- ============================================

-- 先检查 admin 是否已存在，避免重复
do $$
declare
  emails text[] := array[
    'admin@star.dev', 'liwei@star.dev',
    'zhanghr@star.dev', 'wangling@star.dev', 'liuxc@star.dev', 'sunzr@star.dev',
    'zhaoqf@star.dev', 'qianhy@star.dev', 'zhoujl@star.dev',
    'wutech@star.dev', 'zhengkj@star.dev', 'fengyl@star.dev', 'chuxm@star.dev',
    'weijh@star.dev', 'jiangmn@star.dev', 'hanxl@star.dev', 'yangrf@star.dev',
    'zhupm@star.dev', 'xujy@star.dev', 'hesl@star.dev',
    'lvmkt@star.dev', 'shiyq@star.dev', 'tangxm@star.dev',
    'caosales@star.dev', 'yuanke@star.dev', 'dengxf@star.dev', 'xiaojr@star.dev',
    'panops@star.dev', 'duanxy@star.dev',
    'songadm@star.dev', 'majie@star.dev',
    'guolegal@star.dev', 'linff@star.dev'
  ];
  em text;
  uid uuid;
  existing_count int;
begin
  foreach em in array emails loop
    select count(*) into existing_count from auth.users where email = em;
    if existing_count = 0 then
      uid := gen_random_uuid();
      insert into auth.users (
        id, instance_id, email,
        encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        aud, role
      ) values (
        uid, '00000000-0000-0000-0000-000000000000', em,
        crypt('Pass1234', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        json_build_object('name', split_part(em, '@', 1))::jsonb,
        'authenticated', 'authenticated'
      );
      -- identities 表也需要插入，否则无法登录
      insert into auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), uid, em,
        json_build_object('sub', uid::text, 'email', em)::jsonb,
        'email', now(), now(), now()
      );
      raise notice 'Created user: %', em;
    else
      raise notice 'User already exists: %', em;
    end if;
  end loop;
end $$;
