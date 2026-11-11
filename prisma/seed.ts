import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function frame(id: string) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;
}

const seats: [string, string, string, "owner" | "desk"][] = [
  ["seat-owner", "owner@damakese.local", "Studio owner", "owner"],
  ["seat-producer", "producer@damakese.local", "Producer", "desk"],
  ["seat-book", "book@damakese.local", "Second producer", "desk"],
  ["seat-floor", "floor@damakese.local", "Floor lead", "desk"],
  ["seat-spare", "spare@damakese.local", "Spare seat", "desk"],
];

const passwords: Record<string, string> = {
  "owner@damakese.local": "owner-keeps-the-date",
  "producer@damakese.local": "producer-holds-the-date",
  "book@damakese.local": "book-holds-the-day",
  "floor@damakese.local": "floor-marks-the-line",
  "spare@damakese.local": "spare-for-the-job",
};

async function main() {
  for (const [id, email, name, role] of seats) {
    const passwordHash = await bcrypt.hash(passwords[email], 10);
    await prisma.seat.upsert({
      where: { email },
      create: { id, email, name, role, passwordHash },
      update: { name, role, passwordHash },
    });
  }

  const days = [
    {
      id: "evt-fair",
      name: "National Trade Fair",
      kind: "Exhibition",
      client: "The Fair Office",
      venue: "Exhibition hall, Addis Ababa",
      date: "2026-12-08",
      doors: "08:00",
      status: "confirmed",
      visibility: "public",
      crew: 42,
      note: "Three days. Doors at eight. Welcome from the main stage at nine. Stage built Thursday, tested Friday.",
      imagePath: frame("photo-1540575467063-178a50c2df87"),
      imageAlt: "A conference hall set for a trade fair, rows of seats facing the stage.",
    },
    {
      id: "evt-stage",
      name: "Evening on the main stage",
      kind: "Concert",
      client: "North Stage",
      venue: "Main stage, Addis Ababa",
      date: "2026-12-04",
      doors: "18:00",
      status: "confirmed",
      visibility: "public",
      crew: 28,
      note: "Doors at six. Crew is ready at four. Second plan sits with the power drop.",
      imagePath: frame("photo-1470229722913-7c0e2dbbafd3"),
      imageAlt: "A concert crowd facing a lit stage.",
    },
    {
      id: "evt-protocol",
      name: "Protocol dinner",
      kind: "State occasion",
      client: "Embassy desk",
      venue: "Private room, Addis Ababa",
      date: "2026-11-21",
      doors: "19:00",
      status: "planning",
      visibility: "internal",
      crew: 16,
      note: "Seating is the risk. The second plan is a redrawn room, already drawn.",
      imagePath: frame("photo-1464366400600-7168b8af9bc3"),
      imageAlt: "A long table set for a formal dinner.",
    },
    {
      id: "evt-launch",
      name: "A product, one room",
      kind: "Launch",
      client: "Atlas Goods",
      venue: "To be confirmed, Addis Ababa",
      date: "2027-01-18",
      doors: "17:00",
      status: "hold",
      visibility: "internal",
      crew: 14,
      note: "Holding the date until the idea is settled. We do not build a room around a brief that is still moving.",
      imagePath: frame("photo-1505373877841-8d25f7d46678"),
      imageAlt: "A presenter on a stage in front of a seated room.",
    },
    {
      id: "evt-forum",
      name: "The forum, four days",
      kind: "Conference",
      client: "The Forum Office",
      venue: "Conference hall, Addis Ababa",
      date: "2027-02-10",
      doors: "08:30",
      status: "confirmed",
      visibility: "public",
      crew: 36,
      note: "Four days, three rooms, one crew. The stage is tested the day before the first session.",
      imagePath: frame("photo-1475721027785-f74eccf877e2"),
      imageAlt: "A speaker at a lectern, with the room listening.",
    },
    {
      id: "evt-reception",
      name: "The room at six",
      kind: "State occasion",
      client: "Protocol office",
      venue: "Reception hall, Addis Ababa",
      date: "2027-03-04",
      doors: "18:00",
      status: "planning",
      visibility: "public",
      crew: 22,
      note: "Seating is drawn twice. The second plan is already in the room.",
      imagePath: frame("photo-1519167758481-83f550bb49b3"),
      imageAlt: "A banquet room set with white linen and glassware.",
    },
    {
      id: "evt-lights",
      name: "Lights, then doors",
      kind: "Concert",
      client: "North Stage",
      venue: "Main stage, Addis Ababa",
      date: "2027-02-20",
      doors: "19:00",
      status: "confirmed",
      visibility: "public",
      crew: 31,
      note: "The rig is focused the afternoon before. Doors do not wait on a cue.",
      imagePath: frame("photo-1514525253161-7a46d19cd819"),
      imageAlt: "Concert lights over a dark room.",
    },
    {
      id: "evt-route",
      name: "A route through the hall",
      kind: "Exhibition",
      client: "The Fair Office",
      venue: "Exhibition hall, Addis Ababa",
      date: "2027-04-16",
      doors: "09:00",
      status: "planning",
      visibility: "public",
      crew: 38,
      note: "The route is walked once with the floor plan, then left alone.",
      imagePath: frame("photo-1531058020387-3be344556be6"),
      imageAlt: "An exhibition floor before the doors open.",
    },
    {
      id: "evt-reveal",
      name: "One idea, one room",
      kind: "Launch",
      client: "Atlas Goods",
      venue: "A single room, Addis Ababa",
      date: "2027-01-28",
      doors: "17:30",
      status: "confirmed",
      visibility: "public",
      crew: 18,
      note: "The idea is settled. The room is built around it, and nothing else.",
      imagePath: frame("photo-1551818255-e6e10975bc17"),
      imageAlt: "A small room set for a launch.",
    },
    {
      id: "evt-session",
      name: "The small room",
      kind: "Conference",
      client: "The Forum Office",
      venue: "Meeting room, Addis Ababa",
      date: "2026-11-18",
      doors: "09:00",
      status: "delivered",
      visibility: "public",
      crew: 8,
      note: "A small room still needs a second plan. This one held.",
      imagePath: frame("photo-1511578314322-379afb476865"),
      imageAlt: "People gathered in a room before a session.",
    },
  ];

  const more: Record<string, { path: string; alt: string }[]> = {
    "evt-fair": [
      { path: frame("photo-1587825140708-dfaf72ae4b04"), alt: "A wide stage in an exhibition hall." },
      { path: frame("photo-1531058020387-3be344556be6"), alt: "People gathered across an exhibition floor." },
    ],
    "evt-stage": [
      { path: frame("photo-1514525253161-7a46d19cd819"), alt: "Stage lights over a concert audience." },
      { path: frame("photo-1492684223066-81342ee5ff30"), alt: "Light falling through a concert crowd." },
    ],
    "evt-protocol": [
      { path: frame("photo-1519167758481-83f550bb49b3"), alt: "A banquet room set with glassware." },
      { path: frame("photo-1511578314322-379afb476865"), alt: "A room gathering before dinner." },
    ],
    "evt-launch": [
      { path: frame("photo-1475721027785-f74eccf877e2"), alt: "A speaker at a lectern." },
      { path: frame("photo-1551818255-e6e10975bc17"), alt: "A small room set for a launch." },
    ],
    "evt-forum": [
      { path: frame("photo-1540575467063-178a50c2df87"), alt: "A conference hall facing the stage." },
      { path: frame("photo-1531058020387-3be344556be6"), alt: "An event floor before the first session." },
    ],
    "evt-reception": [
      { path: frame("photo-1464366400600-7168b8af9bc3"), alt: "A long table set for a formal dinner." },
      { path: frame("photo-1511578314322-379afb476865"), alt: "A room gathering before the reception." },
    ],
    "evt-lights": [
      { path: frame("photo-1470229722913-7c0e2dbbafd3"), alt: "A concert crowd facing a lit stage." },
      { path: frame("photo-1492684223066-81342ee5ff30"), alt: "Light falling through a concert crowd." },
    ],
    "evt-route": [
      { path: frame("photo-1587825140708-dfaf72ae4b04"), alt: "A wide stage in an exhibition hall." },
      { path: frame("photo-1540575467063-178a50c2df87"), alt: "Rows of seats facing an exhibition stage." },
    ],
    "evt-reveal": [
      { path: frame("photo-1505373877841-8d25f7d46678"), alt: "A presenter on a stage in front of a seated room." },
      { path: frame("photo-1475721027785-f74eccf877e2"), alt: "A speaker at a lectern." },
    ],
    "evt-session": [
      { path: frame("photo-1551818255-e6e10975bc17"), alt: "A workshop table in a small meeting room." },
      { path: frame("photo-1511578314322-379afb476865"), alt: "A small room before the session begins." },
    ],
  };

  for (const day of days) {
    await prisma.day.upsert({ where: { id: day.id }, create: day, update: day });
    const frames = [{ path: day.imagePath, alt: day.imageAlt }, ...(more[day.id] ?? [])];
    for (let index = 0; index < frames.length; index += 1) {
      const id = `${day.id}-p${index}`;
      const photo = { dayId: day.id, path: frames[index].path, alt: frames[index].alt, sort: index };
      await prisma.dayPhoto.upsert({ where: { id }, create: { id, ...photo }, update: photo });
    }
  }

  const clients = [
    {
      id: "cli-fair",
      organisation: "The Fair Office",
      contact: "Hanna Bekele",
      email: "hanna@example.com",
      note: "Annual floor. They hand over the date and the exhibitor list.",
    },
    {
      id: "cli-stage",
      organisation: "North Stage",
      contact: "Yonas Tadesse",
      email: "yonas@example.com",
      note: "Promoter. Nights, not seasons.",
    },
    {
      id: "cli-embassy",
      organisation: "Embassy desk",
      contact: "Protocol office",
      email: "desk@example.com",
      note: "Small room, high attention. A small event is not a small client.",
    },
  ];
  for (const client of clients) {
    await prisma.client.upsert({ where: { id: client.id }, create: client, update: client });
  }

  const briefs = [
    {
      id: "inq-1",
      name: "Hanna Bekele",
      organisation: "The Fair Office",
      email: "hanna@example.com",
      phone: "",
      kind: "Exhibition",
      date: "2026-12-08",
      city: "Addis Ababa",
      brief: "Three days on the floor. Two hundred stands. The route has to be obvious from the door.",
      status: "briefed",
      receivedAt: new Date("2026-10-02T09:12:00.000Z"),
    },
    {
      id: "inq-2",
      name: "Yonas Tadesse",
      organisation: "North Stage",
      email: "yonas@example.com",
      phone: "",
      kind: "Concert",
      date: "2026-12-04",
      city: "Addis Ababa",
      brief: "One night. The room has to be tested before the city arrives.",
      status: "review",
      receivedAt: new Date("2026-10-18T14:40:00.000Z"),
    },
  ];
  for (const brief of briefs) {
    await prisma.brief.upsert({ where: { id: brief.id }, create: brief, update: brief });
  }

  const run = [
    { id: "run-1", dayId: "evt-protocol", time: "14:00", task: "Room measured. Chair line marked.", owner: "Floor", state: "open" },
    { id: "run-2", dayId: "evt-protocol", time: "16:00", task: "Place cards checked against the list.", owner: "Protocol", state: "open" },
    { id: "run-3", dayId: "evt-protocol", time: "17:30", task: "Sound in the room, tested, then left alone.", owner: "Audio", state: "open" },
    { id: "run-4", dayId: "evt-stage", time: "10:00", task: "Power drop confirmed with the venue.", owner: "Production", state: "done" },
    { id: "run-5", dayId: "evt-fair", time: "09:00", task: "Exhibitor route walked, once, with the floor plan.", owner: "Floor", state: "open" },
  ];
  for (const item of run) {
    await prisma.runItem.upsert({ where: { id: item.id }, create: item, update: item });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
