export function isAuthorized(req) {
  const configuredPassword = process.env.APP_PASSWORD?.trim();
  if (!configuredPassword) return true;
  const received = req.headers['x-app-password'];
  const password = Array.isArray(received) ? received[0] : received;
  return password === configuredPassword;
}

export function requireAuth(req, res) {
  if (isAuthorized(req)) return true;
  res.status(401).json({ error: 'Senha de acesso inválida.' });
  return false;
}
