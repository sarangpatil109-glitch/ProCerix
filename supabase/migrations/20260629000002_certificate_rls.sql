-- certificates table was missing INSERT/UPDATE policies.
-- The session client could not write certificates, causing issueCertificate to fail.
-- Primary fix: CertificateService now uses the admin client for writes.
-- These policies provide belt-and-suspenders access control for any future
-- session-client callers and follow the same pattern as progress/attempts.

CREATE POLICY "Users can insert own certificates" ON certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own certificates" ON certificates
  FOR SELECT USING (auth.uid() = user_id);
