export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // -----------------------------
    // CORS / OPTIONS
    // -----------------------------
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    // -----------------------------
    // صفحه اصلی API
    // -----------------------------
    if (url.pathname === "/" && request.method === "GET") {
      return json({
        success: true,
        app: "شێوران خودرو",
        server: "online",
        database: "connected"
      });
    }

    // -----------------------------
    // وضعیت سرور و دیتابیس
    // -----------------------------
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

    // -----------------------------
    // جستجوی خودرو
    // فقط داخل دیتابیس شێوران خودرو
    // -----------------------------
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
              trim,
              year,
              price,
              mileage,
              color,
              city,
              transmission,
              fuel,
              engine_status,
              gearbox_status,
              chassis_status,
              body_status,
              interior_status,
              document_status,
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

    // -----------------------------
    // ثبت آگهی جدید
    // -----------------------------
    if (url.pathname === "/cars" && request.method === "POST") {

      try {

        const data = await request.json();

        const title =
          String(data.title || "").trim();

        const brand =
          String(data.brand || "").trim();

        const model =
          String(data.model || "").trim();

        const city =
          String(data.city || "").trim();

        const phone =
          String(data.phone || "").trim();

        if (!title || !brand || !model || !city || !phone) {

          return json({
            success: false,
            message:
              "عنوان، برند، مدل، شهر و شماره تماس الزامی است"
          }, 400);
        }

        const result = await env.DB
          .prepare(`
            INSERT INTO cars (
              title,
              brand,
              model,
              trim,
              year,
              price,
              mileage,
              color,
              city,
              transmission,
              fuel,
              engine_status,
              gearbox_status,
              chassis_status,
              body_status,
              interior_status,
              document_status,
              description,
              phone,
              image_url
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            title,
            brand,
            model,
            String(data.trim || "").trim(),
            numberOrNull(data.year),
            numberOrNull(data.price),
            numberOrNull(data.mileage),
            String(data.color || "").trim(),
            city,
            String(data.transmission || "").trim(),
            String(data.fuel || "").trim(),
            String(data.engine_status || "").trim(),
            String(data.gearbox_status || "").trim(),
            String(data.chassis_status || "").trim(),
            String(data.body_status || "").trim(),
            String(data.interior_status || "").trim(),
            String(data.document_status || "").trim(),
            String(data.description || "").trim(),
            phone,
            String(data.image_url || "").trim()
          )
          .run();

        return json({
          success: true,
          message: "آگهی با موفقیت ثبت شد",
          id: result.meta.last_row_id
        }, 201);

      } catch (error) {

        return json({
          success: false,
          message: "ثبت آگهی انجام نشد",
          error: error.message
        }, 500);
      }
    }

    // -----------------------------
    // دریافت یک آگهی با ID
    // -----------------------------
    if (url.pathname.startsWith("/cars/") &&
        request.method === "GET") {

      const id =
        url.pathname.split("/")[2];

      if (!id) {
        return json({
          success: false,
          message: "شناسه خودرو وارد نشده است"
        }, 400);
      }

      try {

        const car = await env.DB
          .prepare(`
            SELECT *
            FROM cars
            WHERE id = ?
          `)
          .bind(id)
          .first();

        if (!car) {

          return json({
            success: false,
            message: "آگهی پیدا نشد"
          }, 404);
        }

        return json({
          success: true,
          car: car
        });

      } catch (error) {

        return json({
          success: false,
          message: "خطا در دریافت آگهی",
          error: error.message
        }, 500);
      }
    }

    // -----------------------------
    // مسیر پیدا نشد
    // -----------------------------
    return new Response(
      "Not Found",
      {
        status: 404,
        headers: {
          ...corsHeaders(),
          "Content-Type":
            "text/plain; charset=utf-8"
        }
      }
    );
  }
};


// -----------------------------
// تبدیل عدد
// -----------------------------
function numberOrNull(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


// -----------------------------
// CORS
// -----------------------------
function corsHeaders() {

  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type"
  };
}


// -----------------------------
// JSON Response
// -----------------------------
function json(data, status = 200) {

  return new Response(
    JSON.stringify(data, null, 2),
    {
      status: status,
      headers: {
        ...corsHeaders(),
        "Content-Type":
          "application/json; charset=utf-8"
      }
    }
  );
}
