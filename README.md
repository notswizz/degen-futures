This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Degen Futures

Fantasy futures market for NFL teams. Buy & sell shares, ride the hype, and win the pot if your team takes the Super Bowl. Powered by a live bonding curve with 2% fee on every trade going to the winner!

## Getting Started

First, make sure you have your environment variables set up in a `.env.local` file:

```
# OpenAI API Key
OPENAI_API_KEY=sk-your_openai_api_key_here

# MongoDB URI (if using the full app with database)
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/your-database

# JWT Secret (for authentication)
JWT_SECRET=your_jwt_secret_key_here
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Bonding Curve Mechanism**: Prices are determined by a polynomial bonding curve formula
- **Real-time Trading**: Buy and sell shares of NFL teams
- **Prize Pot**: 2% fee on all transactions goes to the pot
- **Winner Distribution**: After the Super Bowl, pot is distributed to holders of the winning team
- **Chatbot Assistant**: Built-in AI chatbot that explains how the game works

## How It Works

1. **Register/Login**: Create an account to start trading
2. **Market**: Browse available teams and their current prices
3. **Portfolio**: Track your holdings and their current value
4. **History**: View your transaction history
5. **Prize Pot**: See the current pot value

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
