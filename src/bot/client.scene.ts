import {Scene, SceneEnter, SceneLeave, Command, Action, Ctx, On, Message} from 'nestjs-telegraf';
import { Context } from 'src/interfaces/context.interface';
import {CLIENT_SCENE_ID} from "src/app.constants";
import {Update as TypeUpdate} from "telegraf/typings/core/types/typegram";
import {BotService} from "src/bot/bot.service";

@Scene(CLIENT_SCENE_ID)
export class ClientScene {
    private page = 0
    private pageSize = 10
    constructor(private readonly botApi: BotService) {
    }

    @SceneEnter()
    async onSceneEnter(@Ctx() ctx: Context) {
        this.page = 0;
        await this.sendClientsPage(ctx);
    }

    @Action(/^page:(\d+)$/)
    async onPageChange(@Ctx() ctx: Context & { update: TypeUpdate.CallbackQueryUpdate },) {
        const cbQuery = ctx.update.callback_query;
        const userAnswer = 'data' in cbQuery ? cbQuery.data : null;
        this.page = +userAnswer?.split(':')[1];
        await this.sendClientsPage(ctx, true);
    }

    private async sendClientsPage(ctx: Context, edit = false) {
        const clients = await this.botApi.getAllClients();
        if (!clients || clients.length === 0) {
            return ctx.reply('🙈 У вас нет клиентов, добавьте их в WG-easy');
        }

        const start = this.page * this.pageSize;
        const end = start + this.pageSize;
        const pageClients = clients.slice(start, end);

        const totalPages = Math.ceil(clients.length / this.pageSize);

        const buttons = pageClients.map(({ name, id }) => [
            { text: `• ${name}`, callback_data: `clientId:${id}` },
        ]);

        const navButtons: any[] = [];
        if (this.page > 0) {
            navButtons.push({ text: 'В начало', callback_data: `page:0` },);
            navButtons.push({ text: '⬅️ Назад', callback_data: `page:${this.page - 1}` });
        }
        if (this.page < totalPages - 1) {
            navButtons.push({ text: 'Вперёд ➡️', callback_data: `page:${this.page + 1}` });
            navButtons.push({ text: 'В конец', callback_data: `page:${this.page + 1}` });
        }
        if (navButtons.length) {
            buttons.push(navButtons);
        }

        const messageText = `<b>Выберите клиента (стр. ${this.page + 1}/${totalPages}) или напишите его имя:</b>`;

        if (edit) {
            await ctx.editMessageText(messageText, {
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: buttons },
            });
        } else {
            await ctx.replyWithHTML(messageText, {
                reply_markup: { inline_keyboard: buttons },
            });
        }
    }

    @On(['text'])
    async onMessage(@Message('text') text: string, @Ctx() ctx: Context) {
        const clients = await this.botApi.getAllClients();
        if (!clients || clients.length === 0) {
            return ctx.reply('🙈 У вас нет клиентов, добавьте их в WG-easy');
        }
        const filteredClients = clients.filter((client: { name: string }) => client.name.toLowerCase().includes(text.toLowerCase()));

        const buttons = filteredClients.map(({ name, id }) => [
            { text: `• ${name}`, callback_data: `clientId:${id}` },
        ]);
        await ctx.replyWithHTML("Найдено по запросу:", {
            reply_markup: { inline_keyboard: buttons },
        });
    }

    @Action(/clientId/)
    async getClientById(
        @Ctx() ctx: Context & { update: TypeUpdate.CallbackQueryUpdate },
    ): Promise<void> {
        const cbQuery = ctx.update.callback_query;
        const userAnswer = 'data' in cbQuery ? cbQuery.data : null;
        const clientId = userAnswer?.split(':')[1];

        await ctx.reply(`clientId ${clientId}`);
    }

    @Command('leave')
    async onLeaveCommand(ctx: Context): Promise<void> {
        await ctx.scene.leave();
    }
}
