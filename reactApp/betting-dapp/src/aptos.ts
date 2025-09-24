// aptos.ts — modernized helpers using Wallet Adapter & REST only

import { Types } from "aptos"; // Install aptos SDK: npm i aptos

export type SupportedNetwork = "mainnet" | "testnet" | "devnet" | "local" | "unknown";

const NODE_URLS: Record<SupportedNetwork, string> = {
  mainnet: "https://fullnode.mainnet.aptoslabs.com/v1",
  testnet: "https://fullnode.testnet.aptoslabs.com/v1",
  devnet: "https://fullnode.devnet.aptoslabs.com/v1",
  local: "http://localhost:8080/v1",
  unknown: "https://fullnode.mainnet.aptoslabs.com/v1",
};

// Module info
export const MODULE_ADDRESS = "0x473558faf73c5911531b6514abd4aeb12f6ebc3846a845a9d752fd6884ed65ec";
export const MODULE_NAME = "emotion_signals";
export const MODULE_ID = `${MODULE_ADDRESS}::${MODULE_NAME}`;

// ---------------- Wallet Adapter Types ----------------
export type WalletAPI = {
  connect: () => Promise<{ address: string }>;
  account: () => Promise<{ address: string }>;
  network?: () => Promise<{ name: string }>;
  signAndSubmitTransaction: (opts: { payload: Types.TransactionPayload }) => Promise<{ hash: string }>;
  isConnected?: () => Promise<boolean>;
  disconnect?: () => Promise<void>;
};

declare global {
  interface Window {
    aptos?: WalletAPI;
  }
}

export function getWallet(): WalletAPI | undefined {
  return window.aptos;
}

// ---------------- Network / Node ----------------
export async function getNetwork(): Promise<SupportedNetwork> {
  try {
    const wallet = getWallet();
    const name = (await wallet?.network?.())?.name?.toLowerCase();
    if (name === "mainnet" || name === "testnet" || name === "devnet") return name;
    if (name === "local" || name === "localnet") return "local";
  } catch {}
  return "unknown";
}

export async function getNodeUrl(): Promise<string> {
  try {
    const custom = localStorage.getItem("aptos_rpc_url");
    if (custom && custom.startsWith("http")) return custom;
  } catch {}
  const net = await getNetwork();
  return NODE_URLS[net];
}

// ---------------- REST Helpers ----------------
async function rest<T>(path: string, init?: RequestInit): Promise<T> {
  const base = await getNodeUrl();
  const res = await fetch(`${base}${path}`, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function viewFunction<T = any>(fullFunction: string, args: any[] = [], typeArgs: string[] = []): Promise<T> {
  return rest<T>("/view", {
    method: "POST",
    body: JSON.stringify({ function: fullFunction, arguments: args, type_arguments: typeArgs }),
  });
}

export async function waitForTransaction(hash: string): Promise<void> {
  const base = await getNodeUrl();
  for (;;) {
    const res = await fetch(`${base}/transactions/by_hash/${hash}`);
    if (res.status === 404) {
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }
    const tx = await res.json();
    if (tx && (tx.success === true || tx.type === "user_transaction")) {
      if (tx.success === false) throw new Error(tx.vm_status || "Transaction failed");
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

export function aptToOctas(apt: number): string {
  const OCTAS = 100_000_000;
  return Math.round(apt * OCTAS).toString();
}

// ---------------- On-chain Helpers ----------------
export async function getAccountResource<T = any>(addr: string, resource: string): Promise<T | null> {
  const base = await getNodeUrl();
  const res = await fetch(`${base}/accounts/${addr}/resource/${encodeURIComponent(resource)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch resource ${resource}`);
  const body = await res.json();
  return body?.data as T;
}

export async function getAptosBalanceOctas(addr: string): Promise<number> {
  type CoinStore = { coin: { value: string } };
  const data = await getAccountResource<CoinStore>(addr, `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`);
  return data ? Number(data.coin.value) : 0;
}

// ---------------- Module Queries ----------------
export async function moduleExistsOnCurrentNetwork(): Promise<boolean> {
  const base = await getNodeUrl();
  const res = await fetch(`${base}/accounts/${MODULE_ADDRESS}`);
  if (res.status === 404) return false;
  const mod = await fetch(`${base}/accounts/${MODULE_ADDRESS}/module/${encodeURIComponent(MODULE_NAME)}`);
  return mod.ok;
}

export async function getCurrentSentiment(): Promise<{ score: number; trend: number; lastUpdate: number }> {
  const fn = `${MODULE_ID}::get_current_sentiment`;
  const [score, trend, last] = await viewFunction<any[]>(fn);
  return { score: Number(score), trend: Number(trend), lastUpdate: Number(last) };
}

export async function getTradingSignal(): Promise<{ type: number; confidence: number; generatedAt: number }> {
  const fn = `${MODULE_ID}::get_trading_signal`;
  const [t, c, g] = await viewFunction<any[]>(fn);
  return { type: Number(t), confidence: Number(c), generatedAt: Number(g) };
}

export async function getUserPosition(addr: string): Promise<{ amount: number; direction: number; entrySentiment: number; active: boolean } | null> {
  const fn = `${MODULE_ID}::get_user_position`;
  const res = await viewFunction<any[]>(fn, [addr]);
  if (!res || res.length === 0) return null;
  const [amt, dir, entry, active] = res;
  return { amount: Number(amt), direction: Number(dir), entrySentiment: Number(entry), active: Boolean(active) };
}

export async function getTreasuryBalance(): Promise<number> {
  const fn = `${MODULE_ID}::get_treasury_balance`;
  const [val] = await viewFunction<any[]>(fn);
  return Number(val);
}

export async function interpretSentiment(score: number): Promise<string> {
  const fn = `${MODULE_ID}::interpret_sentiment`;
  const [bytes] = await viewFunction<any[]>(fn, [score]);
  return String.fromCharCode(...(bytes as number[]));
}

// ---------------- Wallet Operations ----------------
export async function connectWallet(): Promise<string> {
  const wallet = getWallet();
  if (!wallet) throw new Error("No wallet found");
  const { address } = await wallet.connect();
  return address;
}

export async function getAccountAddress(): Promise<string | null> {
  const wallet = getWallet();
  if (!wallet) return null;
  try {
    const info = await wallet.account();
    return info?.address ?? null;
  } catch {
    return null;
  }
}

export async function disconnectWallet(): Promise<void> {
  const wallet = getWallet();
  await wallet?.disconnect?.();
}

// ---------------- Transactions ----------------
export async function placeBet(predictedDirection: 0 | 1, amountOctas: string): Promise<string> {
  const wallet = getWallet();
  if (!wallet) throw new Error("No wallet found");

  const payload: Types.TransactionPayload = {
    type: "entry_function_payload",
    function: `${MODULE_ID}::place_sentiment_bet`,
    type_arguments: [],
    arguments: [predictedDirection, amountOctas],
  };
  console.log(payload);
  const { hash } = await wallet.signAndSubmitTransaction({ payload });
  await waitForTransaction(hash);
  return hash;
}

export async function resolveBet(): Promise<string> {
  const wallet = getWallet();
  if (!wallet) throw new Error("No wallet found");

  const payload: Types.TransactionPayload = {
    type: "entry_function_payload",
    function: `${MODULE_ID}::resolve_bet`,
    type_arguments: [],
    arguments: [],
  };

  const { hash } = await wallet.signAndSubmitTransaction({ payload });
  await waitForTransaction(hash);
  return hash;
}

// ---------------- Local Bet Storage ----------------
export type BetRecord = {
  id: string;
  address: string;
  direction: 0 | 1;
  amountOctas: string;
  entrySentiment: number;
  createdAt: number;
  txHash: string;
  status: "active" | "resolved";
  resolvedAt?: number;
  won?: boolean;
  payoutOctas?: string;
};

export type BetsResponse = { bets: BetRecord[] };

function serverBase(): string {
  return typeof location !== "undefined" && location.hostname === "localhost"
    ? "http://localhost:8787"
    : "http://localhost:8787";
}

export async function fetchBets(): Promise<BetsResponse> {
  const res = await fetch(`${serverBase()}/api/bets`);
  if (!res.ok) throw new Error("failed to load bets");
  return res.json();
}

export async function saveBet(bet: BetRecord): Promise<void> {
  const res = await fetch(`${serverBase()}/api/bets`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(bet),
  });
  if (!res.ok) throw new Error("failed to save bet");
}

// ---------------- Sentiment History ----------------
export type SentimentSample = { t: number; score: number; trend: number };
export type SentimentHistoryResponse = { history: SentimentSample[] };

export async function fetchSentimentHistory(): Promise<SentimentHistoryResponse> {
  const res = await fetch(`${serverBase()}/api/sentiment`);
  if (!res.ok) throw new Error("failed to load sentiment");
  return res.json();
}

export async function saveSentimentSample(sample: SentimentSample): Promise<void> {
  const res = await fetch(`${serverBase()}/api/sentiment`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(sample),
  });
  if (!res.ok) throw new Error("failed to save sentiment sample");
}
