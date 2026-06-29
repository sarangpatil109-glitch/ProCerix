import QRCode from 'qrcode';
import { existsSync } from 'fs';

interface CertificateData {
  candidateName: string;
  courseName: string;
  credentialId: string;
  issueDate: string;
  verificationUrl: string;
}

// ─── Chromium executable resolution ──────────────────────────────────────────

async function resolveChromium(): Promise<{ executablePath: string; args: string[] }> {
  // Vercel / Lambda serverless: use @sparticuz/chromium binary
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import('@sparticuz/chromium')).default;
    return {
      executablePath: await chromium.executablePath(),
      args: chromium.args,
    };
  }

  // Local development: prefer puppeteer's bundled Chrome if available
  try {
    const puppeteer = await import('puppeteer');
    const path = await puppeteer.default.executablePath();
    if (path && existsSync(path)) return { executablePath: path, args: [] };
  } catch {
    // puppeteer not installed or Chrome not downloaded, fall through to system Chrome
  }

  // Local fallback: system Chrome at common install paths
  const systemPaths: string[] = [];
  if (process.platform === 'win32') {
    systemPaths.push(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    );
  } else if (process.platform === 'darwin') {
    systemPaths.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  } else {
    systemPaths.push(
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
    );
  }

  for (const p of systemPaths) {
    if (existsSync(p)) return { executablePath: p, args: [] };
  }

  throw new Error(
    `No Chrome/Chromium binary found. On Vercel set VERCEL=1; locally install Chrome or run: npm install puppeteer`,
  );
}

// ─── HTML template ────────────────────────────────────────────────────────────

function buildHtml(data: CertificateData, qrDataUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      width: 1123px; height: 794px;
      background: #ffffff; color: #1a1a1a;
      display: flex; align-items: center; justify-content: center;
    }
    .certificate {
      width: 1000px; height: 680px;
      border: 2px solid #e5e7eb;
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      position: relative; padding: 40px; text-align: center;
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
      <img src="${qrDataUrl}" class="qr-code" alt="QR Code" />
      <div class="signature">
        <div class="sig-line"></div>
        <div class="sig-title">Director of Education</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── pdf-lib fallback ─────────────────────────────────────────────────────────

async function generateWithPdfLib(data: CertificateData): Promise<Buffer> {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

  const doc = await PDFDocument.create();
  // A4 landscape: 842 x 595 pts
  const page = doc.addPage([842, 595]);
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const blue = rgb(0.145, 0.38, 0.922);
  const dark = rgb(0.067, 0.094, 0.153);
  const gray = rgb(0.42, 0.447, 0.502);

  // Border
  page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40,
    borderColor: rgb(0.9, 0.91, 0.92), borderWidth: 1.5 });

  // Logo
  page.drawText('ProCerix', {
    x: width / 2 - fontBold.widthOfTextAtSize('ProCerix', 28) / 2,
    y: height - 80, size: 28, font: fontBold, color: blue,
  });

  // Title
  const title = 'CERTIFICATE OF COMPLETION';
  page.drawText(title, {
    x: width / 2 - fontBold.widthOfTextAtSize(title, 22) / 2,
    y: height - 115, size: 22, font: fontBold, color: dark,
  });

  // Awarded to
  const awarded = 'This is proudly awarded to';
  page.drawText(awarded, {
    x: width / 2 - fontRegular.widthOfTextAtSize(awarded, 13) / 2,
    y: height - 165, size: 13, font: fontRegular, color: gray,
  });

  // Name
  const nameSize = 34;
  page.drawText(data.candidateName, {
    x: width / 2 - fontBold.widthOfTextAtSize(data.candidateName, nameSize) / 2,
    y: height - 215, size: nameSize, font: fontBold, color: dark,
  });
  // Underline
  const nameW = fontBold.widthOfTextAtSize(data.candidateName, nameSize);
  page.drawLine({
    start: { x: width / 2 - nameW / 2, y: height - 222 },
    end:   { x: width / 2 + nameW / 2, y: height - 222 },
    thickness: 1.5, color: blue,
  });

  // Course
  const forText = 'for successfully completing the course';
  page.drawText(forText, {
    x: width / 2 - fontRegular.widthOfTextAtSize(forText, 12) / 2,
    y: height - 265, size: 12, font: fontRegular, color: gray,
  });
  const courseSize = 20;
  page.drawText(data.courseName, {
    x: width / 2 - fontBold.widthOfTextAtSize(data.courseName, courseSize) / 2,
    y: height - 300, size: courseSize, font: fontBold, color: dark,
  });

  // Footer meta
  page.drawText(`Credential ID: ${data.credentialId}`, {
    x: 50, y: 80, size: 10, font: fontRegular, color: gray,
  });
  page.drawText(`Issued Date: ${data.issueDate}`, {
    x: 50, y: 65, size: 10, font: fontRegular, color: gray,
  });
  page.drawText(`Verify: ${data.verificationUrl}`, {
    x: 50, y: 50, size: 10, font: fontRegular, color: gray,
  });

  // Signature line
  page.drawLine({
    start: { x: width - 250, y: 75 }, end: { x: width - 60, y: 75 },
    thickness: 1, color: dark,
  });
  const sigText = 'Director of Education';
  page.drawText(sigText, {
    x: width - 250 + (190 - fontRegular.widthOfTextAtSize(sigText, 10)) / 2,
    y: 62, size: 10, font: fontRegular, color: gray,
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

// ─── Main export ──────────────────────────────────────────────────────────────

export class CertificatePDFGenerator {
  static async generate(data: CertificateData): Promise<Buffer> {
    const qrDataUrl = await QRCode.toDataURL(data.verificationUrl, { errorCorrectionLevel: 'H' });

    // Attempt Puppeteer/Chromium render
    try {
      const { executablePath, args } = await resolveChromium();
      const { launch } = await import('puppeteer-core');

      const browser = await launch({
        executablePath,
        args: [...args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        headless: true,
      });

      try {
        const page = await browser.newPage();
        await page.setContent(buildHtml(data, qrDataUrl), { waitUntil: 'domcontentloaded' });
        const pdf = await page.pdf({ format: 'A4', landscape: true, printBackground: true });
        return Buffer.from(pdf);
      } finally {
        await browser.close();
      }
    } catch (puppeteerError: any) {
      // Fallback: generate a clean PDF with pdf-lib (no browser required)
      console.warn(
        '[CertificatePDFGenerator] Puppeteer failed, falling back to pdf-lib:',
        puppeteerError?.message,
      );
      return generateWithPdfLib(data);
    }
  }
}
