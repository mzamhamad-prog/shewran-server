export default {
    async fetch(request) {

        const url = new URL(request.url);

        if (url.pathname === "/") {
            return Response.json({
                success: true,
                app: "شێوران خودرو",
                server: "online"
            });
        }

        if (url.pathname === "/api/status") {
            return Response.json({
                success: true,
                app: "شێوران خودرو",
                status: "online"
            });
        }

        if (url.pathname === "/search") {

            const query = (url.searchParams.get("q") || "").trim();

            if (!query) {
                return Response.json({
                    success: false,
                    message: "لطفاً نام خودرو را وارد کنید",
                    products: []
                });
            }

            return Response.json({
                success: true,
                query: query,
                total: 3,
                products: [
                    {
                        title: `${query} - مدل 2024`,
                        price: 0,
                        city: "اربیل",
                        store: "شێوران خودرو"
                    },
                    {
                        title: `${query} - مدل 2023`,
                        price: 0,
                        city: "اربیل",
                        store: "شێوران خودرو"
                    },
                    {
                        title: `${query} - مدل 2022`,
                        price: 0,
                        city: "اربیل",
                        store: "شێوران خودرو"
                    }
                ]
            });
        }

        return Response.json({
            success: false,
            message: "مسیر پیدا نشد"
        }, { status: 404 });
    }
};
