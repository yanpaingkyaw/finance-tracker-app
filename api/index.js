let appPromise;

module.exports = async (req, res) => {
  if (!appPromise) {
    appPromise = import("../server/dist/app.js").then((mod) => mod.default || mod.app);
  }

  const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  const apiPath = url.searchParams.get("path");

  if (apiPath) {
    url.searchParams.delete("path");
    const qs = url.searchParams.toString();
    req.url = `/${apiPath}${qs ? `?${qs}` : ""}`;
  } else {
    req.url = req.url.replace(/^\/api/, "") || "/";
  }

  const app = await appPromise;
  return app(req, res);
};
