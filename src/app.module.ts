import { PrismaModule } from './db/prisma.module';
import { MoviesModule } from './movies/movies.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as CacheStore from 'cache-manager-ioredis';
import { CacheModule } from '@nestjs/cache-manager';
@Module({
  imports: [
    PrismaModule,
    MoviesModule,
    // CacheModule.register({
    //   isGlobal: true,
    //   store: CacheStore,
    //   host: 'redis',
    //   port: process.env.REDIS,
    //   ttl: 60 * 60 * 6,
    // }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
