import { Global, Module } from "@nestjs/common";
import { MailService } from "./mail.service";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService, MailService],
  exports: [PrismaService, MailService],
})
export class CoreModule {}
