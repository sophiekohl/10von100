const ORIGIN = 'https://sophiekohl.github.io';
const MESSAGE = 'Anmeldung nicht möglich. Bitte später erneut versuchen oder im Studio entsperren.';
export function createHandler({ url, key, fetcher = fetch }) {
  async function request(path, body, token = key, method = 'POST') {
    const response = await fetcher(url + path, {
      method, headers: { apikey: key, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) throw Error('Upstream failure');
    return response.status === 204 ? null : response.json();
  }
  const rpc = (name, body = {}) => request('/rest/v1/rpc/' + name, body);
  return async req => {
    const origin = req.headers.get('origin');
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store',
      'Vary': 'Origin', 'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
      ...(origin === ORIGIN ? { 'Access-Control-Allow-Origin': origin } : {}) };
    const reply = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });
    if (origin && origin !== ORIGIN) return reply({ error: MESSAGE }, 403);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (req.method !== 'POST') return reply({ error: MESSAGE }, 405);
    try {
      // Limit actual streamed bytes too; Content-Length alone is untrusted.
      if (!req.headers.get('content-type')?.startsWith('application/json')) return reply({ error: MESSAGE }, 400);
      const reader = req.body?.getReader(); let length = 0, chunks = [];
      if (!reader) return reply({ error: MESSAGE }, 400);
      for (;;) { const { value, done } = await reader.read(); if (done) break;
        length += value.length; if (length > 512) { await reader.cancel(); return reply({ error: MESSAGE }, 413); } chunks.push(value); }
      const bytes = new Uint8Array(length); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      const input = JSON.parse(new TextDecoder().decode(bytes));
      if (input.action !== 'login') {
        const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
        if (!token) return reply({ error: MESSAGE }, 401);
        const user = await request('/auth/v1/user', undefined, token, 'GET');
        const admin = await request('/rest/v1/rpc/is_admin', {}, token);
        if (!user.id || admin !== true) return reply({ error: MESSAGE }, 403);
        if (input.action === 'status') return reply(await rpc('partner_pin_status'));
        if (input.action === 'revoke') { await rpc('partner_pin_revoke'); return reply({ ok: true }); }
        if (input.action !== 'configure' || !/^[0-9]{4}$/.test(input.pin || '')) return reply({ error: MESSAGE }, 400);
        const current = await rpc('partner_pin_status'); let id = current.user_id;
        if (!id) {
          const created = await request('/auth/v1/admin/users', {
            email: 'partner-' + crypto.randomUUID() + '@10von100.invalid',
            password: crypto.randomUUID() + crypto.randomUUID(), email_confirm: true,
          });
          id = created.id;
        }
        await rpc('partner_pin_configure', { p_user_id: id, p_pin: input.pin, p_disabled: false });
        return reply({ ok: true });
      }
      // The account-wide lock remains effective even for attacker-controlled IP headers.
      const ip = req.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() || 'unknown';
      const hmacKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const digest = await crypto.subtle.sign('HMAC', hmacKey, new TextEncoder().encode(ip));
      const ipHash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
      const approved = await rpc('partner_pin_check', { p_pin: typeof input.pin === 'string' ? input.pin : '', p_ip_hash: ipHash });
      if (!approved) return reply({ error: MESSAGE }, 401);
      const link = await request('/auth/v1/admin/generate_link', { type: 'magiclink', email: approved.email });
      const session = await request('/auth/v1/verify', { type: 'email', token_hash: link.hashed_token });
      const claims = JSON.parse(atob(session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (session.user?.id !== approved.user_id || !claims.session_id) throw Error('Invalid identity');
      const registered = await rpc('partner_pin_register', { p_user_id: approved.user_id, p_revision: approved.revision, p_session_id: claims.session_id });
      if (!registered) { await request('/auth/v1/logout?scope=global', undefined, session.access_token); throw Error('Revoked'); }
      return reply({ access_token: session.access_token, refresh_token: session.refresh_token,
        expires_in: session.expires_in, user: { id: approved.user_id } });
    } catch { return reply({ error: MESSAGE }, 401); }
  };
}
