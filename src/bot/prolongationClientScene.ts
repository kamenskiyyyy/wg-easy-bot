import {Action, Ctx, Message, On, Scene, SceneEnter} from 'nestjs-telegraf';
import {Context} from 'src/interfaces/context.interface';
import { PROLONGATION_CLIENT_SCENE_ID} from "src/app.constants";
import {BotService} from "src/bot/bot.service";
import {Update as TypeUpdate} from "telegraf/typings/core/types/typegram";
import {sendMenu} from "src/common/pipes/send-menu.pipe";
import {addDays} from "date-fns";
import {getClientInfo} from "src/bot/utils";

@Scene(PROLONGATION_CLIENT_SCENE_ID)
export class ProlongationClientScene {
    private clientId: string;
    private clientName: string;

    constructor(private readonly botApi: BotService) {
    }

    @SceneEnter()
    async onSceneEnter(@Ctx() ctx: Context) {
        this.clientId = ctx.scene.state['clientId'];
        this.clientName = ctx.scene.state['clientName'];

        const periods = [0, 3, 14, 30, 60, 180, 365]

        await ctx.reply("👀 Выберите срок продления доступа для клиента", {
            reply_markup: {
                inline_keyboard: periods.map((period) => [{
                    text: `${period === 0 ? "Без ограничений" : period + ' дней'}`,
                    callback_data: `periodClient:${period}`
                }])
            }
        });
    }

    @Action(/periodClient/)
    async choosePeriodForClient(
        @Ctx() ctx: Context & { update: TypeUpdate.CallbackQueryUpdate },
    ): Promise<void> {
        const cbQuery = ctx.update.callback_query;
        const userAnswer = 'data' in cbQuery ? cbQuery.data : null;
        const period = +userAnswer?.split(':')[1];

        const expiresAt = period === 0 ? null : addDays(new Date(), +period);

        const result = await this.botApi.prolongationClientPeriod(this.clientId, expiresAt)
        const clientInfo = await getClientInfo(this.clientId)
        if (result) {
            await ctx.reply(`✅ Доступ для клиента ${this.clientName} успешно продлен`)
            await ctx.replyWithHTML(clientInfo)
        } else await ctx.reply(`😭Не удалось продлить доступ для клиента`);
        await sendMenu(ctx);
        await ctx.scene.leave();
    }
}
