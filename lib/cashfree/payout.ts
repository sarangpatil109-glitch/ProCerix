// Cashfree Payout API v1
// Docs: https://docs.cashfree.com/docs/payout-api
// Credentials: CASHFREE_APP_ID / CASHFREE_SECRET_KEY (same Cashfree account as PG)

const SANDBOX_BASE = "https://payout-gamma.cashfree.com";
const PROD_BASE    = "https://payout-api.cashfree.com";

function baseUrl() {
  const isProd =
    process.env.CASHFREE_ENV === "PRODUCTION" ||
    process.env.NEXT_PUBLIC_CASHFREE_ENV === "PRODUCTION";
  return isProd ? PROD_BASE : SANDBOX_BASE;
}

async function getToken(): Promise<string> {
  const res = await fetch(`${baseUrl()}/payout/v1/authorize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appId: process.env.CASHFREE_APP_ID,
      secretKey: process.env.CASHFREE_SECRET_KEY,
    }),
  });

  const data = await res.json();
  if (data.subCode !== "200" || !data.data?.token) {
    throw new Error(`Cashfree Payout auth failed: ${data.message ?? JSON.stringify(data)}`);
  }
  return data.data.token as string;
}

export interface BeneficiaryInput {
  beneId: string;      // unique identifier (max 50 alphanumeric chars)
  name: string;
  email: string;
  phone: string;       // 10-digit mobile number
  bankAccount: string;
  ifsc: string;
  address1?: string;
}

export async function createBeneficiary(input: BeneficiaryInput) {
  const token = await getToken();

  const res = await fetch(`${baseUrl()}/payout/v1/addBeneficiary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      beneId: input.beneId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      bankAccount: input.bankAccount,
      ifsc: input.ifsc,
      address1: input.address1 ?? "India",
    }),
  });

  const data = await res.json();
  // subCode 409 = beneficiary already exists — treat as success
  if (data.subCode !== "200" && data.subCode !== "409") {
    throw new Error(`Cashfree addBeneficiary failed: ${data.message ?? JSON.stringify(data)}`);
  }
  return data;
}

export async function verifyBeneficiary(beneId: string) {
  const token = await getToken();

  const res = await fetch(`${baseUrl()}/payout/v1/getBeneficiary/${encodeURIComponent(beneId)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.json();
}

export interface TransferInput {
  beneId: string;
  amount: number;
  transferId: string;  // globally unique reference (max 50 chars)
  remarks?: string;
}

export async function transfer(input: TransferInput) {
  const token = await getToken();

  const res = await fetch(`${baseUrl()}/payout/v1/requestTransfer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      beneId: input.beneId,
      amount: input.amount.toFixed(2),
      transferId: input.transferId,
      transferMode: "banktransfer",
      remarks: input.remarks ?? "Weekly affiliate payout - ProCerix",
    }),
  });

  const data = await res.json();
  if (data.subCode !== "200") {
    throw new Error(`Cashfree transfer failed: ${data.message ?? JSON.stringify(data)}`);
  }
  return data;
}

export async function getTransferStatus(transferId: string) {
  const token = await getToken();

  const res = await fetch(
    `${baseUrl()}/payout/v1/getTransferStatus?transferId=${encodeURIComponent(transferId)}`,
    { method: "GET", headers: { Authorization: `Bearer ${token}` } }
  );

  return res.json();
}

/** Derive a stable, Cashfree-safe beneId from an affiliate profile UUID */
export function affiliateBeneId(affiliateProfileId: string): string {
  return `AFFL${affiliateProfileId.replace(/-/g, "")}`.slice(0, 50);
}
