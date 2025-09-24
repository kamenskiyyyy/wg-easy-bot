import {Injectable} from '@nestjs/common';
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

    async getClientByName(clientName: string) {
        const clients = await wgApi.get(`/client`);
        return clients.data.find(({name}) => name.toLowerCase() === clientName.toLowerCase())
    }

    async changeClientStatus(id: string, status: string) {
        const statusChange = await wgApi.post(`/client/${id}/${status}`);
        return statusChange.status === 200
    }

    async renameClient(id: string, name: string) {
        const client = await wgApi.get(`/client/${id}`)
        client.data.name = name
        const result = await wgApi.post(`/client/${id}`, client.data)
        return result.status === 200
    }

    async prolongationClientPeriod(id: string, expiresAt: Date) {
        const client = await wgApi.get(`/client/${id}`)
        client.data.expiresAt = expiresAt
        client.data.enabled = true;
        const result = await wgApi.post(`/client/${id}`, client.data)
        return result.status === 200
    }

    async createClient(name: string, expiresAt: Date) {
        const result = await wgApi.post('/client', {name, expiresAt})
        if (result.status === 200) {
            return await this.getClientByName(name)
        }
    }

    async deleteClient(id: string) {
        const result = await wgApi.delete(`/client/${id}`)
        return result.status === 200
    }

    async getClientConfig(id: string) {
        const config = await wgApi.get(`/client/${id}/configuration`)
        return config.data
    }

    async getClientQr(id: string) {
        const qr = await wgApi.get(`/client/${id}/qrcode.svg`)
        return qr.data
    }
}
