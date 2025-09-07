import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { BotController } from './bot.controller';

@Module({
  providers: [BotUpdate],
  controllers: [BotController]
})
export class BotModule {}
