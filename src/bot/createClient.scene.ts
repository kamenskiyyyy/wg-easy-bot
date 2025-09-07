import {Action, Ctx, Message, On, Scene, SceneEnter} from 'nestjs-telegraf';
import {Context} from 'src/interfaces/context.interface';
import {CREATE_CLIENT_SCENE_ID} from "src/app.constants";
import {BotService} from "src/bot/bot.service";
import {Update as TypeUpdate} from "telegraf/typings/core/types/typegram";
import {sendMenu} from "src/common/pipes/send-menu.pipe";
import {addDays} from "date-fns";

@Scene(CREATE_CLIENT_SCENE_ID)
export class CreateClientScene {
    clientName: string;

    constructor(private readonly botApi: BotService) {
    }

    @SceneEnter()
    async onSceneEnter(@Ctx() ctx: Context) {
        await ctx.reply(`👀 Введите имя нового клиента`);
    }

    @On(['text'])
    async onMessage(@Message('text') text: string, @Ctx() ctx: Context) {
        this.clientName = text;

        const periods = [0, 3, 14, 30, 60, 180, 365]

        await ctx.reply("Выберите период для клиента", {
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

        const result = await this.botApi.createClient(this.clientName, expiresAt)
        if (result) {
            await ctx.reply(`✅ Клиент ${this.clientName} успешно создан`)
        } else await ctx.reply(`😭 Не удалось создать клиента`);
        await sendMenu(ctx);
        await ctx.scene.leave();
    }
}
