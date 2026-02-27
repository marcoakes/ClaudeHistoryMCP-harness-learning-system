interface Env {
  ADMIN_USER: string;
  ADMIN_PASS: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);

  // Allow health checks and static vite assets without auth only if desired.
  // For full protection, keep auth on all routes.
  const auth = context.request.headers.get('authorization');
  const expectedUser = context.env.ADMIN_USER || '';
  const expectedPass = context.env.ADMIN_PASS || '';

  if (!auth?.startsWith('Basic ')) {
    return new Response('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="WorldMonitor"' },
    });
  }

  let user = '';
  let pass = '';
  try {
    const decoded = atob(auth.slice(6));
    const idx = decoded.indexOf(':');
    user = idx >= 0 ? decoded.slice(0, idx) : decoded;
    pass = idx >= 0 ? decoded.slice(idx + 1) : '';
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  if (user !== expectedUser || pass !== expectedPass) {
    return new Response('Unauthorized', { status: 401 });
  }

  return context.next();
};
