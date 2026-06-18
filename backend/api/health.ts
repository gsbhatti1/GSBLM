import { json, cors } from './_lib';

export default function handler(_req: any, res: any) {
  cors(res);
  json(res, 200, { ok: true, service: 'lifemode', ts: Date.now() });
}
