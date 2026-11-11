import { Injectable, Logger } from "@nestjs/common";
import { mkdir, writeFile } from "fs/promises";
import nodemailer from "nodemailer";
import path from "path";

export type BriefNote = {
  id: string;
  name: string;
  organisation: string;
  email: string;
  kind: string;
  date: string;
  brief: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly outbox = path.join(process.cwd(), "data", "outbox");

  async notify(brief: BriefNote) {
    const inbox = process.env.STUDIO_INBOX || "studio@damakese.local";
    const text = [
      `A brief from ${brief.name}, ${brief.organisation}.`,
      `Email: ${brief.email}`,
      `Kind: ${brief.kind}`,
      `Date: ${brief.date || "Date open"}`,
      "",
      brief.brief.slice(0, 600),
    ].join("\n");

    await mkdir(this.outbox, { recursive: true });
    await writeFile(path.join(this.outbox, `${brief.id}.txt`), `To: ${inbox}\n\n${text}\n`, "utf8");

    if (!process.env.SMTP_HOST) return;

    try {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_PORT === "465",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || "" }
          : undefined,
      });
      await transport.sendMail({
        from: process.env.SMTP_FROM || inbox,
        to: inbox,
        subject: `Brief from ${brief.organisation}`,
        text,
      });
    } catch (error) {
      this.logger.warn(`The brief is on the desk. The email did not leave. ${String(error)}`);
    }
  }
}
