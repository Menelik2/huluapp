# Firebase Service Account

Upload your Firebase service account JSON file here.

## How to get it

1. Go to [Firebase Console → kuluapps → Project Settings → Service Accounts](https://console.firebase.google.com/project/kuluapps/settings/serviceaccounts)
2. Click **"Generate new private key"**
3. Rename the downloaded JSON to:
   ```
   kuluapps-firebase-adminsdk.json
   ```
4. Upload it to this folder

## Important

- Never commit this file to GitHub (it's already in .gitignore)
- Keep it secure — it has full admin access to your Firebase project
- The path in .env should match:
  ```
  FIREBASE_CREDENTIALS=/home/vol14_8/infinityfree.com/if0_42274082/htdocs/storage/firebase/kuluapps-firebase-adminsdk.json
  ```
