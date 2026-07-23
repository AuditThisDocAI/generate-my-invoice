import { onRequest } from "firebase-functions/v2/https";
import { createRequire } from "module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const serverBundlePath = path.resolve(currentDir, "dist/server.cjs");

const serverModule = require(serverBundlePath);
const app = serverModule.app || serverModule.default || serverModule;

export const api = onRequest(app);
