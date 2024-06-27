/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

@Module({
  imports: [],
  controllers: [],
  providers: [ConfigService, PrismaService],
})
export class PrismaModule {}
