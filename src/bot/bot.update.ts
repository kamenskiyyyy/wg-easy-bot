import {Ctx, Hears, On, Sender, Start, Update,} from 'nestjs-telegraf';
import {Context} from 'src/interfaces/context.interface';
import {UseFilters, UseGuards} from "@nestjs/common";
import {IsAuthenticatedGuard} from "src/common/guards/isAuthenticated.guard";
import {TelegrafExceptionFilter} from "src/common/filters/telegraf-exception.filter";
import {sendMenu} from "src/common/pipes/send-menu.pipe";
import {CLIENT_SCENE_ID, CREATE_CLIENT_SCENE_ID, SETUP_BLOCK_CLIENTS_SCENE_ID} from "src/app.constants";

@Update()
@UseFilters(TelegrafExceptionFilter)
export class BotUpdate {
    constructor() {}

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
    @Hears('💁🏼‍♂️ Создать клиента')
    async createClient(@Ctx() ctx: Context) {
        await ctx.scene.enter(CREATE_CLIENT_SCENE_ID);
    }

    @UseGuards(IsAuthenticatedGuard)
    @Hears('🚫 Заблокировать всех клиентов')
    async blockAllClients(@Ctx() ctx: Context) {
        await ctx.scene.enter(SETUP_BLOCK_CLIENTS_SCENE_ID);
    }

    @UseGuards(IsAuthenticatedGuard)
    @On(['text', 'message', 'callback_query'])
    async onMessage(@Ctx() ctx: Context) {
        await ctx.reply('🙈 Команда не найдена, используйте меню');
        await sendMenu(ctx);
    }
}
