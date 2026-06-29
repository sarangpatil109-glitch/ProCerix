import puppeteer from 'puppeteer';
import QRCode from 'qrcode';

export class CertificatePDFGenerator {
  static async generate(data: {
    candidateName: string;
    courseName: string;
    credentialId: string;
    issueDate: string;
    verificationUrl: string;
  }): Promise<Buffer> {
    const qrCodeDataUrl = await QRCode.toDataURL(data.verificationUrl, { errorCorrectionLevel: 'H' });

    // All fonts are system/web-safe — no external network requests during render.
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: Georgia, 'Times New Roman', serif;
            width: 1123px; height: 794px;
            background: #ffffff;
            color: #1a1a1a;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .certificate {
            width: 1000px; height: 680px;
            border: 2px solid #e5e7eb;
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            position: relative;
            padding: 40px;
            text-align: center;
          }
          .logo {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 32px; font-weight: 800; color: #2563eb;
            margin-bottom: 20px; letter-spacing: -1px;
          }
          .title {
            font-size: 52px; font-weight: bold; color: #111827;
            text-transform: uppercase; letter-spacing: 4px; margin-bottom: 8px;
          }
          .subtitle {
            font-size: 20px; color: #6b7280; margin-bottom: 36px;
            text-transform: uppercase; letter-spacing: 2px;
          }
          .awarded-to { font-size: 16px; color: #6b7280; margin-bottom: 8px; }
          .name {
            font-size: 44px; font-weight: bold; color: #1f2937;
            margin-bottom: 28px; border-bottom: 2px solid #2563eb;
            padding-bottom: 8px; display: inline-block;
          }
          .reason { font-size: 18px; color: #6b7280; margin-bottom: 12px; }
          .course { font-size: 28px; font-weight: bold; color: #111827; margin-bottom: 56px; }
          .footer {
            display: flex; justify-content: space-between; align-items: flex-end;
            position: absolute; bottom: 40px; left: 40px; right: 40px;
          }
          .qr-code { width: 90px; height: 90px; }
          .meta { text-align: left; font-size: 13px; color: #4b5563; line-height: 1.7; }
          .signature { text-align: center; }
          .sig-line { width: 200px; border-bottom: 2px solid #111827; margin-bottom: 8px; }
          .sig-title {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px; color: #6b7280;
            text-transform: uppercase; letter-spacing: 1px;
          }
          .badge {
            position: absolute; top: 40px; right: 40px;
            width: 96px; height: 96px; background: #2563eb; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: bold; font-size: 13px; text-align: center;
            border: 4px solid #bfdbfe;
            font-family: Arial, Helvetica, sans-serif;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="badge">PRO<br/>CERIX</div>
          <div class="logo">ProCerix</div>
          <div class="title">Certificate</div>
          <div class="subtitle">of Completion</div>
          <div class="awarded-to">This is proudly awarded to</div>
          <div class="name">${data.candidateName}</div>
          <div class="reason">for successfully completing the course</div>
          <div class="course">${data.courseName}</div>

          <div class="footer">
            <div class="meta">
              <strong>Credential ID:</strong> ${data.credentialId}<br/>
              <strong>Issued Date:</strong> ${data.issueDate}<br/>
              <strong>Verify at:</strong> ${data.verificationUrl}
            </div>
            <div>
              <img src="${qrCodeDataUrl}" class="qr-code" alt="QR Code" />
            </div>
            <div class="signature">
              <div class="sig-line"></div>
              <div class="sig-title">Director of Education</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();
      // domcontentloaded: don't wait for external network resources (fonts, images).
      // All assets are inlined (QR code is a data URL, fonts are system fonts).
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdf = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
