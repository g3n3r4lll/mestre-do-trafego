import { isAuthorized } from './_lib/auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  const authenticated = isAuthorized(req);
  return res.status(authenticated ? 200 : 401).json({
    authenticated,
    protected: Boolean(process.env.APP_PASSWORD?.trim()),
    ...(authenticated ? {} : { error: 'Senha de acesso inválida.' }),
  });
}
