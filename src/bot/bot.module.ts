import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { BotService } from './bot.service';
import {ClientScene} from "./client.scene";

@Module({
  providers: [BotUpdate, ClientScene, BotService ],
})
export class BotModule {}
