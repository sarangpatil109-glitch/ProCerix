export function validatePurchaseForEnrollment(paymentStatus: string): boolean {
  return paymentStatus === "success" || paymentStatus === "manual_admin";
}
