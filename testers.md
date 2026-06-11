# Adding Test Users in Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select your project from the top dropdown
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Scroll down to the **Test users** section
5. Click **+ Add users**
6. Enter each student's Gmail address (one per line or comma-separated)
7. Click **Save**

That's it. Students added here will sign in normally without seeing the "unverified app" warning. Limit is **100 test users**.

**Notes:**
- Only Google accounts work — if a student uses a non-Gmail email, it won't work
- If a student isn't on the list, they'll hit the warning but can still click **"Advanced" → "Go to app (unsafe)"** to proceed
- You can add/remove users at any time without redeploying anything
