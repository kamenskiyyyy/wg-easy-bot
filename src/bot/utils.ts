import {format} from "date-fns";
import {BotService} from "src/bot/bot.service";

export const getClientInfo = async (clientId: number) => {
    const botApi = new BotService();
    const client = await botApi.getClientById(clientId);

    return `Клиент: ${client.name}

ID: ${client.id}
Доступ: ${client.expiresAt ? `до ${format(new Date(client.expiresAt), 'dd.MM.yyyy')}` : 'Не ограничен'}
IPv4: ${client.ipv4Address}
Статус: ${client.enabled ? '✅ Включен' : '❌ Выключен'}
Дата создания: ${format(new Date(client.createdAt), 'dd.MM.yyyy')}`
}
