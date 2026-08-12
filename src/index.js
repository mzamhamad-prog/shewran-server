export default {
  async fetch(request, env) {

    // -----------------------------
    // CORS / OPTIONS
    // -----------------------------

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    const url = new URL(request.url);

    // -----------------------------
    // صفحه اصلی
    // -----------------------------

    if (
      url.pathname === "/" &&
      request.method === "GET"
    ) {

      return json({
        success: true,
        app: "شێوران خودرو",
        server: "online",
        database: "connected"
      });
    }

    // -----------------------------
    // وضعیت سرور
    // -----------------------------

    if (
      url.pathname === "/api/status" &&
      request.method === "GET"
    ) {

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
    // ثبت نام
    // -----------------------------

    if (
      url.pathname === "/register" &&
      request.method === "POST"
    ) {

      try {

        const body = await request.json();

        const name =
          String(body.name || "").trim();

        const phone =
          String(body.phone || "").trim();

        const password =
          String(body.password || "");

        const city =
          String(body.city || "").trim();

        if (
          !name ||
          !phone ||
          !password
        ) {

          return json({
            success: false,
            message:
              "نام، شماره موبایل و رمز عبور الزامی است"
          }, 400);
        }

        if (password.length < 6) {

          return json({
            success: false,
            message:
              "رمز عبور باید حداقل ۶ کاراکتر باشد"
          }, 400);
        }

        // بررسی وجود شماره
        const existing =
          await env.DB
            .prepare(
              "SELECT id FROM users WHERE phone = ?"
            )
            .bind(phone)
            .first();

        if (existing) {

          return json({
            success: false,
            message:
              "این شماره موبایل قبلاً ثبت شده است"
          }, 409);
        }

        // هش رمز عبور
        const passwordHash =
          await hashPassword(password);

        const result =
          await env.DB
            .prepare(`
              INSERT INTO users
              (
                name,
                phone,
                password_hash,
                city
              )
              VALUES (?, ?, ?, ?)
            `)
            .bind(
              name,
              phone,
              passwordHash,
              city
            )
            .run();

        return json({
          success: true,
          message:
            "ثبت نام با موفقیت انجام شد",
          user: {
            id: result.meta.last_row_id,
            name: name,
            phone: phone,
            city: city
          }
        });

      } catch (error) {

        return json({
          success: false,
          message:
            "خطا در ثبت نام",
          error: error.message
        }, 500);
      }
    }

    // -----------------------------
    // ورود
    // -----------------------------

    if (
      url.pathname === "/login" &&
      request.method === "POST"
    ) {

      try {

        const body = await request.json();

        const phone =
          String(body.phone || "").trim();

        const password =
          String(body.password || "");

        if (
          !phone ||
          !password
        ) {

          return json({
            success: false,
            message:
              "شماره موبایل و رمز عبور را وارد کنید"
          }, 400);
        }

        const user =
          await env.DB
            .prepare(`
              SELECT
                id,
                name,
                phone,
                password_hash,
                city
              FROM users
              WHERE phone = ?
              LIMIT 1
            `)
            .bind(phone)
            .first();

        if (!user) {

          return json({
            success: false,
            message:
              "شماره موبایل یا رمز عبور اشتباه است"
          }, 401);
        }

        const passwordHash =
          await hashPassword(password);

        if (
          passwordHash !==
          user.password_hash
        ) {

          return json({
            success: false,
            message:
              "شماره موبایل یا رمز عبور اشتباه است"
          }, 401);
        }

        return json({
          success: true,
          message:
            "ورود با موفقیت انجام شد",
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            city: user.city
          }
        });

      } catch (error) {

        return json({
          success: false,
          message:
            "خطا در ورود",
          error: error.message
        }, 500);
      }
    }

    // -----------------------------
    // جستجوی خودرو
    // فقط داخل شێوران خودرو
    // -----------------------------

    if (
      url.pathname === "/search" &&
      request.method === "GET"
    ) {

      const query =
        (
          url.searchParams.get("q") ||
          ""
        ).trim();

      if (!query) {

        return json({
          success: false,
          message:
            "عبارت جستجو وارد نشده است"
        }, 400);
      }

      try {

        const search =
          `%${query}%`;

        const result =
          await env.DB
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
          total:
            result.results.length,
          cars:
            result.results
        });

      } catch (error) {

        return json({
          success: false,
          message:
            "خطا در جستجوی خودرو",
          error:
            error.message
        }, 500);
      }
    }

    // -----------------------------
    // ثبت آگهی خودرو
    // -----------------------------

    if (
      url.pathname === "/cars" &&
      request.method === "POST"
    ) {

      try {

        const body =
          await request.json();

        const title =
          String(body.title || "").trim();

        const brand =
          String(body.brand || "").trim();

        const model =
          String(body.model || "").trim();

        const city =
          String(body.city || "").trim();

        const phone =
          String(body.phone || "").trim();

        if (
          !title ||
          !brand ||
          !model ||
          !city ||
          !phone
        ) {

          return json({
            success: false,
            message:
              "اطلاعات اصلی آگهی کامل نیست"
          }, 400);
        }

        const result =
          await env.DB
            .prepare(`
              INSERT INTO cars
              (
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
                image_url
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
              title,
              brand,
              model,
              numberValue(body.year),
              numberValue(body.price),
              numberValue(body.mileage),
              String(body.color || ""),
              city,
              String(body.description || ""),
              phone,
              String(body.image_url || "")
            )
            .run();

        return json({
          success: true,
          message:
            "آگهی با موفقیت ثبت شد",
          car_id:
            result.meta.last_row_id
        });

      } catch (error) {

        return json({
          success: false,
          message:
            "خطا در ثبت آگهی",
          error:
            error.message
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


// =================================================
// توابع کمکی
// =================================================

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

function json(
  data,
  status = 200
) {

  return new Response(
    JSON.stringify(
      data,
      null,
      2
    ),
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


// -----------------------------
// تبدیل عدد
// -----------------------------

function numberValue(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return null;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {

    return null;
  }

  return number;
}


// -----------------------------
// SHA-256 برای رمز عبور
// -----------------------------

async function hashPassword(
  password
) {

  const data =
    new TextEncoder()
      .encode(password);

  const hash =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return Array
    .from(
      new Uint8Array(hash)
    )
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}
