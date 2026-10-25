import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function readSecretKey() {
  const injected = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (injected) {
    try {
      const keys = JSON.parse(injected);
      if (typeof keys === 'string') return keys;
      return keys.default || Object.values(keys).find(value => typeof value === 'string');
    } catch {
      // Fall through to the legacy server-only environment variable.
    }
  }
  return Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}

function readPublishableKey() {
  const injected = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (injected) {
    try {
      const keys = JSON.parse(injected);
      if (typeof keys === 'string') return keys;
      return keys.default || Object.values(keys).find(value => typeof value === 'string');
    } catch {
      // Legacy projects may provide the publishable key under its older name.
    }
  }
  return Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '';
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const publishableKey = readPublishableKey();
const secretKey = readSecretKey();

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  if (!supabaseUrl || !secretKey || !publishableKey) return Response.json({ error: 'إعدادات الخادم غير مكتملة.' }, { status: 500, headers: corsHeaders });

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return Response.json({ error: 'يلزم تسجيل الدخول.' }, { status: 401, headers: corsHeaders });

  const callerClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const { data: authResult, error: authError } = await callerClient.auth.getUser();
    if (authError || !authResult.user) return Response.json({ error: 'جلسة الدخول غير صالحة.' }, { status: 401, headers: corsHeaders });

    const { data: actor, error: actorError } = await adminClient
      .from('profiles').select('id, role, permissions, is_active').eq('id', authResult.user.id).maybeSingle();
    if (actorError || !actor?.is_active) return Response.json({ error: 'الحساب غير مفعل.' }, { status: 403, headers: corsHeaders });

    const body = await request.json();
    const action = body?.action;
    const isManager = actor.role === 'manager';
    if (isManager) {
      const { data: assurance, error: assuranceError } = await callerClient.auth.mfa
        .getAuthenticatorAssuranceLevel(authorization.replace(/^Bearer\s+/i, ''));
      if (assuranceError || assurance?.currentLevel !== 'aal2') {
        return Response.json({ error: 'أكمل التحقق الثنائي للمدير قبل تنفيذ هذه العملية.' }, { status: 403, headers: corsHeaders });
      }
    }
    const canManageCustomers = isManager || (actor.role === 'employee' && actor.permissions?.['customers.manage'] === true);
    if (!canManageCustomers) return Response.json({ error: 'لا تملك صلاحية إدارة الحسابات.' }, { status: 403, headers: corsHeaders });

    if (action === 'create_employee') {
      if (!isManager) return Response.json({ error: 'إنشاء الموظفين متاح للمدير فقط.' }, { status: 403, headers: corsHeaders });
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const name = String(body.name || '').trim();
      if (!email || !name || password.length < 8) return Response.json({ error: 'تحقق من البريد والاسم وكلمة المرور.' }, { status: 400, headers: corsHeaders });
      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, store_name: 'فريق وصلني', store_type: 'عمليات' }
      });
      if (createError || !created.user) return Response.json({ error: createError?.message || 'تعذر إنشاء الحساب.' }, { status: 400, headers: corsHeaders });

      const { error: profileError } = await adminClient.from('profiles').update({
        role: 'employee',
        permissions: body.permissions && typeof body.permissions === 'object' ? body.permissions : {},
        is_active: true
      }).eq('id', created.user.id);
      if (profileError) {
        await adminClient.auth.admin.deleteUser(created.user.id);
        return Response.json({ error: 'تعذر إسناد صلاحيات الموظف.' }, { status: 500, headers: corsHeaders });
      }
      const { data: profile } = await adminClient.from('profiles').select('*').eq('id', created.user.id).single();
      return Response.json({ profile }, { status: 201, headers: corsHeaders });
    }

    if (action === 'update_employee_permissions') {
      if (!isManager) return Response.json({ error: 'تعديل صلاحيات الموظفين متاح للمدير فقط.' }, { status: 403, headers: corsHeaders });
      const { error } = await adminClient.from('profiles')
        .update({ permissions: body.permissions || {} })
        .eq('id', body.userId).eq('role', 'employee');
      if (error) return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
      return Response.json({ success: true }, { headers: corsHeaders });
    }

    if (action === 'delete_employee') {
      if (!isManager) return Response.json({ error: 'حذف الموظفين متاح للمدير فقط.' }, { status: 403, headers: corsHeaders });
      const { data: target } = await adminClient.from('profiles').select('id').eq('id', body.userId).eq('role', 'employee').maybeSingle();
      if (!target) return Response.json({ error: 'الموظف غير موجود.' }, { status: 404, headers: corsHeaders });
      const { error } = await adminClient.auth.admin.deleteUser(target.id);
      if (error) return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
      return Response.json({ success: true }, { headers: corsHeaders });
    }

    if (action === 'grant_order_attempts') {
      const { data, error } = await callerClient.rpc('grant_customer_order_attempts', {
        target_customer: body.userId,
        grant_count: body.count || 3
      });
      if (error) return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
      return Response.json({ grant: data }, { headers: corsHeaders });
    }

    if (action === 'reset_customer_password') {
      const { data: target } = await adminClient.from('profiles').select('id, role').eq('id', body.userId).maybeSingle();
      if (!target || target.role !== 'customer') return Response.json({ error: 'العميل غير موجود.' }, { status: 404, headers: corsHeaders });
      const password = String(body.password || '');
      if (password.length < 8) return Response.json({ error: 'كلمة المرور يجب ألا تقل عن 8 خانات.' }, { status: 400, headers: corsHeaders });
      const { error } = await adminClient.auth.admin.updateUserById(target.id, { password });
      if (error) return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
      return Response.json({ success: true }, { headers: corsHeaders });
    }

    return Response.json({ error: 'العملية غير معروفة.' }, { status: 400, headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error?.message || 'حدث خطأ داخلي.' }, { status: 500, headers: corsHeaders });
  }
});
