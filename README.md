# salxmm1-bot

A Twitch chat bot for **salxmm1**, built with Node.js and Twurple.

## Commands

| Command | What it does |
| --- | --- |
| `!bucky` | Replies exactly: `ARMED AND DANGEROUS` |
| `!shoot <username>` | Posts the roleplay message, then times out the person who ran the command for 60 seconds. The named target is not timed out. |
| `!lurk` / `!unlurk` | Lurk and return messages |
| `!hug <username>` | Sends a friendly hug |
| `!coinflip` | Flips a coin |
| `!8ball <question>` | Gives a random answer |
| `!help` | Lists commands |

## Important: the !shoot command uses a real Twitch timeout

The shooting message is fictional roleplay, but the one-minute timeout is a real Twitch moderation action. The person who types `!shoot` is timed out; the named recipient is not. The broadcaster and moderators are exempt. Use this only if the channel owner and community understand and agree to the mechanic.

The bot account must be a moderator in salxmm1's channel and must have the `moderator:manage:banned_users` scope. The bot's user access token also needs `chat:read` and `chat:edit`.

## Setup

1. Install Node.js 20 or newer.
2. Create a Twitch application in the [Twitch Developer Console](https://dev.twitch.tv/console/apps).
3. Create a bot-account user access token with these scopes:
   - `chat:read`
   - `chat:edit`
   - `moderator:manage:banned_users`
4. Copy `.env.example` to `.env` and fill in the values.
5. Add the bot account as a moderator in salxmm1's channel.
6. Install dependencies and start the bot:

   ```sh
   npm install
   npm start
   ```

## Environment variables

- `TWITCH_CLIENT_ID`: Twitch application client ID.
- `TWITCH_ACCESS_TOKEN`: bot account user access token (with or without the `oauth:` prefix).
- `TWITCH_BOT_USER_ID`: numeric Twitch user ID of the bot account.
- `TWITCH_CHANNEL`: channel name, normally `salxmm1`.
- `TWITCH_BROADCASTER_USER_ID`: optional numeric user ID for salxmm1. If omitted, the bot looks it up from the channel name.

## Secrets

Never commit `.env` or a real access token. The repository's `.gitignore` excludes environment files while allowing `.env.example`.
