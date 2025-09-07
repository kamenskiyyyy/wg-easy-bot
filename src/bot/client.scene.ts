import {Action, Command, Ctx, Message, On, Scene, SceneEnter} from 'nestjs-telegraf';
import {Context} from 'src/interfaces/context.interface';
import {CLIENT_SCENE_ID, RENAME_CLIENT_SCENE_ID} from "src/app.constants";
import {Update as TypeUpdate} from "telegraf/typings/core/types/typegram";
import {BotService} from "src/bot/bot.service";
import {sendMenu} from "src/common/pipes/send-menu.pipe";

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

    @Command('leave')
    async onLeaveCommand(ctx: Context): Promise<void> {
        await ctx.scene.leave();
        await sendMenu(ctx);
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

        const buttons = pageClients.map(({name, id}) => [
            {text: `• ${name}`, callback_data: `clientId:${id}`},
        ]);

        const navButtons: any[] = [];
        if (this.page > 0) {
            navButtons.push({text: 'В начало', callback_data: `page:0`},);
            navButtons.push({text: '⬅️ Назад', callback_data: `page:${this.page - 1}`});
        }
        if (this.page < totalPages - 1) {
            navButtons.push({text: 'Вперёд ➡️', callback_data: `page:${this.page + 1}`});
            navButtons.push({text: 'В конец', callback_data: `page:${this.page + 1}`});
        }
        if (navButtons.length) {
            buttons.push(navButtons);
        }

        const messageText = `<b>Выберите клиента (стр. ${this.page + 1}/${totalPages}) или напишите его имя:</b>`;

        if (edit) {
            await ctx.editMessageText(messageText, {
                parse_mode: 'HTML',
                reply_markup: {inline_keyboard: buttons},
            });
        } else {
            await ctx.replyWithHTML(messageText, {
                reply_markup: {inline_keyboard: buttons},
            });
        }
    }

    @On(['message'])
    async onMessage(@Message('text') text: string, @Ctx() ctx: Context) {
        const clients = await this.botApi.getAllClients();
        if (!clients || clients.length === 0) {
            return ctx.reply('🙈 У вас нет клиентов, добавьте их в WG-easy');
        }
        const filteredClients = clients.filter((client: {
            name: string
        }) => client.name.toLowerCase().includes(text.toLowerCase()));

        if (filteredClients.length === 0) {
            await ctx.reply("🙈 Клиент не найден")
            await sendMenu(ctx);
            return;
        }

        const buttons = filteredClients.map(({name, id}) => [
            {text: `• ${name}`, callback_data: `clientId:${id}`},
        ]);
        await ctx.replyWithHTML("Найдено по запросу:", {
            reply_markup: {inline_keyboard: buttons},
        });
    }

    @Action(/clientId/)
    async getClientById(
        @Ctx() ctx: Context & { update: TypeUpdate.CallbackQueryUpdate },
    ): Promise<void> {
        const cbQuery = ctx.update.callback_query;
        const userAnswer = 'data' in cbQuery ? cbQuery.data : null;
        const clientId = userAnswer?.split(':')[1];

        const client = await this.botApi.getClientById(clientId);

        const message = `<b>💻 Клиент:</b> ${client.name}

<b>🆔 ID:</b> ${client.id}
<b>🌐 IPv4:</b> <code>${client.ipv4Address}</code>
<b>⚡ Статус:</b> ${client.enabled ? '✅ Включен' : '❌ Выключен'}
<b>📅 Дата создания:</b> ${client.createdAt}`;

        let statusButton = []
        if (client.enabled) {
            statusButton = [{text: '❌ Отключить', callback_data: `statusClient:${client.id}:disable`,},]
        } else {
            statusButton = [{text: '✅ Включить', callback_data: `statusClient:${client.id}:enable`,},]
        }

        await ctx.replyWithHTML(message.trim(), {
            reply_markup: {
                inline_keyboard: [
                    [{text: '📝 Редактировать имя', callback_data: `renameClient:${client.id}:${client.name}`,},],
                    statusButton,
                    [{text: '📈 Продлить', callback_data: `prolungareClient:${client.id}`,},],
                    [{text: '🗑️ Удалить', callback_data: `deleteClient:${client.id}`,},],
                ],
            }
        });
    }

    @Action(/statusClient/)
    async changeClientStatus(
        @Ctx() ctx: Context & { update: TypeUpdate.CallbackQueryUpdate },
    ): Promise<void> {
        const cbQuery = ctx.update.callback_query;
        const userAnswer = 'data' in cbQuery ? cbQuery.data : null;
        const clientId = userAnswer?.split(':')[1];
        const action = userAnswer?.split(':')[2];
        const result = await this.botApi.changeClientStatus(clientId, action);
        if (result) {
            await ctx.reply('Статус клиента изменён!');
        } else {
            await ctx.reply('🙈 Что-то пошло не так, попробуйте позже');
        }
        await sendMenu(ctx);
    }

    @Action(/renameClient/)
    async renameClientName(
        @Ctx() ctx: Context & { update: TypeUpdate.CallbackQueryUpdate },
    ): Promise<void> {
        const cbQuery = ctx.update.callback_query;
        const userAnswer = 'data' in cbQuery ? cbQuery.data : null;
        const clientId = userAnswer?.split(':')[1];
        const clientName = userAnswer?.split(':')[2];
        await ctx.scene.enter(RENAME_CLIENT_SCENE_ID, {clientId, clientName});
    }


}
