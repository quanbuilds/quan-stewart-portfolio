import net from "node:net";
import tls from "node:tls";

function cleanHeader(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim();
}

function parseEmailAddress(value) {
  const text = cleanHeader(value);
  const match = text.match(/<([^>]+)>/);
  return (match ? match[1] : text).trim();
}

function encodeBase64(value) {
  return Buffer.from(String(value), "utf8").toString("base64");
}

function dotStuff(value) {
  return String(value).replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapePdfText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapLine(line, width = 88) {
  const words = String(line || "").split(/\s+/);
  const lines = [];
  let current = "";
  words.forEach((word) => {
    if (!word) return;
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export function buildReportPdf(reportText) {
  const sourceLines = String(reportText || "SignalLabs report").split(/\r?\n/);
  const lines = [];
  sourceLines.forEach((line) => {
    if (!line.trim()) {
      lines.push("");
      return;
    }
    wrapLine(line, 86).forEach((wrapped) => lines.push(wrapped));
  });

  const perPage = 42;
  const pages = [];
  for (let index = 0; index < lines.length; index += perPage) {
    pages.push(lines.slice(index, index + perPage));
  }
  if (!pages.length) pages.push(["SignalLabs AI Readiness Report"]);

  const objects = [];
  const add = (body) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = add("");
  const pagesId = add("");
  const fontId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds = [];
  const contentIds = [];

  pages.forEach((pageLines) => {
    const commands = ["BT", "/F1 10 Tf", "48 760 Td", "14 TL"];
    pageLines.forEach((line, lineIndex) => {
      if (lineIndex > 0) commands.push("T*");
      commands.push(`(${escapePdfText(line)}) Tj`);
    });
    commands.push("ET");
    const stream = commands.join("\n");
    const contentId = add(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`);
    const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    contentIds.push(contentId);
    pageIds.push(pageId);
  });

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(chunks.join(""), "utf8"));
    chunks.push(`${index + 1} 0 obj\n${body}\nendobj\n`);
  });
  const xrefOffset = Buffer.byteLength(chunks.join(""), "utf8");
  chunks.push(`xref\n0 ${objects.length + 1}\n`);
  chunks.push("0000000000 65535 f \n");
  offsets.slice(1).forEach((offset) => {
    chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  });
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);
  return Buffer.from(chunks.join(""), "utf8");
}

export function renderReportHtml(reportText, leadName = "", leadContact = "") {
  const reportLines = escapeHtml(reportText).split("\n");
  const body = reportLines
    .map((line) => {
      if (!line.trim()) return "<br />";
      if (/^\d+\./.test(line)) return `<p style="margin:10px 0;color:#25231e;">${line}</p>`;
      if (line.startsWith("- ")) return `<p style="margin:7px 0 7px 18px;color:#555047;">${line}</p>`;
      if (/^(SignalLabs|Table of contents|Lead)/i.test(line)) return `<h2 style="margin:24px 0 10px;font-size:22px;line-height:1.1;color:#151512;">${line}</h2>`;
      return `<p style="margin:8px 0;color:#555047;line-height:1.55;">${line}</p>`;
    })
    .join("");

  return `<!doctype html>
  <html>
    <body style="margin:0;background:#ebe7dc;font-family:Avenir Next,Helvetica,Arial,sans-serif;color:#151512;">
      <div style="max-width:760px;margin:0 auto;padding:34px 24px;">
        <div style="border:1px solid rgba(21,21,18,.22);background:#f5f1e7;padding:28px;">
          <p style="margin:0 0 16px;color:#b8892f;font-weight:800;letter-spacing:.12em;text-transform:uppercase;font-size:12px;">SignalLabs</p>
          ${body}
          <hr style="border:0;border-top:1px solid rgba(21,21,18,.16);margin:24px 0;" />
          <p style="margin:0;color:#555047;">Lead: ${escapeHtml(leadName)}<br />Contact: ${escapeHtml(leadContact)}</p>
        </div>
      </div>
    </body>
  </html>`;
}

function smtpConfig() {
  const user = process.env.SIGNALLABS_SMTP_USER || process.env.ICLOUD_SMTP_USER || "quan.stewart@icloud.com";
  const pass = process.env.SIGNALLABS_SMTP_PASS || process.env.ICLOUD_SMTP_PASS;
  return {
    host: process.env.SIGNALLABS_SMTP_HOST || "smtp.mail.me.com",
    port: Number(process.env.SIGNALLABS_SMTP_PORT || 587),
    user,
    pass,
    from: process.env.SIGNALLABS_SMTP_FROM || `SignalLabs <${user}>`,
  };
}

async function smtpSend({ to, subject, text, html, attachments = [] }) {
  const config = smtpConfig();
  if (!config.pass) return { sent: false, reason: "missing_smtp_password" };

  const recipients = Array.isArray(to) ? to : [to];
  const fromAddress = parseEmailAddress(config.from);
  const boundary = `signallabs-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const altBoundary = `${boundary}-alt`;
  const attachmentParts = attachments.map((attachment) => [
    `--${boundary}`,
    `Content-Type: ${attachment.contentType || "application/octet-stream"}; name="${cleanHeader(attachment.filename)}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${cleanHeader(attachment.filename)}"`,
    "",
    Buffer.from(attachment.content).toString("base64").replace(/(.{76})/g, "$1\r\n"),
  ].join("\r\n"));

  const message = [
    `From: ${cleanHeader(config.from)}`,
    `To: ${recipients.map(cleanHeader).join(", ")}`,
    `Subject: ${cleanHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    "",
    `--${altBoundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text || "",
    `--${altBoundary}`,
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    html || `<pre>${escapeHtml(text)}</pre>`,
    `--${altBoundary}--`,
    ...attachmentParts,
    `--${boundary}--`,
    "",
  ].join("\r\n");

  const socket = await new Promise((resolve, reject) => {
    const connection = net.createConnection(config.port, config.host, () => resolve(connection));
    connection.once("error", reject);
  });

  let buffer = "";
  const read = () =>
    new Promise((resolve, reject) => {
      const onData = (chunk) => {
        buffer += chunk.toString("utf8");
        const lines = buffer.split(/\r?\n/);
        const complete = lines.some((line) => /^\d{3} /.test(line));
        if (!complete) return;
        socket.off("data", onData);
        socket.off("error", onError);
        const response = buffer;
        buffer = "";
        resolve(response);
      };
      const onError = (error) => {
        socket.off("data", onData);
        reject(error);
      };
      socket.on("data", onData);
      socket.once("error", onError);
    });

  const write = async (command, expected = /^[23]/) => {
    socket.write(`${command}\r\n`);
    const response = await read();
    if (!expected.test(response)) throw new Error(`smtp_${response.slice(0, 3)}`);
    return response;
  };

  await read();
  await write("EHLO signallabs.local");
  await write("STARTTLS");
  const secureSocket = tls.connect({ socket, servername: config.host });
  await new Promise((resolve, reject) => {
    secureSocket.once("secureConnect", resolve);
    secureSocket.once("error", reject);
  });

  buffer = "";
  const secureRead = () =>
    new Promise((resolve, reject) => {
      const onData = (chunk) => {
        buffer += chunk.toString("utf8");
        const lines = buffer.split(/\r?\n/);
        const complete = lines.some((line) => /^\d{3} /.test(line));
        if (!complete) return;
        secureSocket.off("data", onData);
        secureSocket.off("error", onError);
        const response = buffer;
        buffer = "";
        resolve(response);
      };
      const onError = (error) => {
        secureSocket.off("data", onData);
        reject(error);
      };
      secureSocket.on("data", onData);
      secureSocket.once("error", onError);
    });
  const secureWrite = async (command, expected = /^[23]/) => {
    secureSocket.write(`${command}\r\n`);
    const response = await secureRead();
    if (!expected.test(response)) throw new Error(`smtp_${response.slice(0, 3)}`);
    return response;
  };

  await secureWrite("EHLO signallabs.local");
  await secureWrite("AUTH LOGIN", /^334/);
  await secureWrite(encodeBase64(config.user), /^334/);
  await secureWrite(encodeBase64(config.pass), /^235/);
  await secureWrite(`MAIL FROM:<${fromAddress}>`);
  for (const recipient of recipients) {
    await secureWrite(`RCPT TO:<${parseEmailAddress(recipient)}>`);
  }
  await secureWrite("DATA", /^354/);
  secureSocket.write(`${dotStuff(message)}\r\n.\r\n`);
  const dataResponse = await secureRead();
  if (!/^250/.test(dataResponse)) throw new Error(`smtp_${dataResponse.slice(0, 3)}`);
  await secureWrite("QUIT", /^[23]/).catch(() => {});
  secureSocket.end();

  return { sent: true, reason: "smtp" };
}

async function resendSend({ to, subject, text, html, attachments = [] }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "missing_resend_key" };

  const from = process.env.SIGNALLABS_REPORT_FROM || "SignalLabs <reports@quanbuilds.net>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: process.env.SIGNALLABS_REPLY_TO || "quan.stewart@icloud.com",
      subject,
      text,
      html,
      attachments: attachments.map((attachment) => ({
        filename: attachment.filename,
        content: Buffer.from(attachment.content).toString("base64"),
      })),
    }),
  });

  if (!response.ok) {
    return { sent: false, reason: `resend_${response.status}` };
  }

  return { sent: true, reason: "resend" };
}

export async function sendSignalLabsEmail(message) {
  const smtp = await smtpSend(message).catch((error) => ({ sent: false, reason: error.message || "smtp_failed" }));
  if (smtp.sent) return smtp;
  const resend = await resendSend(message).catch((error) => ({ sent: false, reason: error.message || "resend_failed" }));
  if (resend.sent) return resend;
  return { sent: false, reason: `${smtp.reason};${resend.reason}` };
}
