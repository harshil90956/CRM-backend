import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(@UploadedFile() file: { buffer?: Buffer } | undefined) {
    if (!file?.buffer) {
      throw new BadRequestException('CSV file is required');
    }
    return this.leadsService.importCsv(file.buffer);
  }
}
