import {Module} from '@nestjs/common';
import {BotUpdate} from './bot.update';
import {BotService} from './bot.service';
import {ClientScene} from "./client.scene";
import {RenameClientScene} from "src/bot/renameClient.scene";
import {CreateClientScene} from "src/bot/createClient.scene";

@Module({
    providers: [BotUpdate, ClientScene, BotService, RenameClientScene, CreateClientScene],
})
export class BotModule {
}
