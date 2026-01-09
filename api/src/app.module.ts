import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from './config/config.module';
import { CoreModule } from './core/core.module';

import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { LeadsModule } from './modules/leads/leads.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { StaffModule } from './modules/staff/staff.module';
import { UnitsModule } from './modules/units/units.module';
import { ProjectsModule } from './modules/projects/projects.module';

@Module({
  imports: [
    ConfigModule,
    CoreModule,
    HealthModule,
    AuthModule,
    BookingsModule,
    LeadsModule,
    PaymentsModule,
    StaffModule,
    UnitsModule, // REQUIRED (Dev-B fix)
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}