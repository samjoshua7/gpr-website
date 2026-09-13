export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(501).json({
    success: false,
    environment: 'vercel',
    error: 'Remote cloud deployment cannot launch local desktop File Explorer. Use the gpr-explorer:// desktop protocol.',
    method: 'unavailable',
  });
}
