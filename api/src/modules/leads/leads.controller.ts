import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  async create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(createLeadDto);
  }

  @Patch(':id/assign')
  async assignLead(@Param('id') id: string, @Body() assignLeadDto: AssignLeadDto) {
    return this.leadsService.assignLead(id, assignLeadDto);
  }

  @Get()
  async findAll() {
    return this.leadsService.findAll();
  }
}
