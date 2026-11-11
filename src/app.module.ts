import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AuthController } from "./auth/auth.controller";
import { AuthModule } from "./auth/auth.module";
import { BookController } from "./book/book.controller";
import { BookModule } from "./book/book.module";
import { CoreModule } from "./core.module";
import { SessionMiddleware } from "./session.middleware";

@Module({
  imports: [CoreModule, AuthModule, BookModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes(AuthController, BookController);
  }
}
