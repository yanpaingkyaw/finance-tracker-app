let appPromise;

module.exports = async (req, res) => {
  if (!appPromise) {
    appPromise = import("../server/dist/app.js").then((mod) => mod.default || mod.app);
  }

  const app = await appPromise;
  return app(req, res);
};