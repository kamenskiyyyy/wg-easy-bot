import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_TOKEN!,
      include: [BotModule]
    }),
    BotModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
