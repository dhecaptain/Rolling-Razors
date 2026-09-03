import * as casbin from "casbin";
import path from "path";
import { logger } from "../logger";

let enforcer: casbin.Enforcer | null = null;

export async function getEnforcer(): Promise<casbin.Enforcer> {
  if (enforcer) return enforcer;
  const modelPath = path.join(process.cwd(), "server/casbin/model.conf");
  const policyPath = path.join(process.cwd(), "server/casbin/policy.csv");
  enforcer = await casbin.newEnforcer(modelPath, policyPath);
  await enforcer.loadPolicy();
  logger.info("[Casbin] enforcer loaded");
  return enforcer;
}

export async function authorize(sub: string, obj: string, act: string): Promise<boolean> {
  const e = await getEnforcer();
  return e.enforce(sub, obj, act);
}

export function requireCasbin(obj: string, act: string) {
  return async (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: "Unauthorized" });
    const role = user.role || "customer";
    const ok = await authorize(role, obj, act);
    if (!ok) return res.status(403).json({ success: false, error: `Forbidden: ${role} cannot ${act} ${obj}` });
    next();
  };
}
