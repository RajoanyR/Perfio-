import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Public } from './common/security/public.decorator.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Point de contrôle public (santé du serveur). Toutes les autres routes exigent un JWT.
  @Public()
  @Get()
  getHello() {
    return this.appService.getHello();
  }
}