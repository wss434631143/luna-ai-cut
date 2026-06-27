import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { UsbDeviceCandidate } from '../src/shared/types'

const execFileAsync = promisify(execFile)

interface SystemProfilerUsbNode {
  _name?: string
  manufacturer?: string
  serial_num?: string
  vendor_id?: string
  product_id?: string
  bcd_device?: string
  Media?: unknown
  _items?: SystemProfilerUsbNode[]
}

interface SystemProfilerUsbPayload {
  SPUSBDataType?: SystemProfilerUsbNode[]
}

const CAMERA_KEYWORDS = [
  'insta360',
  'arashi',
  'luna',
  'ptp',
  'mtp',
  'still image',
  'digital still camera',
]

function isAppleInternalDevice(name: string, manufacturer: string, busName: string): boolean {
  const text = `${name} ${manufacturer} ${busName}`.toLowerCase()
  return text.includes('apple') || text.includes('built-in') || text.includes('internal')
}

function matchesCameraDevice(name: string, manufacturer: string, busName: string, searchText: string): boolean {
  if (CAMERA_KEYWORDS.some((keyword) => searchText.includes(keyword))) return true
  if (!searchText.includes('camera')) return false
  return !isAppleInternalDevice(name, manufacturer, busName)
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function flattenUsbNodes(nodes: SystemProfilerUsbNode[] | undefined, busName = ''): UsbDeviceCandidate[] {
  if (!nodes?.length) return []

  const result: UsbDeviceCandidate[] = []
  for (const node of nodes) {
    const name = normalizeText(node._name)
    const manufacturer = normalizeText(node.manufacturer)
    const serialNumber = normalizeText(node.serial_num)
    const vendorId = normalizeText(node.vendor_id)
    const productId = normalizeText(node.product_id)
    const productVersion = normalizeText(node.bcd_device)
    const currentBusName = name && !vendorId && !productId ? name : busName
    const searchText = [
      name,
      manufacturer,
      serialNumber,
      vendorId,
      productId,
      currentBusName,
      node.Media ? 'media' : '',
    ].join(' ').toLowerCase()

    if (name && (vendorId || productId || manufacturer)) {
      const matched = matchesCameraDevice(name, manufacturer, currentBusName, searchText)
      if (matched) {
        result.push({
          id: `${vendorId || 'unknown'}:${productId || 'unknown'}:${serialNumber || name}`,
          name,
          manufacturer,
          serialNumber,
          vendorId,
          productId,
          productVersion,
          busName: currentBusName,
          transport: 'usb',
          matched,
          source: 'system_profiler',
        })
      }
    }

    result.push(...flattenUsbNodes(node._items, currentBusName))
  }
  return result
}

function uniqueDevices(devices: UsbDeviceCandidate[]): UsbDeviceCandidate[] {
  const seen = new Set<string>()
  return devices.filter((device) => {
    const key = `${device.vendorId}:${device.productId}:${device.serialNumber}:${device.name}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function scanUsbDevices(): Promise<UsbDeviceCandidate[]> {
  if (process.platform !== 'darwin') {
    return []
  }

  const { stdout } = await execFileAsync('/usr/sbin/system_profiler', ['SPUSBDataType', '-json'], {
    maxBuffer: 8 * 1024 * 1024,
    timeout: 15_000,
  })
  const payload = JSON.parse(stdout) as SystemProfilerUsbPayload
  return uniqueDevices(flattenUsbNodes(payload.SPUSBDataType))
}
