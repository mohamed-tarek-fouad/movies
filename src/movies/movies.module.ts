import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';

import { Module } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [],
  controllers: [MoviesController],
  providers: [MoviesService, PrismaService, ConfigService],
})
export class MoviesModule {}
