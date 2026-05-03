import type { NextApiResponse } from "next";

export function sendOk<T>(res: NextApiResponse, data: T, status = 200) {
  res.status(status).json({ ok: true, data });
}

export function sendError(res: NextApiResponse, message: string, status = 400) {
  res.status(status).json({ ok: false, error: message });
}
