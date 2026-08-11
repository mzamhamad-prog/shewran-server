const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.url === "/") {
    res.end(JSON.stringify({
      success: true,
      app: "شێوران خودرو",
      server: "online"
    }));
    return;
  }

  if (req.url === "/api/status") {
    res.end(JSON.stringify({
      success: true,
      app: "شێوران خودرو",
      status: "online"
    }));
    return;
  }

  if (req.url.startsWith("/search")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const q = url.searchParams.get("q") || "";

    res.end(JSON.stringify({
      success: true,
      query: q,
      total: 1,
      products: [
        {
          title: q ? q + " - خودرو" : "خودرو",
          city: "اربیل",
          store: "شێوران خودرو"
        }
      ]
    }));
    return;
  }

  res.statusCode = 404;

  res.end(JSON.stringify({
    success: false,
    message: "Not Found"
  }));
});

server.listen(PORT, () => {
  console.log("Shewran server running on port " + PORT);
});
