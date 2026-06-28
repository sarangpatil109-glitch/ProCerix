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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
          body {
            margin: 0; padding: 0; font-family: 'Inter', sans-serif;
            width: 1123px; height: 794px; /* A4 Landscape */
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
            box-sizing: border-box;
            text-align: center;
          }
          .logo { font-size: 32px; font-weight: 800; color: #2563eb; margin-bottom: 20px; letter-spacing: -1px; }
          .title { font-size: 56px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 10px; }
          .subtitle { font-size: 20px; color: #6b7280; font-weight: 400; margin-bottom: 40px; text-transform: uppercase; letter-spacing: 2px; }
          .awarded-to { font-size: 16px; color: #6b7280; margin-bottom: 10px; }
          .name { font-size: 48px; font-weight: 800; color: #1f2937; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; display: inline-block; }
          .reason { font-size: 18px; color: #6b7280; margin-bottom: 15px; }
          .course { font-size: 32px; font-weight: 600; color: #111827; margin-bottom: 60px; }
          .footer { display: flex; justify-content: space-between; align-items: flex-end; position: absolute; bottom: 40px; left: 40px; right: 40px; }
          .qr-code { width: 100px; height: 100px; }
          .meta { text-align: left; font-size: 14px; color: #4b5563; line-height: 1.6; }
          .signature { text-align: center; }
          .sig-line { width: 200px; border-bottom: 2px solid #111827; margin-bottom: 10px; }
          .sig-title { font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
          .badge { position: absolute; top: 40px; right: 40px; width: 100px; height: 100px; background: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; text-align: center; border: 4px solid #bfdbfe; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3); }
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
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
    });

    await browser.close();
    
    return Buffer.from(pdf);
  }
}
