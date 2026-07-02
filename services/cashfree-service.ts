import crypto from "crypto";

export class CashfreeService {
  private static getHeaders() {
    return {
      "x-client-id": process.env.CASHFREE_APP_ID || "",
      "x-client-secret": process.env.CASHFREE_SECRET_KEY || "",
      "x-api-version": "2023-08-01",
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

    // Normalize phone — Cashfree requires exactly 10 digits (no +91 prefix)
    const rawPhone = data.customer_details.customer_phone ?? "";
    const phone = rawPhone.replace(/\D/g, "").replace(/^91/, "").slice(0, 10).padEnd(10, "9");

    const payload = {
      order_id: data.order_id,
      order_amount: Number(data.order_amount.toFixed(2)),
      order_currency: data.order_currency,
      customer_details: {
        customer_id: data.customer_details.customer_id.slice(0, 50),
        customer_email: data.customer_details.customer_email,
        customer_phone: phone || "9999999999",
        ...(data.customer_details.customer_name
          ? { customer_name: data.customer_details.customer_name }
          : {}),
      },
      order_meta: {
        return_url: data.order_meta.return_url,
        notify_url: data.order_meta.notify_url,
      },
      ...(data.order_tags ? { order_tags: data.order_tags } : {}),
    };

    console.log("[cashfree] createOrder →", {
      env: process.env.NEXT_PUBLIC_CASHFREE_ENV,
      cashfree_env: process.env.CASHFREE_ENV,
      isProduction: this.isProduction(),
      endpoint,
      hasAppId: !!process.env.CASHFREE_APP_ID,
      hasSecret: !!process.env.CASHFREE_SECRET_KEY,
      apiVersion: "2023-08-01",
      payload,
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    const responseBody = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => { responseHeaders[key] = value; });

    console.log("[cashfree] response ←", {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
    });

    if (!response.ok) {
      throw new Error(
        `Cashfree Order Creation Failed [HTTP ${response.status}]: ${responseBody}`,
      );
    }

    try {
      return JSON.parse(responseBody);
    } catch {
      throw new Error(`Cashfree returned non-JSON: ${responseBody}`);
    }
  }

  static async verifyOrder(orderId: string) {
    const endpoint = `${this.getBaseUrl()}/orders/${orderId}`;
    console.log("[cashfree] verifyOrder →", { endpoint, orderId });

    const response = await fetch(endpoint, {
      method: "GET",
      headers: this.getHeaders(),
    });

    const responseBody = await response.text();
    console.log("[cashfree] verifyOrder ←", { status: response.status, body: responseBody });

    if (!response.ok) {
      throw new Error(`Cashfree Order Verification Failed [HTTP ${response.status}]: ${responseBody}`);
    }

    return JSON.parse(responseBody);
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
