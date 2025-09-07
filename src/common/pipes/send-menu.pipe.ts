import { Context } from 'src/interfaces/context.interface';
import { Markup } from 'telegraf';

export const sendMenu = async (ctx: Context) => {
  await ctx.reply(
    'Меню',
    Markup.keyboard([["💁🏼‍♂️ Создать клиента"], ["📋 Список клиентов"]])
      .oneTime()
      .resize()
      .placeholder('Выберите пункт меню'),
  );
};
