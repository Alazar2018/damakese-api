import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { BookService } from "./book.service";
import { BriefDto, ClientDto, DayDto, ImportDto, PhotoAltDto, RunDto } from "./shapes";
import { AuthGuard, CurrentUser, OwnerGuard, type SessionUser } from "../auth/session";

@Controller()
export class BookController {
  constructor(private readonly book: BookService) {}

  @Get("days")
  days(@CurrentUser() user: SessionUser | null) {
    return this.book.days(Boolean(user));
  }

  @Get("desk")
  @UseGuards(AuthGuard)
  desk() {
    return this.book.desk();
  }

  @Post("days")
  @UseGuards(AuthGuard)
  addDay(@Body() body: DayDto) {
    return this.book.addDay(body);
  }

  @Patch("days/:id")
  @UseGuards(AuthGuard)
  saveDay(@Param("id") id: string, @Body() body: DayDto) {
    return this.book.saveDay(id, body);
  }

  @Delete("days/:id")
  @UseGuards(AuthGuard, OwnerGuard)
  removeDay(@Param("id") id: string) {
    return this.book.removeDay(id);
  }

  @Post("days/:id/photo")
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 2.5 * 1024 * 1024 } }))
  photo(@Param("id") id: string, @UploadedFile() file: Express.Multer.File, @Body() body: PhotoAltDto) {
    return this.book.savePhoto(id, file, body.alt || "");
  }

  @Patch("days/:id/photos/:photoId")
  @UseGuards(AuthGuard)
  renamePhoto(@Param("id") id: string, @Param("photoId") photoId: string, @Body() body: PhotoAltDto) {
    return this.book.renamePhoto(id, photoId, body.alt || "");
  }

  @Delete("days/:id/photos/:photoId")
  @UseGuards(AuthGuard)
  removePhoto(@Param("id") id: string, @Param("photoId") photoId: string) {
    return this.book.removePhoto(id, photoId);
  }

  @Post("briefs")
  addBrief(@Body() body: BriefDto, @CurrentUser() user: SessionUser | null) {
    return this.book.addBrief(body, Boolean(user));
  }

  @Patch("briefs/:id")
  @UseGuards(AuthGuard)
  saveBrief(@Param("id") id: string, @Body() body: BriefDto) {
    return this.book.saveBrief(id, body);
  }

  @Delete("briefs/:id")
  @UseGuards(AuthGuard, OwnerGuard)
  removeBrief(@Param("id") id: string) {
    return this.book.removeBrief(id);
  }

  @Post("clients")
  @UseGuards(AuthGuard)
  addClient(@Body() body: ClientDto) {
    return this.book.addClient(body);
  }

  @Patch("clients/:id")
  @UseGuards(AuthGuard)
  saveClient(@Param("id") id: string, @Body() body: ClientDto) {
    return this.book.saveClient(id, body);
  }

  @Delete("clients/:id")
  @UseGuards(AuthGuard, OwnerGuard)
  removeClient(@Param("id") id: string) {
    return this.book.removeClient(id);
  }

  @Post("run")
  @UseGuards(AuthGuard)
  addRun(@Body() body: RunDto) {
    return this.book.addRun(body);
  }

  @Patch("run/:id")
  @UseGuards(AuthGuard)
  saveRun(@Param("id") id: string, @Body() body: RunDto) {
    return this.book.saveRun(id, body);
  }

  @Delete("run/:id")
  @UseGuards(AuthGuard, OwnerGuard)
  removeRun(@Param("id") id: string) {
    return this.book.removeRun(id);
  }

  @Post("import")
  @UseGuards(AuthGuard, OwnerGuard)
  importBook(@Body() body: ImportDto) {
    return this.book.importBook(body);
  }
}
