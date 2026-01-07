import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { CoreModule } from './core/core.module';
import { HealthModule } from './modules/health/health.module';
import { BookingsModule } from './modules/bookings/bookings.module';

@Module({
  imports: [ConfigModule, CoreModule, HealthModule, BookingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
