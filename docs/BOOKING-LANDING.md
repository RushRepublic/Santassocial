# Direct booking landing page and shared public QR

`/` now renders the existing registration screen immediately using the same `Register` component, public header, demo indicator and footer as the former `/register` screen. `/register` is a permanent redirect to `/`. Change-mobile, edit-booking and new-booking links target `/` directly. The promotional homepage component was removed and its experience/gallery navigation links were removed. No registration CSS, field markup, typography, images or database/admission code was redesigned.

## Verification

- Captured the old `/register` registration content before editing, then compared it to `/` after editing. Screenshots of `.booking-page` were byte-for-byte identical at **1440px and 390px** viewport widths. Evidence: `booking-landing-before-1440.png`, `booking-landing-after-1440.png`, `booking-landing-before-390.png`, `booking-landing-after-390.png` in this directory.
- Root page has the booking form and no promotional hero. Legacy `/register` reaches `/` directly. Mobile horizontal overflow checks pass.
- `npm run check` validates authored JavaScript/JSX; `npm test` exercises the existing 11 backend workflow scenarios. Browser regression starts at `/` and covers demo OTP, checkout, group QR/PDF, admin login, scanner entry and duplicate rejection.
- Final results: JavaScript checks passed for 30 authored files; all 11 backend tests passed; the production build passed; the full browser journey passed against an isolated production server. Initial browser attempts against the pre-existing development server were interrupted by repeated page reloads, so the final end-to-end verification used the production build instead.
- Existing SQL structure, OTP provider behavior, Razorpay verification, cash approval, free booking policy and unique admission QR logic are unchanged. Live provider credentials, MySQL staging, and physical-camera validation remain existing external limitations.

## Public registration QR status

**Intentionally deferred during local development at the owner's request; not a development blocker.** The registration system has not been deployed yet. Project configuration has no public deployment URL: the existing origin is localhost and Nginx contains a sample domain. The reference marketing domain is not assumed to deploy this registration application. `config/public-registration.json` therefore has a null `bookingUrl` and no final public registration PNG/SVG has been generated or decoded. Continue local registration, payment and admission-ticket development without requiring this URL.

After the owner supplies the actual deployed root HTTPS booking URL, save it in that configuration and run `npm run qr:registration`. The generator checks a public hostname, HTTPS reachability and the deployed form, then produces one shared public QR in PNG/SVG formats. It independently decodes both images before saving final assets and verification metadata to `artifacts/public-registration-qr/`.

The public code opens registration for everyone. It is never used for admission and never contains an admission token. Each approved booking continues to receive its own secure group admission QR.

For repeat visual comparisons, capture the baseline before editing with `node scripts/check-booking-layout.js --baseline`, keep the demo availability/data unchanged, then run the script without that flag after the change. Dynamic availability or changed demo bookings can alter screenshots even when layout is identical.
