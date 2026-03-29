"use client";

import {
  Contract,
  Networks,
  TransactionBuilder,
  Keypair,
  xdr,
  nativeToScVal,
  scValToNative,
  rpc,
} from "@stellar/stellar-sdk";
import {
  isConnected,
  getAddress,
  signTransaction,
  setAllowed,
  isAllowed,
  requestAccess,
} from "@stellar/freighter-api";

// ============================================================
// CONSTANTS
// ============================================================

/** Deployed NFT Mystery Box contract ID */
export const CONTRACT_ADDRESS =
  "CAMRESPDOECQDKX262Q4VZPAIP4ZRVYKG4I3J3VVXJSUBSIPTMEDC7JJ";

/** Network passphrase (testnet) */
export const NETWORK_PASSPHRASE = Networks.TESTNET;

/** Soroban RPC URL */
export const RPC_URL = "https://soroban-testnet.stellar.org";

/** Network name for Freighter */
export const NETWORK = "TESTNET";

// ============================================================
// RPC Server Instance
// ============================================================

const server = new rpc.Server(RPC_URL);

// ============================================================
// Types
// ============================================================

export interface MysteryBox {
  box_id: number;
  owner: string;
  rarity: string;
  is_opened: boolean;
  created_at: number;
  opened_at: number;
}

export interface PlatformStats {
  total_boxes: number;
  opened_boxes: number;
  unopened_boxes: number;
}

// ============================================================
// Wallet Helpers
// ============================================================

export async function checkConnection(): Promise<boolean> {
  const result = await isConnected();
  return result.isConnected;
}

export async function connectWallet(): Promise<string> {
  const connResult = await isConnected();
  if (!connResult.isConnected) {
    throw new Error("Freighter extension is not installed or not available.");
  }

  const allowedResult = await isAllowed();
  if (!allowedResult.isAllowed) {
    await setAllowed();
    await requestAccess();
  }

  const { address } = await getAddress();
  if (!address) {
    throw new Error("Could not retrieve wallet address from Freighter.");
  }
  return address;
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const connResult = await isConnected();
    if (!connResult.isConnected) return null;

    const allowedResult = await isAllowed();
    if (!allowedResult.isAllowed) return null;

    const { address } = await getAddress();
    return address || null;
  } catch {
    return null;
  }
}

// ============================================================
// Contract Interaction Helpers
// ============================================================

export async function callContract(
  method: string,
  params: xdr.ScVal[] = [],
  caller: string,
  sign: boolean = true
) {
  const contract = new Contract(CONTRACT_ADDRESS);
  const account = await server.getAccount(caller);

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...params))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simulated)) {
    const errorMsg = (simulated as rpc.Api.SimulateTransactionErrorResponse).error || "Unknown simulation error";
    throw new Error(`Simulation failed: ${errorMsg}`);
  }

  if (!sign) {
    return simulated;
  }

  const prepared = rpc.assembleTransaction(tx, simulated).build();

  const { signedTxXdr } = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const txToSubmit = TransactionBuilder.fromXDR(
    signedTxXdr,
    NETWORK_PASSPHRASE
  );

  const result = await server.sendTransaction(txToSubmit);

  if (result.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${result.status}`);
  }

  // Poll for confirmation
  let getResult = await server.getTransaction(result.hash);
  while (getResult.status === "NOT_FOUND") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    getResult = await server.getTransaction(result.hash);
  }

  if (getResult.status === "FAILED") {
    let detail = "";
    try {
      if (getResult.resultXdr) {
        detail = ` (Result XDR: ${getResult.resultXdr})`;
      }
    } catch {
      // ignore
    }
    throw new Error(`Transaction failed: ${getResult.status}${detail}`);
  }

  return getResult;
}

export async function readContract(
  method: string,
  params: xdr.ScVal[] = [],
  caller?: string
) {
  const account =
    caller || Keypair.random().publicKey();
  const sim = await callContract(method, params, account, false);
  if (
    rpc.Api.isSimulationSuccess(sim as rpc.Api.SimulateTransactionResponse) &&
    (sim as rpc.Api.SimulateTransactionSuccessResponse).result
  ) {
    return scValToNative(
      (sim as rpc.Api.SimulateTransactionSuccessResponse).result!.retval
    );
  }
  return null;
}

// ============================================================
// ScVal Conversion Helpers
// ============================================================

export function toScValString(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: "string" });
}

export function toScValU64(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: "u64" });
}

// ============================================================
// NFT Mystery Box — Contract Methods
// ============================================================

/**
 * Create a new mystery box.
 * Calls: create_box(owner: String) -> u64
 */
export async function createBox(caller: string, owner: string) {
  const result = await callContract(
    "create_box",
    [toScValString(owner)],
    caller,
    true
  );
  return result;
}

/**
 * Open (reveal) a mystery box.
 * Calls: open_box(box_id: u64) -> MysteryBox
 */
export async function openBox(caller: string, boxId: number) {
  const result = await callContract(
    "open_box",
    [toScValU64(boxId)],
    caller,
    true
  );
  return result;
}

/**
 * View a mystery box (read-only).
 * Calls: view_box(box_id: u64) -> MysteryBox
 */
export async function viewBox(boxId: number, caller?: string): Promise<MysteryBox | null> {
  const result = await readContract(
    "view_box",
    [toScValU64(boxId)],
    caller
  );
  if (result && typeof result === "object") {
    return parseMysteryBox(result);
  }
  return null;
}

/**
 * View platform stats (read-only).
 * Calls: view_platform_stats() -> PlatformStats
 */
export async function viewPlatformStats(caller?: string): Promise<PlatformStats | null> {
  const result = await readContract(
    "view_platform_stats",
    [],
    caller
  );
  if (result && typeof result === "object") {
    return {
      total_boxes: Number(result.total_boxes ?? 0),
      opened_boxes: Number(result.opened_boxes ?? 0),
      unopened_boxes: Number(result.unopened_boxes ?? 0),
    };
  }
  return null;
}

// ============================================================
// Parsing Helpers
// ============================================================

function parseMysteryBox(raw: Record<string, unknown>): MysteryBox {
  // Rarity from Soroban is returned as an enum variant
  let rarity = "Common";
  const rawRarity = raw.rarity;
  if (typeof rawRarity === "string") {
    rarity = rawRarity;
  } else if (Array.isArray(rawRarity)) {
    rarity = String(rawRarity[0] ?? "Common");
  } else if (rawRarity && typeof rawRarity === "object") {
    // Handle enum object representation
    const keys = Object.keys(rawRarity);
    if (keys.length > 0) rarity = keys[0];
  }

  return {
    box_id: Number(raw.box_id ?? 0),
    owner: String(raw.owner ?? "Unknown"),
    rarity,
    is_opened: Boolean(raw.is_opened),
    created_at: Number(raw.created_at ?? 0),
    opened_at: Number(raw.opened_at ?? 0),
  };
}

export { nativeToScVal, scValToNative, xdr };
