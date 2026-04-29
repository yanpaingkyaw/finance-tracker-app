let appPromise;

module.exports = async (req, res) => {
  if (!appPromise) {
    appPromise = import("../server/src/app.js").then((mod) => mod.default || mod.app);
  }

  req.url = req.url.replace(/^\/api/, "");

  const app = await appPromise;
  return app(req, res);
};