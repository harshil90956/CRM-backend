import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export type LeadPermissionsConfig = {
  managerCanEdit: boolean;
  managerCanDelete: boolean;
};

const DEFAULT_CONFIG: LeadPermissionsConfig = {
  managerCanEdit: true,
  managerCanDelete: true,
};

@Injectable()
export class LeadPermissionsService {
  private cached: LeadPermissionsConfig | null = null;

  private getFilePath(): string {
    // Stored outside src so it survives builds; location is relative to api/ working dir.
    return path.resolve(process.cwd(), '.data', 'lead-permissions.json');
  }

  private ensureDirExists(filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private readFromDisk(): LeadPermissionsConfig {
    const filePath = this.getFilePath();
    try {
      if (!fs.existsSync(filePath)) {
        return { ...DEFAULT_CONFIG };
      }
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<LeadPermissionsConfig>;
      return {
        managerCanEdit: parsed.managerCanEdit ?? DEFAULT_CONFIG.managerCanEdit,
        managerCanDelete: parsed.managerCanDelete ?? DEFAULT_CONFIG.managerCanDelete,
      };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  private writeToDisk(cfg: LeadPermissionsConfig) {
    const filePath = this.getFilePath();
    this.ensureDirExists(filePath);
    fs.writeFileSync(filePath, JSON.stringify(cfg, null, 2), 'utf8');
  }

  getConfig(): LeadPermissionsConfig {
    if (!this.cached) {
      this.cached = this.readFromDisk();
    }
    return this.cached;
  }

  updateConfig(input: Partial<LeadPermissionsConfig>): LeadPermissionsConfig {
    const next: LeadPermissionsConfig = {
      ...this.getConfig(),
      ...(input.managerCanEdit === undefined ? {} : { managerCanEdit: input.managerCanEdit }),
      ...(input.managerCanDelete === undefined ? {} : { managerCanDelete: input.managerCanDelete }),
    };

    this.cached = next;
    this.writeToDisk(next);
    return next;
  }
}
