import "reflect-metadata";
import { mkdir } from "fs/promises";
import path from "path";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import { json, urlencoded } from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const photos = path.join(process.cwd(), "data", "photos");
  await mkdir(photos, { recursive: true });
  await mkdir(path.join(process.cwd(), "data", "outbox"), { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.use(cookieParser());
  app.use(json({ limit: "12mb" }));
  app.use(urlencoded({ extended: true, limit: "12mb" }));
  app.enableCors({
    origin: (process.env.WEB_ORIGIN || "http://localhost:3456").split(","),
    credentials: true,
  });
  app.useStaticAssets(photos, { prefix: "/photos" });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  await app.listen(Number(process.env.PORT || 4000));
}

void bootstrap();
