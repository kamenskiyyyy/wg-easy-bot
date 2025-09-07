import {Ctx, On, Sender, Start, Update,} from 'nestjs-telegraf';
import * as contextInterface from 'src/interfaces/context.interface';
import {UseFilters, UseGuards} from "@nestjs/common";
import {IsAuthenticatedGuard} from "src/common/guards/isAuthenticated.guard";
import {TelegrafExceptionFilter} from "src/common/filters/telegraf-exception.filter";
import {sendMenu} from "src/common/pipes/send-menu.pipe";

@Update()
@UseFilters(TelegrafExceptionFilter)
export class BotUpdate {
    @Start()
    @UseGuards(IsAuthenticatedGuard)
    async start(@Ctx() ctx: contextInterface.Context, @Sender('first_name') firstName: string) {
        await ctx.reply(`Здравствуйте, ${firstName}! Добро пожаловать в чат-бот WG-easy.`);
        await sendMenu(ctx);
    }

    @UseGuards(IsAuthenticatedGuard)
    @On(['text', 'message', 'callback_query'])
    async onMessage(@Ctx() ctx: contextInterface.Context) {
        await ctx.reply('🙈 Команда не найдена, используйте меню');
        await sendMenu(ctx);
    }
}
