import crypto from "crypto";

export class CashfreeService {
  private static getHeaders() {
    return {
      "x-client-id": process.env.CASHFREE_APP_ID || "",
      "x-client-secret": process.env.CASHFREE_SECRET_KEY || "",
      "x-api-version": "2025-01-01",
      "Content-Type": "application/json",
    };
  }

  /** Returns true when either server-side or public env var is set to PRODUCTION */
  static isProduction() {
    return (
      process.env.CASHFREE_ENV === "PRODUCTION" ||
      process.env.NEXT_PUBLIC_CASHFREE_ENV === "PRODUCTION"
    );
  }

  private static getBaseUrl() {
    return this.isProduction()
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";
  }

  static async createOrder(data: {
    order_id: string;
    order_amount: number;
    order_currency: string;
    customer_details: {
      customer_id: string;
      customer_email: string;
      customer_phone: string;
      customer_name?: string;
    };
    order_meta: {
      return_url: string;
      notify_url: string;
    };
    order_tags?: Record<string, string>;
  }) {
    const endpoint = `${this.getBaseUrl()}/orders`;
    console.log({
      env: process.env.NEXT_PUBLIC_CASHFREE_ENV,
      endpoint,
      hasAppId: !!process.env.CASHFREE_APP_ID,
      hasSecret: !!process.env.CASHFREE_SECRET_KEY,
    });
    const response = await fetch(endpoint, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cashfree Order Creation Failed: ${errorText}`);
    }

    return response.json();
  }

  static async verifyOrder(orderId: string) {
    const response = await fetch(`${this.getBaseUrl()}/orders/${orderId}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Cashfree Order Verification Failed");
    }

    return response.json();
  }

  static verifyWebhookSignature(payload: string, signature: string, timestamp: string) {
    const secret = process.env.CASHFREE_SECRET_KEY || "";
    const data = timestamp + payload;
    
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(data)
      .digest("base64");

    return expectedSignature === signature;
  }
}
