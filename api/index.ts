import serverless from "serverless-http";
import { createApp } from "../server/app";

let handler: ((req: any, res: any) => Promise<any>) | undefined;

// Vercel rewrites every route to this single serverless function, which runs the
// full Express app (API + M-Pesa callback + SPA served from `dist/` in production).
export default async function vercelHandler(req: any, res: any): Promise<any> {
  if (!handler) {
    const app = await createApp({ serveStatic: true });
    handler = serverless(app) as (req: any, res: any) => Promise<any>;
  }
  return handler(req, res);
}