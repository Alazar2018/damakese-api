import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import type { Brief, Client, Day, DayPhoto, RunItem } from "@prisma/client";
import { MailService } from "../mail.service";
import { PrismaService } from "../prisma.service";
import type { BriefDto, ClientDto, DayDto, ImportDto, RunDto } from "./shapes";

const photosDir = path.join(process.cwd(), "data", "photos");

const withPhotos = { photos: { orderBy: { sort: "asc" as const } } };

function dayOut(row: Day & { photos?: DayPhoto[] }) {
  const pictures = [...(row.photos ?? [])].sort((a, b) => a.sort - b.sort);
  const images = pictures.length
    ? pictures.map((photo) => ({ id: photo.id, src: photo.path, alt: photo.alt }))
    : row.imagePath
      ? [{ id: `cover-${row.id}`, src: row.imagePath, alt: row.imageAlt }]
      : [];
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    client: row.client,
    venue: row.venue,
    date: row.date,
    doors: row.doors,
    status: row.status,
    visibility: row.visibility,
    crew: row.crew,
    note: row.note,
    image: images[0]?.src ?? "",
    imageAlt: images[0]?.alt ?? "",
    images,
  };
}

function briefOut(row: Brief) {
  return {
    id: row.id,
    name: row.name,
    organisation: row.organisation,
    email: row.email,
    phone: row.phone,
    kind: row.kind,
    date: row.date,
    city: row.city,
    brief: row.brief,
    status: row.status,
    receivedAt: row.receivedAt.toISOString(),
  };
}

function clientOut(row: Client) {
  return {
    id: row.id,
    organisation: row.organisation,
    contact: row.contact,
    email: row.email,
    note: row.note,
  };
}

function runOut(row: RunItem) {
  return {
    id: row.id,
    eventId: row.dayId,
    time: row.time,
    task: row.task,
    owner: row.owner,
    state: row.state,
  };
}

function localFile(url: string) {
  const mark = "/photos/";
  const index = url.indexOf(mark);
  if (index === -1) return null;
  const name = path.basename(url.slice(index + mark.length).split("?")[0] || "");
  if (!name || name.includes("..")) return null;
  return path.join(photosDir, name);
}

@Injectable()
export class BookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async days(all: boolean) {
    const rows = await this.prisma.day.findMany({
      where: all ? undefined : { visibility: "public" },
      orderBy: { date: "asc" },
      include: withPhotos,
    });
    return { events: rows.map(dayOut) };
  }

  async desk() {
    const [days, briefs, clients, run] = await Promise.all([
      this.prisma.day.findMany({ orderBy: { date: "asc" }, include: withPhotos }),
      this.prisma.brief.findMany({ orderBy: { receivedAt: "desc" } }),
      this.prisma.client.findMany({ orderBy: { organisation: "asc" } }),
      this.prisma.runItem.findMany({ orderBy: { time: "asc" } }),
    ]);
    return {
      events: days.map(dayOut),
      inquiries: briefs.map(briefOut),
      clients: clients.map(clientOut),
      run: run.map(runOut),
    };
  }

  async addDay(input: DayDto) {
    const row = await this.prisma.day.create({
      data: this.dayData(`evt-${randomUUID().slice(0, 8)}`, input),
      include: withPhotos,
    });
    return dayOut(row);
  }

  async saveDay(id: string, input: DayDto) {
    const existing = await this.prisma.day.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("That day is not on the book.");
    const row = await this.prisma.day.update({
      where: { id },
      data: this.dayData(id, input),
      include: withPhotos,
    });
    return dayOut(row);
  }

  async removeDay(id: string) {
    const existing = await this.prisma.day.findUnique({ where: { id }, include: withPhotos });
    if (!existing) throw new NotFoundException("That day is not on the book.");
    for (const photo of existing.photos) await this.removeFile(photo.path);
    await this.removeFile(existing.imagePath);
    await this.prisma.day.delete({ where: { id } });
    return { ok: true };
  }

  async savePhoto(id: string, file: Express.Multer.File | undefined, alt = "") {
    if (!file) throw new BadRequestException("Choose a photograph.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      throw new BadRequestException("Use a photograph. JPG, PNG, or WebP.");
    }
    const existing = await this.prisma.day.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("That day is not on the book.");
    await this.keepCover(existing);
    const count = await this.prisma.dayPhoto.count({ where: { dayId: id } });
    if (count >= 8) throw new BadRequestException("A day can hold eight photographs.");
    await mkdir(photosDir, { recursive: true });
    const filename = `${id}-${Date.now()}.jpg`;
    await writeFile(path.join(photosDir, filename), file.buffer);
    const imagePath = `${process.env.PUBLIC_URL || "http://localhost:4000"}/photos/${filename}`;
    await this.prisma.dayPhoto.create({
      data: {
        id: `pic-${randomUUID().slice(0, 8)}`,
        dayId: id,
        path: imagePath,
        alt: alt.trim(),
        sort: count,
      },
    });
    return this.syncCover(id);
  }

  async removePhoto(dayId: string, photoId: string) {
    const day = await this.prisma.day.findUnique({ where: { id: dayId } });
    if (!day) throw new NotFoundException("That day is not on the book.");
    if (photoId === `cover-${dayId}`) {
      await this.removeFile(day.imagePath);
      await this.prisma.day.update({ where: { id: dayId }, data: { imagePath: "", imageAlt: "" } });
      return this.syncCover(dayId);
    }
    const photo = await this.prisma.dayPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.dayId !== dayId) throw new NotFoundException("That photograph is not on this day.");
    await this.removeFile(photo.path);
    await this.prisma.dayPhoto.delete({ where: { id: photoId } });
    return this.syncCover(dayId);
  }

  async renamePhoto(dayId: string, photoId: string, alt: string) {
    const photo = await this.prisma.dayPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.dayId !== dayId) throw new NotFoundException("That photograph is not on this day.");
    await this.prisma.dayPhoto.update({ where: { id: photoId }, data: { alt: alt.trim() } });
    return this.syncCover(dayId);
  }

  async addBrief(input: BriefDto, fromDesk: boolean) {
    const row = await this.prisma.brief.create({
      data: {
        id: `inq-${randomUUID().slice(0, 8)}`,
        name: input.name.trim(),
        organisation: input.organisation.trim(),
        email: input.email.trim(),
        phone: input.phone?.trim() || "",
        kind: input.kind,
        date: input.date || "",
        city: input.city?.trim() || "",
        brief: input.brief.trim(),
        status: fromDesk && input.status ? input.status : "new",
      },
    });
    if (!fromDesk) {
      await this.mail.notify({
        id: row.id,
        name: row.name,
        organisation: row.organisation,
        email: row.email,
        kind: row.kind,
        date: row.date,
        brief: row.brief,
      });
    }
    return briefOut(row);
  }

  async saveBrief(id: string, input: BriefDto) {
    const existing = await this.prisma.brief.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("That brief is not on the desk.");
    const row = await this.prisma.brief.update({
      where: { id },
      data: {
        name: input.name.trim(),
        organisation: input.organisation.trim(),
        email: input.email.trim(),
        phone: input.phone?.trim() || "",
        kind: input.kind,
        date: input.date || "",
        city: input.city?.trim() || "",
        brief: input.brief.trim(),
        status: input.status || existing.status,
      },
    });
    return briefOut(row);
  }

  async removeBrief(id: string) {
    await this.prisma.brief.delete({ where: { id } });
    return { ok: true };
  }

  async addClient(input: ClientDto) {
    const row = await this.prisma.client.create({
      data: {
        id: `cli-${randomUUID().slice(0, 8)}`,
        organisation: input.organisation.trim(),
        contact: input.contact.trim(),
        email: input.email?.trim() || "",
        note: input.note?.trim() || "",
      },
    });
    return clientOut(row);
  }

  async saveClient(id: string, input: ClientDto) {
    const existing = await this.prisma.client.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("That client is not on the desk.");
    const row = await this.prisma.client.update({
      where: { id },
      data: {
        organisation: input.organisation.trim(),
        contact: input.contact.trim(),
        email: input.email?.trim() || "",
        note: input.note?.trim() || "",
      },
    });
    return clientOut(row);
  }

  async removeClient(id: string) {
    await this.prisma.client.delete({ where: { id } });
    return { ok: true };
  }

  async addRun(input: RunDto) {
    await this.requireDay(input.eventId);
    const row = await this.prisma.runItem.create({
      data: {
        id: `run-${randomUUID().slice(0, 8)}`,
        dayId: input.eventId,
        time: input.time,
        task: input.task.trim(),
        owner: input.owner.trim(),
        state: input.state,
      },
    });
    return runOut(row);
  }

  async saveRun(id: string, input: RunDto) {
    const existing = await this.prisma.runItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("That line is not on the sheet.");
    await this.requireDay(input.eventId);
    const row = await this.prisma.runItem.update({
      where: { id },
      data: {
        dayId: input.eventId,
        time: input.time,
        task: input.task.trim(),
        owner: input.owner.trim(),
        state: input.state,
      },
    });
    return runOut(row);
  }

  async removeRun(id: string) {
    await this.prisma.runItem.delete({ where: { id } });
    return { ok: true };
  }

  async importBook(body: ImportDto) {
    for (const event of body.events ?? []) {
      if (!event?.name || !event.date) continue;
      const id = event.id || `evt-${randomUUID().slice(0, 8)}`;
      const image = await this.keepImage(id, event.image || "");
      const data = this.dayData(id, { ...event, image });
      await this.prisma.day.upsert({ where: { id }, create: data, update: data });
      const already = await this.prisma.dayPhoto.count({ where: { dayId: id } });
      if (image && already === 0) {
        await this.prisma.dayPhoto.create({
          data: { id: `cover-${id}`, dayId: id, path: image, alt: event.imageAlt || "", sort: 0 },
        });
      }
    }
    for (const client of body.clients ?? []) {
      if (!client?.organisation || !client.contact) continue;
      const id = client.id || `cli-${randomUUID().slice(0, 8)}`;
      const data = {
        organisation: client.organisation,
        contact: client.contact,
        email: client.email || "",
        note: client.note || "",
      };
      await this.prisma.client.upsert({ where: { id }, create: { id, ...data }, update: data });
    }
    for (const item of body.inquiries ?? []) {
      if (!item?.name || !item.brief) continue;
      const id = item.id || `inq-${randomUUID().slice(0, 8)}`;
      const data = {
        name: item.name,
        organisation: item.organisation || "",
        email: item.email || "",
        phone: item.phone || "",
        kind: item.kind || "Conference",
        date: item.date || "",
        city: item.city || "",
        brief: item.brief,
        status: item.status || "new",
        receivedAt: item.receivedAt ? new Date(item.receivedAt) : new Date(),
      };
      await this.prisma.brief.upsert({ where: { id }, create: { id, ...data }, update: data });
    }
    for (const item of body.run ?? []) {
      if (!item?.task || !item.eventId) continue;
      const day = await this.prisma.day.findUnique({ where: { id: item.eventId } });
      if (!day) continue;
      const id = item.id || `run-${randomUUID().slice(0, 8)}`;
      const data = {
        dayId: item.eventId,
        time: item.time || "09:00",
        task: item.task,
        owner: item.owner || "",
        state: item.state || "open",
      };
      await this.prisma.runItem.upsert({ where: { id }, create: { id, ...data }, update: data });
    }
    return this.desk();
  }

  private dayData(id: string, input: DayDto) {
    return {
      id,
      name: input.name.trim(),
      kind: input.kind,
      client: input.client?.trim() || "",
      venue: input.venue?.trim() || "",
      date: input.date,
      doors: input.doors || "18:00",
      status: input.status,
      visibility: input.visibility,
      crew: Number(input.crew) || 0,
      note: input.note?.trim() || "",
      imagePath: input.image?.startsWith("data:") ? "" : input.image || "",
      imageAlt: input.imageAlt?.trim() || "",
    };
  }

  private async requireDay(id: string) {
    const day = await this.prisma.day.findUnique({ where: { id } });
    if (!day) throw new BadRequestException("Name the task, and the day it belongs to.");
  }

  private async keepImage(id: string, image: string) {
    if (!image.startsWith("data:image/")) return image;
    const match = image.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
    if (!match) return "";
    const buffer = Buffer.from(match[1], "base64");
    if (buffer.length > 2.5 * 1024 * 1024) return "";
    await mkdir(photosDir, { recursive: true });
    const filename = `${id}-${Date.now()}.jpg`;
    await writeFile(path.join(photosDir, filename), buffer);
    return `${process.env.PUBLIC_URL || "http://localhost:4000"}/photos/${filename}`;
  }

  private async keepCover(day: Day) {
    const count = await this.prisma.dayPhoto.count({ where: { dayId: day.id } });
    if (count > 0 || !day.imagePath) return;
    await this.prisma.dayPhoto.create({
      data: {
        id: `cover-${day.id}`,
        dayId: day.id,
        path: day.imagePath,
        alt: day.imageAlt,
        sort: 0,
      },
    });
  }

  private async syncCover(id: string) {
    const photos = await this.prisma.dayPhoto.findMany({ where: { dayId: id }, orderBy: { sort: "asc" } });
    const first = photos[0];
    const row = await this.prisma.day.update({
      where: { id },
      data: { imagePath: first?.path ?? "", imageAlt: first?.alt ?? "" },
      include: withPhotos,
    });
    return dayOut(row);
  }

  private async removeFile(url: string) {
    const file = localFile(url);
    if (!file) return;
    await unlink(file).catch(() => undefined);
  }
}
