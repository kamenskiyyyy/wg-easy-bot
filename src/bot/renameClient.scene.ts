import {Ctx, Message, On, Scene, SceneEnter} from 'nestjs-telegraf';
import {Context} from 'src/interfaces/context.interface';
import {RENAME_CLIENT_SCENE_ID} from "src/app.constants";
import {BotService} from "src/bot/bot.service";
import {sendMenu} from "src/common/pipes/send-menu.pipe";
import {getClientInfo} from "src/bot/utils";

@Scene(RENAME_CLIENT_SCENE_ID)
export class RenameClientScene {
    private clientId: number;
    private clientName: string;

    constructor(private readonly botApi: BotService) {
    }

    @SceneEnter()
    async onSceneEnter(@Ctx() ctx: Context) {
        this.clientId = ctx.scene.state['clientId'];
        this.clientName = ctx.scene.state['clientName'];
        await ctx.reply(`👀 Введите новое имя клиента`);
        await ctx.reply(this.clientName.trim());
    }


    @On(['text'])
    async onMessage(@Message('text') text: string, @Ctx() ctx: Context) {
        this.clientId = ctx.scene.state['clientId'];
        const result = await this.botApi.renameClient(this.clientId, text);
        const clientInfo = await getClientInfo(this.clientId)
        if (result) {
            await ctx.reply(`👀 Имя клиента ${this.clientName} изменено на ${text}`)
            await ctx.replyWithHTML(clientInfo)
        } else await ctx.reply(`👀 Не удалось изменить имя клиента ${this.clientName}`)
        await ctx.scene.leave();
        await sendMenu(ctx);
    }
}
