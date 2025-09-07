import { Injectable } from '@nestjs/common';
import {wgApi} from "src/api";

@Injectable()
export class BotService {
    async getAllClients() {
        const clients = await  wgApi.get('/client');
        return clients.data.reverse()
    }

    async getClientById(id: string) {
        const clients = await  wgApi.get(`/client/${id}`);
        return clients.data
    }

    async changeClientStatus(id: string, status: string) {
        const statusChange = await wgApi.post(`/client/${id}/${status}`);
        return statusChange.status === 200
    }

    async renameClient(id: number, name: string) {
        const client = await wgApi.get(`/client/${id}`)
        client.data.name = name
        const result = await wgApi.post(`/client/${id}`, client.data)
        return result.status === 200
    }
}
