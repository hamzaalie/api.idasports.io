import { Module } from '@nestjs/common';
import { PacksController } from './packs.controller';

@Module({
  controllers: [PacksController],
})
export class PacksModule {}
