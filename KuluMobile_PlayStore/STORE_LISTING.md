# Google Play store listing — Kulu

## App identity
| Field | Value |
|-------|--------|
| App name | Kulu Online Shopping |
| Package / applicationId | `com.kulu.mobile` |
| Default language | English (add Amharic later if needed) |
| Category | Shopping |
| Tags | ecommerce, ethiopia, marketplace, shopping |

## Text assets (required sizes)

| Asset | Size | Notes |
|-------|------|--------|
| **App icon** | 512 × 512 px | 32-bit PNG, no alpha for high-res icon upload |
| **Feature graphic** | 1024 × 500 px | Top of store listing |
| **Phone screenshots** | min 2, up to 8 | 16:9 or 9:16; min short side 320px, max long side 3840px |
| **Tablet** (optional) | 7" and 10" | Recommended for better ranking |

Suggested screenshot set:
1. Shop grid  
2. Product detail  
3. Cart / checkout  
4. Orders + Chapa pay  
5. Support chat  
6. (Admin only — optional, or skip for public listing)

## Short description (≤ 80 characters)
```
Ethiopian online shopping — browse, order, pay & chat with the store.
```

## Full description (sample)
```
Kulu is an online shopping app for Ethiopia.

• Browse products with photos and prices in ETB
• Add to cart and place orders with delivery details
• Pay securely with Chapa (Telebirr, cards, banks)
• Track order status
• Chat with the store for support

Sign in with Google to get started.

Store owners use the same app with an admin account to manage products, stock, and orders.
```

## Privacy policy
Play requires a privacy policy URL. Host a page covering:
- Google account email/name for login
- Order and shipping data
- FCM device token for notifications
- Payment handled by Chapa (no full card data stored on Kulu servers)

Example path: `https://your-domain.com/privacy`

## Data safety form (Play Console)
Declare roughly:
- Collected: email, name, user IDs, purchase history, device IDs (FCM)
- Shared: payment provider (Chapa) as needed to complete payment
- Security: data encrypted in transit (HTTPS)

## Content rating
Complete the IARC questionnaire (Shopping / no violence).

## Contact
- Email: support@your-domain.com  
- Phone: optional  

## Before submit checklist
- [ ] `versionCode` / `versionName` set
- [ ] Signed AAB (`bundleRelease`)
- [ ] Firebase + API production URLs
- [ ] Privacy policy URL live
- [ ] Icon + feature graphic + ≥2 screenshots
- [x] Target API level meets Play requirements — targets Android 16 (API 36), required for new app submissions from Aug 31, 2026 (see android/build.gradle)


## Amharic listing
See **STORE_LISTING_AM.md** for አማርኛ short/full descriptions.


---

## Amharic short description (copy into Play Console)
```
የኢትዮጵያ ኦንላይን ግዢ — ይመልከቱ፣ ይዘዙ፣ ይክፈሉ፣ ከመደብሩ ይወያዩ።
```

## Amharic full description
```
ኩሉ ለኢትዮጵያ የተዘጋጀ የኦንላይን ግዢ መተግበሪያ ነው።

• ምርቶችን በፎቶ እና በብር (ETB) ዋጋ ይመልከቱ
• ወደ ጋሪ ያክሉ እና የመላኪያ መረጃ በመሙላት ትዕዛዝ ያስገቡ
• በChapa በደህንነት ይክፈሉ (ቴሌብር፣ ካርድ፣ ባንክ)
• የትዕዛዝ ሁኔታ ይከታተሉ
• ከመደብሩ ጋር በመልእክት ይደርሱ

ለመጀመር በGoogle ይግቡ።

የመደብር ባለቤቶች በተመሳሳይ መተግበሪያ በአስተዳዳሪ መለያ ምርት፣ ክምችት እና ትዕዛዞችን ያስተዳድራሉ።
```
