const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.url === "/") {
    res.end(JSON.stringify({
      success: true,
      app: "شێوران خودرو",
      server: "online"
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
