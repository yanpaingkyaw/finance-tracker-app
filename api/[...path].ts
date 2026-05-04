const serverless = require("serverless-http");

let handler;

module.exports = async (req, res) => {
  if (!handler) {
    const mod = await import("../server/dist/app.js");
    const app = mod.default || mod.app;
    handler = serverless(app);
  }

  return handler(req, res);
};