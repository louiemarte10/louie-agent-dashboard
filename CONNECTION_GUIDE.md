# Connection Guide

How to connect this dashboard to your local louieDevAgent bot.

## Prerequisites

- louieDevAgent bot is running on your PC (`npm run dev` or `start-bot.bat`)
- Cloudflare tunnel is running (`start-tunnel.bat` in the louieDevAgent folder)

## First-Time Setup

1. Start the bot on your PC:
   ```
   start-bot.bat
   ```

2. Start the Cloudflare tunnel:
   ```
   start-tunnel.bat
   ```
   A URL like `https://xyz-abc.trycloudflare.com` will appear.

3. Open the dashboard at https://louie-agent-dashboard.vercel.app

4. Go to **Settings** and fill in:
   - **API URL**: paste the tunnel URL from step 2
   - **Dashboard Token**: value of `DASHBOARD_TOKEN` in your `.env`
   - **Chat ID**: your Telegram chat ID (send `/chatid` to the bot)

5. Click **Save Configuration** → **Test Connection**

## Quick Reconnect (After Restart)

Each time you restart the tunnel, Cloudflare generates a new random URL. To update:

1. Run `start-tunnel.bat` on your PC
2. In dashboard Settings, click **Load Tunnel URL** — it auto-fetches the new URL
3. Click **Save Configuration**

## Credentials Reference

All values come from `louieDevAgent/.env` on your PC:

| Field | Source |
|---|---|
| API URL | Cloudflare tunnel URL (from `start-tunnel.bat`) |
| Dashboard Token | `DASHBOARD_TOKEN` in `.env` |
| Chat ID | `ALLOWED_CHAT_ID` in `.env` (or send `/chatid` to the bot) |

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Failed to fetch` | Tunnel not running | Run `start-tunnel.bat` |
| `401 Unauthorized` | Wrong token | Check `DASHBOARD_TOKEN` in `.env` |
| `Load Tunnel URL` returns nothing | `start-tunnel.ps1` not running | Run `start-tunnel.bat` first |
| Connected but no data | Wrong Chat ID | Send `/chatid` to your bot on Telegram |
