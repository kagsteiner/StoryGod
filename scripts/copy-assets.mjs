import { copyFile, cp, mkdir } from "node:fs/promises";

await mkdir("dist/public", { recursive: true });
await cp("public", "dist/public", { recursive: true, force: true });
await copyFile("dist/public-client.js", "dist/public/public-client.js");
await copyFile("dist/public-client.js.map", "dist/public/public-client.js.map");
await copyFile("dist/story-client.js", "dist/public/story-client.js");
await copyFile("dist/story-client.js.map", "dist/public/story-client.js.map");
await copyFile("dist/story-export.js", "dist/public/story-export.js");
await copyFile("dist/story-export.js.map", "dist/public/story-export.js.map");
