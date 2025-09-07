import {Action, Ctx, Hears, On, Sender, Start, Update,} from 'nestjs-telegraf';
import {Context} from 'src/interfaces/context.interface';
import {UseFilters, UseGuards} from "@nestjs/common";
import {IsAuthenticatedGuard} from "src/common/guards/isAuthenticated.guard";
import {TelegrafExceptionFilter} from "src/common/filters/telegraf-exception.filter";
import {sendMenu} from "src/common/pipes/send-menu.pipe";
import {BotService} from "src/bot/bot.service";
import process from "node:process";
import { Update as TypeUpdate } from 'telegraf/typings/core/types/typegram';
import {CLIENT_SCENE_ID} from "src/app.constants";

@Update()
@UseFilters(TelegrafExceptionFilter)
export class BotUpdate {
    constructor(private readonly botApi: BotService) {
    }

    @Start()
    @UseGuards(IsAuthenticatedGuard)
    async start(@Ctx() ctx: Context, @Sender('first_name') firstName: string) {
        await ctx.reply(`Здравствуйте, ${firstName}! Добро пожаловать в чат-бот WG-easy.`);
        await sendMenu(ctx);
    }

    @UseGuards(IsAuthenticatedGuard)
    @Hears('📋 Список клиентов')
    async getAllClients(@Ctx() ctx: Context) {
        await ctx.scene.enter(CLIENT_SCENE_ID);
    }

    @UseGuards(IsAuthenticatedGuard)
    @On(['text', 'message', 'callback_query'])
    async onMessage(@Ctx() ctx: Context) {
        await ctx.reply('🙈 Команда не найдена, используйте меню');
        await sendMenu(ctx);
    }
}
