import { Injectable } from '@nestjs/common';
import {wgApi} from "src/api";

@Injectable()
export class BotService {
    async getAllClients() {
        const clients = await  wgApi.get('/client');
        return clients.data.reverse()
    }
}
