// TODO: Implemented in Phase 7+ after domain blueprint approval

import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ProjectMainType, ProjectStatus } from '@prisma/client';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  createProject(@Body() dto: CreateProjectDto) {
    if (!dto?.name || typeof dto.name !== 'string') {
      return { success: false, message: 'Invalid name' };
    }

    if (!dto?.location || typeof dto.location !== 'string') {
      return { success: false, message: 'Invalid location' };
    }

    if (dto.mainType && !Object.values(ProjectMainType).includes(dto.mainType)) {
      return { success: false, message: 'Invalid mainType' };
    }

    if (dto.status && !Object.values(ProjectStatus).includes(dto.status)) {
      return { success: false, message: 'Invalid status' };
    }

    if (dto.isClosed !== undefined && typeof dto.isClosed !== 'boolean') {
      return { success: false, message: 'Invalid isClosed' };
    }

    if (dto.priceRange !== undefined && typeof dto.priceRange !== 'string') {
      return { success: false, message: 'Invalid priceRange' };
    }

    if (dto.description !== undefined && typeof dto.description !== 'string') {
      return { success: false, message: 'Invalid description' };
    }

    if (dto.tenantId !== undefined && typeof dto.tenantId !== 'string') {
      return { success: false, message: 'Invalid tenantId' };
    }

    return this.projectsService.createProject(dto);
  }

  @Get()
  listProjects() {
    return this.projectsService.listProjects();
  }

  @Patch(':projectId')
  updateProject(@Param('projectId') projectId: string, @Body() dto: UpdateProjectDto) {
    if (!projectId || typeof projectId !== 'string') {
      return { success: false, message: 'Invalid projectId' };
    }

    if (dto.name !== undefined && typeof dto.name !== 'string') {
      return { success: false, message: 'Invalid name' };
    }

    if (dto.location !== undefined && typeof dto.location !== 'string') {
      return { success: false, message: 'Invalid location' };
    }

    if (dto.mainType !== undefined && !Object.values(ProjectMainType).includes(dto.mainType)) {
      return { success: false, message: 'Invalid mainType' };
    }

    if (dto.status !== undefined && !Object.values(ProjectStatus).includes(dto.status)) {
      return { success: false, message: 'Invalid status' };
    }

    if (dto.isClosed !== undefined && typeof dto.isClosed !== 'boolean') {
      return { success: false, message: 'Invalid isClosed' };
    }

    if (dto.priceRange !== undefined && typeof dto.priceRange !== 'string') {
      return { success: false, message: 'Invalid priceRange' };
    }

    if (dto.description !== undefined && typeof dto.description !== 'string') {
      return { success: false, message: 'Invalid description' };
    }

    if (dto.tenantId !== undefined && typeof dto.tenantId !== 'string') {
      return { success: false, message: 'Invalid tenantId' };
    }

    return this.projectsService.updateProject(projectId, dto);
  }

  @Delete(':projectId')
  deleteProject(@Param('projectId') projectId: string) {
    if (!projectId || typeof projectId !== 'string') {
      return { success: false, message: 'Invalid projectId' };
    }

    return this.projectsService.deleteProject(projectId);
  }
}