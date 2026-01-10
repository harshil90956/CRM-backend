import { IsString, IsUUID } from 'class-validator';

export class AssignLeadDto {
  @IsString()
  @IsUUID()
  assignedToId: string;
}
