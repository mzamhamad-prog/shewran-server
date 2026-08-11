export default 
  async fetch(request, env) {

    const url = new URL(request.url);

    // صفحه اصلی A
    if (url.pathname === "/" && request.method === "GET") {
      return json({
        success: true,
        app: "شێوران خودرو",
        server: "online",
        database: "connected"
      });
    }

    // وضعیت سرور
    if (url.pathname === "/api/status" && request.method === "GET") {

      try {

        await env.DB
          .prepare("SELECT 1")
          .first();

        return json({
          success: true,
          server: "online",
          database: "connected"
        });

      } catch (error) {

        return json({
          success: false,
          server: "online",
          database: "error",
          message: error.message
        }, 500);
      }
    }

    // جستجوی خودرو فقط داخل شێوران خودرو
    if (url.pathname === "/search" && request.method === "GET") {

      const query =
        (url.searchParams.get("q") || "").trim();

      if (!query) {
        return json({
          success: false,
          message: "عبارت جستجو وارد نشده است"
        }, 400);
      }

      try {

        const search = `%${query}%`;

        const result = await env.DB
          .prepare(`
            SELECT
              id,
              title,
              brand,
              model,
              year,
              price,
              mileage,
              color,
              city,
              description,
              phone,
              image_url,
              created_at
            FROM cars
            WHERE
              title LIKE ?
              OR brand LIKE ?
              OR model LIKE ?
              OR city LIKE ?
            ORDER BY id DESC
            LIMIT 50
          `)
          .bind(
            search,
            search,
            search,
            search
          )
          .all();

        return json({
          success: true,
          query: query,
          total: result.results.length,
          cars: result.results
        });

      } catch (error) {

        return json({
          success: false,
          message: "خطا در جستجوی خودرو",
          error: error.message
        }, 500);
      }
    }

    return new Response(
      "Not Found",
      {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      }
    );
  }
};

function json(data, status = 200) {

  return new Response(
    JSON.stringify(data, null, 2),
    {
      status: status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    }
  );
}
