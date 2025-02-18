// import fs from "node:fs";
// import path from "node:path";
// import { fileURLToPath } from "url";
// must use require b/c CDK doesn't support ESM? I think it actually does I just need to migrate everything.   migrated some things,
// but import.meta.dirname isn't added till v21, which lambda doesn't support yet.
// Mainly blocked tho b/c the main server / cdk doesn't support ESM.
const fs = require("node:fs");
const path = require("node:path");
// const { fileURLToPath } = require("url");

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toAbsolute = p => path.resolve(__dirname, p);

console.log("prerendering routes");

const template = fs.readFileSync(toAbsolute("dist/static/index.html"), "utf-8");

//Map filesystem paths in pages to URL's
const routesToPrerender = ["/", "/signup", "/verify", "/account", "/authorize"];
console.log("prerendering the following routes:");
routesToPrerender.forEach(r => console.log(`\t${r}`));

(async () => {
  const { render } = await import("./dist/server/entry-server.mjs");
  for (const url of routesToPrerender) {
    const routeContext = {};
    const reactHtml = await render(url, {});

    const pageHtml = template.replace("<!--prerender_content-->", reactHtml);
    const filePath = `dist/static${url === "/" ? "/index" : url}.html`;
    fs.writeFileSync(toAbsolute(filePath), pageHtml);
    console.log("prerendered: ", filePath);
  }
})();
