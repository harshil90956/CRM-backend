-- AlterTable
ALTER TABLE `Review` MODIFY `type` ENUM('property', 'agent', 'project') NOT NULL;
