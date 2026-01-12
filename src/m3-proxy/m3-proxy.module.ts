import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { M3ProxyController } from './m3-proxy.controller';
import { M3ProxyService } from './m3-proxy.service';

@Module({
  imports: [HttpModule],
  controllers: [M3ProxyController],
  providers: [M3ProxyService],
})
export class M3ProxyModule {}
