-- AlterTable
ALTER TABLE `Booking` ADD COLUMN `approvedAt` DATETIME(3) NULL,
    ADD COLUMN `cancellationReason` VARCHAR(191) NULL,
    ADD COLUMN `cancelledAt` DATETIME(3) NULL,
    ADD COLUMN `customerEmail` VARCHAR(191) NULL,
    ADD COLUMN `customerName` VARCHAR(191) NULL,
    ADD COLUMN `customerPhone` VARCHAR(191) NULL,
    ADD COLUMN `holdExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `managerNotes` VARCHAR(191) NULL,
    ADD COLUMN `notes` VARCHAR(191) NULL,
    ADD COLUMN `rejectedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `notes` VARCHAR(191) NULL,
    ADD COLUMN `paidAt` DATETIME(3) NULL,
    ADD COLUMN `paymentType` VARCHAR(191) NULL,
    ADD COLUMN `receiptNo` VARCHAR(191) NULL,
    ADD COLUMN `refundRefId` VARCHAR(191) NULL;
