import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { LeadsService } from './leads.service';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { AdminCreateLeadDto } from './dto/admin-create-lead.dto';
import { AdminUpdateLeadDto } from './dto/admin-update-lead.dto';
import { AdminUpdateLeadStatusDto } from './dto/admin-update-lead-status.dto';

@Controller('admin/leads')
export class AdminLeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  async findAll() {
    return this.leadsService.findAdminLeads();
  }

  @Get('stats')
  async stats() {
    return this.leadsService.getAdminLeadsStats();
  }

  @Post()
  async create(@Body() dto: AdminCreateLeadDto) {
    return this.leadsService.createAdminLead(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: AdminUpdateLeadDto) {
    return this.leadsService.updateAdminLead(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.leadsService.deleteAdminLead(id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: AdminUpdateLeadStatusDto) {
    return this.leadsService.updateAdminLeadStatus(id, dto);
  }

  @Patch(':id/assign')
  async assign(@Param('id') id: string, @Body() dto: AssignLeadDto) {
    return this.leadsService.assignLead(id, dto);
  }
}
