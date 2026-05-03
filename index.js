// Minimal entrypoint to satisfy Vercel build
export default function handler(req, res) {
  res.status(200).json({ status: "ok" });
}
