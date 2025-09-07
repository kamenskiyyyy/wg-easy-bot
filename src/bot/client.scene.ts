import {Scene, SceneEnter, SceneLeave, Command, Action, Ctx} from 'nestjs-telegraf';
import { Context } from 'src/interfaces/context.interface';
import {CLIENT_SCENE_ID} from "src/app.constants";
import {Update as TypeUpdate} from "telegraf/typings/core/types/typegram";
import {BotService} from "src/bot/bot.service";

@Scene(CLIENT_SCENE_ID)
export class ClientScene {
    constructor(private readonly botApi: BotService) {}
    @SceneEnter()
    async onSceneEnter(@Ctx() ctx: Context) {
        const clients = await this.botApi.getAllClients();
        if (clients.length === 0) {
            await ctx.reply('🙈 У вас нет клиентов, добавьте их в WG-easy');
        }

        await ctx.replyWithHTML('<b>Выберите клиента:</b>', {
            reply_markup: {
                inline_keyboard: clients.map(({name, id}) => [{text: `• ${name}`, callback_data: `clientId:${id}`,}])
            },
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
