# Kulu documentation index

| Doc | Purpose |
|-----|---------|
| **GO_LIVE.md** | Production deploy checklist |
| **QA_CHECKLIST.md** | Internal testing before Play release |
| **DEPLOYMENT.md** | cPanel / Firebase / FCM / Echo |
| **STATUS.md** | What’s done in the repo |
| **privacy/** | Privacy policy page for Play |
| **database_sql/** | Schema + SQL dump |
| **KuluMobile_PlayStore/PLAY_STORE.md** | Android Play overview |
| **KuluMobile_PlayStore/SIGNING.md** | Upload keystore + AAB |
| **KuluMobile_PlayStore/HERMES.md** | Hermes engine |
| **KuluMobile_PlayStore/PERFORMANCE.md** | RN performance |
| **KuluMobile_PlayStore/STORE_LISTING.md** | English listing |
| **KuluMobile_PlayStore/STORE_LISTING_AM.md** | Amharic listing |
| **KuluMobile_PlayStore/android/SETUP_NATIVE.md** | Native project merge |
| **cPanel_YegaraHost/scripts/** | backup, restore, Chapa webhook test |
| **web/** | Optional browser shop + admin |

## Roles
- **user** — customer app (Shop, Cart, Orders, Chat)
- **admin** — store owner / seller (full management)

## In-app language
- `src/i18n/` — English + Amharic strings, persisted language choice
- Toggle on Login, Shop home, Admin dashboard

## Seller reports
- API: `GET /api/admin/reports`
- App: Admin → Reports (revenue, units, top products, low stock, 30-day sales)
