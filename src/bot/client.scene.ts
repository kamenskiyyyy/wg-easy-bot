import {Action, Command, Ctx, Message, On, Scene, SceneEnter} from 'nestjs-telegraf';
import {Context} from 'src/interfaces/context.interface';
import {CLIENT_SCENE_ID, PROLONGATION_CLIENT_SCENE_ID, RENAME_CLIENT_SCENE_ID} from "src/app.constants";
import {Update as TypeUpdate} from "telegraf/typings/core/types/typegram";
import {BotService} from "src/bot/bot.service";
import {sendMenu} from "src/common/pipes/send-menu.pipe";
import {format} from "date-fns";
import sharp from "sharp";
import {getClientInfo} from "src/bot/utils";

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

        const buttons = pageClients.map(({name, id, enabled}) => [
            {text: `• ${name} ${enabled ? "" : "🚫"}`, callback_data: `clientId:${id}`},
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
            await ctx.scene.leave();
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
        const clientId = +userAnswer?.split(':')[1];

        const client = await this.botApi.getClientById(clientId);
        const message = await getClientInfo(clientId)

        let statusButton = []
        if (client.enabled) {
            statusButton = [{text: '❌ Отключить', callback_data: `statusClient:${client.id}:disable`,},]
        } else {
            statusButton = [{text: '✅ Включить', callback_data: `statusClient:${client.id}:enable`,},]
        }

        await ctx.replyWithHTML(message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{text: '📄 Получить конфиг', callback_data: `getConfigFileClient:${client.id}:${client.name}`,},],
                    [{text: '📷 QR код', callback_data: `getQRClient:${client.id}:${client.name}`,},],
                    [{text: '✍🏻 Редактировать имя', callback_data: `renameClient:${client.id}:${client.name}`,},],
                    statusButton,
                    [{text: '📈 Продлить', callback_data: `prolongationClient:${client.id}:${client.name}`,},],
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
        const clientId = +userAnswer?.split(':')[1];
        const action = userAnswer?.split(':')[2];
        const result = await this.botApi.changeClientStatus(clientId, action);
        const clientInfo = await getClientInfo(clientId)
        if (result) {
            await ctx.reply('Статус клиента изменён!');
            await ctx.replyWithHTML(clientInfo)
        } else {
            await ctx.reply('🙈 Что-то пошло не так, попробуйте позже');
        }
        await ctx.scene.leave();
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

    @Action(/prolongationClient/)
    async prolongationClientPeriod(
        @Ctx() ctx: Context & { update: TypeUpdate.CallbackQueryUpdate },
    ): Promise<void> {
        const cbQuery = ctx.update.callback_query;
        const userAnswer = 'data' in cbQuery ? cbQuery.data : null;
        const clientId = userAnswer?.split(':')[1];
        const clientName = userAnswer?.split(':')[2];
        await ctx.scene.enter(PROLONGATION_CLIENT_SCENE_ID, {clientId, clientName});
    }

    @Action(/deleteClient/)
    async deleteClient(
        @Ctx() ctx: Context & { update: TypeUpdate.CallbackQueryUpdate },
    ): Promise<void> {
        const cbQuery = ctx.update.callback_query;
        const userAnswer = 'data' in cbQuery ? cbQuery.data : null;
        const clientId = userAnswer?.split(':')[1];

        const result = await this.botApi.deleteClient(clientId);
        if (result) {
            await ctx.reply("🗑️ Клиент удалён!");
        } else {
            await ctx.reply('🙈 Что-то пошло не так, попробуйте позже');
        }
        await ctx.scene.leave();
        await sendMenu(ctx);
    }

    @Action(/getConfigFileClient/)
    async getConfigurationFileClient(
        @Ctx() ctx: Context & { update: TypeUpdate.CallbackQueryUpdate },
    ): Promise<void> {
        const cbQuery = ctx.update.callback_query;
        const userAnswer = 'data' in cbQuery ? cbQuery.data : null;
        const clientId = userAnswer?.split(':')[1];
        const clientName = userAnswer?.split(':')[2];

        const config = await this.botApi.getClientConfig(clientId);

        await ctx.replyWithDocument(
            {
                source: Buffer.from(config, 'utf-8'),
                filename: 'vpn.conf',
            },
            { caption: `Конфигурационный файл VPN для ${clientName}. Необходимо зайти в приложение WireGuard и выбрать опцию "Создать из файла"` }
        );
        await ctx.scene.leave();
        await sendMenu(ctx);
    }

    @Action(/getQRClient/)
    async getQrCodeForClient(
        @Ctx() ctx: Context & { update: TypeUpdate.CallbackQueryUpdate },
    ): Promise<void> {
        const cbQuery = ctx.update.callback_query;
        const userAnswer = 'data' in cbQuery ? cbQuery.data : null;
        const clientId = userAnswer?.split(':')[1];
        const clientName = userAnswer?.split(':')[2];

        const svgText = await this.botApi.getClientQr(clientId);

        const pngBuffer = await sharp(Buffer.from(svgText))
            .resize(800, 800)
            .png()
            .toBuffer();

        // Отправляем как фото
        await ctx.replyWithPhoto(
            { source: pngBuffer },
            { caption: `QR-код VPN для ${clientName}. Необходимо зайти в приложение WireGuard и выбрать опцию "Создать из QR-кода"` },
        );
        await ctx.scene.leave();
        await sendMenu(ctx);
    }
}
