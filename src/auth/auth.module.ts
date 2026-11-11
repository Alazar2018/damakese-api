import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthGuard, OwnerGuard } from "./session";

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, OwnerGuard],
  exports: [AuthService, AuthGuard, OwnerGuard],
})
export class AuthModule {}
