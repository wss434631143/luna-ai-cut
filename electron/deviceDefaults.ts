import lunaUltraConfig from './deviceConfigs/luna-ultra.json'
import { scanUsbStorageVolumes, usbStorageOptions } from './usbStorageService'
import type { DeviceDefinition } from '../src/shared/types'

export const DEFAULT_DEVICE = lunaUltraConfig as DeviceDefinition

export function deviceDefinitions(): DeviceDefinition[] {
  return [DEFAULT_DEVICE]
}

export async function deviceDefinitionsWithUsbStorage(): Promise<DeviceDefinition[]> {
  const volumes = await scanUsbStorageVolumes()
  if (volumes.length === 0) return deviceDefinitions()
  return [{
    ...DEFAULT_DEVICE,
    storages: usbStorageOptions(volumes),
  }]
}

export function deviceDefinitionFor(deviceId?: string): DeviceDefinition {
  return deviceDefinitions().find((device) => device.id === deviceId) ?? DEFAULT_DEVICE
}
