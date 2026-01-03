import {Action, Ctx, Message, On, Scene, SceneEnter} from 'nestjs-telegraf';
import {Context} from 'src/interfaces/context.interface';
import {SETUP_BLOCK_CLIENTS_SCENE_ID} from "src/app.constants";
import {BotService} from "src/bot/bot.service";
import {sendMenu} from "src/common/pipes/send-menu.pipe";
import {format} from "date-fns";
import {ru} from "date-fns/locale/ru";

@Scene(SETUP_BLOCK_CLIENTS_SCENE_ID)
export class SetupBlockClients {
    private blockDate: Date;

    constructor(private readonly botApi: BotService) {
    }

    @SceneEnter()
    async onSceneEnter(@Ctx() ctx: Context) {
        await ctx.reply("👀 Введите дату блокировки доступа для всех клиентов в формате dd.mm.yyyy");
    }

    @On(['message'])
    async chooseDataForBlockClients(@Message('text') text: string,
                                    @Ctx() ctx: Context
    ): Promise<void> {
        this.blockDate = new Date(text);
        const blockDateFormated = format(new Date(this.blockDate), "d MMMM yyyy", {
            locale: ru
        })

        await ctx.reply(`Вы ввели дату блокировки: ${blockDateFormated}, подтвердите:`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: '✅Подтвердить', callback_data: 'confirm_block_date'},
                        {text: '❌Отмена', callback_data: 'cancel_block_date'}
                    ]
                ]
            }
        })
    }

    @Action(/confirm_block_date/)
    async confirmBlockDate(@Ctx() ctx: Context) {
        const blockDateFormated = format(new Date(this.blockDate), "d MMMM yyyy", {
            locale: ru
        })
        await ctx.reply('🏁 Запускаем шарманку')
        await this.botApi.blockAllClients(this.blockDate)
        await ctx.reply(`✅ Все клиенты будут заблокированы: ${blockDateFormated}`)
    }

    @Action(/cancel_block_date/)
    async cancelBlockDate(@Ctx() ctx: Context) {
        await ctx.reply(`❌ Вы отменили блокировку`)
        await sendMenu(ctx);
        await ctx.scene.leave();
    }
}
