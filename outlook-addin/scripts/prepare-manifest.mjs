import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const clientId=process.env.VITE_MICROSOFT_CLIENT_ID;
const appIdUri=process.env.VITE_MICROSOFT_APP_ID_URI || (clientId ? `api://${clientId}` : "");
const addinUrl=process.env.VITE_ADDIN_URL || "https://localhost:5174";
const supportUrl=process.env.VITE_SUPPORT_URL || "http://localhost:5173/#/help";
if(!clientId || !appIdUri || !addinUrl){
  console.error("Missing VITE_MICROSOFT_CLIENT_ID or VITE_MICROSOFT_APP_ID_URI");
  process.exit(1);
}
const template=fs.readFileSync(path.join(root,"manifest.xml"),"utf8");
const out=template.replaceAll("__MICROSOFT_CLIENT_ID__",clientId).replaceAll("__MICROSOFT_APP_ID_URI__",appIdUri).replaceAll("__ADDIN_URL__",addinUrl.replace(/\/$/, "")).replaceAll("__SUPPORT_URL__",supportUrl);
fs.writeFileSync(path.join(root,"dist-manifest.xml"),out);
console.log("Prepared dist-manifest.xml");
