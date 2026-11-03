export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/scanner",
        "/ticket",
        "/booking-success",
        "/booking-pending",
        "/checkout",
        "/verify-otp",
        "/api",
      ],
    },
  };
}
