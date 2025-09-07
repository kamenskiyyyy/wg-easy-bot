import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class FormatClientTextPipe implements PipeTransform {
  transform(value: string): string {
    return value.trim();
  }
}
