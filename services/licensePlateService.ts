import { prisma } from "@/lib/prisma";
import { normalizePlate } from "@/lib/utils";
import { logEvent } from "@/services/logService";

export async function listVehicles(search?: string) {
  const query = search?.trim();
  return prisma.vehicle.findMany({
    where: query
      ? {
          OR: [
            { licensePlate: { contains: normalizePlate(query) } },
            { ownerName: { contains: query } },
            { note: { contains: query } }
          ]
        }
      : undefined,
    orderBy: { updatedAt: "desc" }
  });
}

export async function createVehicle(data: {
  licensePlate: string;
  ownerName: string;
  note?: string;
  isAllowed?: boolean;
}) {
  const vehicle = await prisma.vehicle.create({
    data: {
      licensePlate: normalizePlate(data.licensePlate),
      ownerName: data.ownerName.trim(),
      note: data.note?.trim() || null,
      isAllowed: data.isAllowed ?? true
    }
  });
  await logEvent({
    type: "license_plate_added",
    message: `${vehicle.licensePlate} was registered for ${vehicle.ownerName}.`,
    licensePlate: vehicle.licensePlate
  });
  return vehicle;
}

export async function updateVehicle(
  id: string,
  data: Partial<{ licensePlate: string; ownerName: string; note: string | null; isAllowed: boolean }>
) {
  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      licensePlate: data.licensePlate ? normalizePlate(data.licensePlate) : undefined,
      ownerName: data.ownerName?.trim(),
      note: data.note === undefined ? undefined : data.note?.trim() || null,
      isAllowed: data.isAllowed
    }
  });
  await logEvent({
    type: "license_plate_updated",
    message: `${vehicle.licensePlate} was updated by admin.`,
    licensePlate: vehicle.licensePlate
  });
  return vehicle;
}

export async function deleteVehicle(id: string) {
  const vehicle = await prisma.vehicle.delete({ where: { id } });
  await logEvent({
    type: "admin_manual_action",
    message: `${vehicle.licensePlate} was deleted from registered vehicles.`,
    licensePlate: vehicle.licensePlate
  });
  return vehicle;
}

export async function checkVehicleAccess(licensePlate: string) {
  const normalized = normalizePlate(licensePlate);
  const vehicle = await prisma.vehicle.findUnique({ where: { licensePlate: normalized } });
  return {
    normalized,
    vehicle,
    allowed: Boolean(vehicle?.isAllowed)
  };
}
