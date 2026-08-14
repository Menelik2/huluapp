# Kulu internal QA checklist

Test on a real device or emulator against the **staging/production API**.

## Auth
- [ ] Google sign-in succeeds
- [ ] Customer account → Shop tabs (not admin)
- [ ] `ADMIN_EMAIL` account → Admin portal
- [ ] Sign out clears session; re-open app stays logged out until login
- [ ] Non-admin calling admin API gets 403

## Customer shop
- [ ] Product grid loads; pull-to-refresh works
- [ ] Product detail opens; add to cart
- [ ] Stock limit respected
- [ ] Cart qty +/- ; place order with shipping fields
- [ ] Empty cart cannot submit

## Payments (Chapa test keys first)
- [ ] Orders → Pay opens Chapa checkout
- [ ] After pay, webhook or Verify marks `payment_status=paid`
- [ ] Paid order shows correctly; double-pay blocked

## Orders / admin
- [ ] Admin sees new order (FCM if configured)
- [ ] Status: pending → confirmed → … → delivered
- [ ] Cancel restores stock
- [ ] Cannot move delivered backward (except policy in API)

## Chat
- [ ] Customer messages admin
- [ ] Admin replies; customer sees message (poll or Echo)
- [ ] Customer cannot open another customer’s thread

## Admin catalog
- [ ] Create product with image
- [ ] Edit stock in Inventory
- [ ] Categories add/delete
- [ ] Analytics / overview numbers look sane

## Release build
- [ ] `bundleRelease` signed with upload key
- [ ] Hermes active (`HermesInternal` not null)
- [ ] Release SHA-1 in Firebase; Google sign-in works on release build
- [ ] No cleartext HTTP to production API

## Rollback
- [ ] Latest `backup_kulu.sh` archive exists
- [ ] `restore_backup.sh` tested on staging
