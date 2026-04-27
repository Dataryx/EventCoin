# EventCoin DApp - Run Guide

This README explains exactly how to run this project with Ganache + Truffle, and what to replace in `.env`.

## 1) Prerequisites

- Node.js 18+ (recommended)
- npm
- Ganache (GUI or CLI)
- MetaMask extension

## 2) Install dependencies

From project root:

```bash
npm install
```

## 3) Start Ganache

Start Ganache and keep it running.

Use these values:

- RPC URL: `http://127.0.0.1:7545`
- Network ID / Chain ID: use Ganache default local chain (project accepts local IDs)
- Keep at least 1 unlocked account with test ETH

## 4) Update `.env` (what to replace)

Open `.env` and set:

```env
MNEMONIC="YOUR_GANACHE_MNEMONIC_IF_NEEDED"
INFURA_ENDPOINT="http://127.0.0.1:7545"
NEXT_PUBLIC_RPC_URL="http://127.0.0.1:7545"
NEXT_PUBLIC_DIAMOND_ADDRESS=""
```

Notes:

- `NEXT_PUBLIC_DIAMOND_ADDRESS` can be blank before migration.
- Migration script auto-updates `NEXT_PUBLIC_DIAMOND_ADDRESS` after deploy.
- If you already have an old address there, migration will replace it.

## 5) Compile contracts (Truffle)

```bash
npm run compile
```

## 6) Deploy contracts to Ganache (Truffle)

Use reset migration to redeploy everything cleanly:

```bash
npm run migrate:reset
```

This deploys Diamond + facets and writes the new deployed Diamond address into `.env`.

## 7) Run frontend

```bash
npm run dev
```

Open:

- [http://localhost:3000](http://localhost:3000)

## 8) Connect MetaMask correctly

In MetaMask:

- Add/select network with RPC: `http://127.0.0.1:7545`
- Use/import one of Ganache accounts
- Ensure MetaMask network matches Ganache currently running

If MetaMask is on another network, transactions will fail/revert.

## 9) If you change contracts again

Whenever you modify Solidity (function signatures, event fields, facets), run:

```bash
npm run compile
npm run migrate:reset
```

Then restart frontend:

```bash
npm run dev
```

## 10) Common issues

- `VM Exception while processing transaction: revert`
  - Usually wrong network/address mismatch or facet signature mismatch.
  - Fix: run `npm run migrate:reset`, confirm MetaMask on Ganache.

- `exceeds block gas limit`
  - Ticket supply too high for constructor loop.
  - Try lower `ticketSupply` (for example 50-200).

