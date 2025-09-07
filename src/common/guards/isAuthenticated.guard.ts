import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegrafException, TelegrafExecutionContext } from 'nestjs-telegraf';
import { Context } from 'src/interfaces/context.interface';
import { getUserId } from 'src/common/pipes/user-id.pipe';

const ALLOWED_USERS_IDS: number[] = (process.env.ALLOWED_USERS ?? '')
    .split(',')
    .filter(Boolean) // убираем пустые строки
    .map(id => Number(id.trim()))
    .filter(id => !isNaN(id)); // убираем NaN

@Injectable()
export class IsAuthenticatedGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = TelegrafExecutionContext.create(context);
    const tgCtx = ctx.getContext<Context>();
    const userId = getUserId(tgCtx);

    const isAllowed = ALLOWED_USERS_IDS.includes(userId);

    if (!isAllowed) {
      throw new TelegrafException(
          'Внимание, вы не зарегистрированы в боте. Доступ запрещен!',
      );
    }

    return true;
  }
}
