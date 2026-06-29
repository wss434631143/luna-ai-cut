import { useEffect, useState } from 'react'
import { Cable, CheckCircle2, HelpCircle, MonitorCog, PlugZap, RefreshCw } from 'lucide-react'

import type { AppSettings, ConnectionStatus, DeviceConnectionPhase, DeviceDefinition, UsbDeviceCandidate } from '../shared/types'
import { Alert, Button } from '../ui'
import { HelpDialog } from '../components/HelpDialog'
import '../styles/wifi.css'
import lunaIcon from '/luna-icon.png'

interface DeviceConnectPageProps {
  activeDevice?: DeviceDefinition
  connection: ConnectionStatus | null
  phase: DeviceConnectionPhase
  settings: AppSettings | null
  onConnect: () => Promise<void>
}

export function DeviceConnectPage({
  activeDevice,
  connection,
  phase,
  settings,
  onConnect,
}: DeviceConnectPageProps) {
  const [connecting, setConnecting] = useState(false)
  const [usbScanning, setUsbScanning] = useState(false)
  const [usbDevices, setUsbDevices] = useState<UsbDeviceCandidate[]>([])
  const [usbMessage, setUsbMessage] = useState('正在检测数据线连接...')
  const isChecking = phase === 'checking'
  const isError = phase === 'error'
  const deviceName = activeDevice?.name ?? '设备'

  useEffect(() => {
    void scanUsb()
  }, [])

  async function scanUsb(): Promise<void> {
    setUsbScanning(true)
    try {
      const devices = await window.luna.scanUsbDevices()
      setUsbDevices(devices)
      setUsbMessage(devices.length > 0 ? '已识别到数据线存储或设备' : '暂未识别到数据线存储')
    } catch (error) {
      setUsbDevices([])
      setUsbMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setUsbScanning(false)
    }
  }

  async function handleConnect(): Promise<void> {
    setConnecting(true)
    try {
      await onConnect()
    } finally {
      setConnecting(false)
    }
  }

  return (
    <section className="device-connect-page">
      <div className="device-connect-content">
        <div className="device-connect-icon">
          <img src={lunaIcon} alt="Luna" className="device-connect-logo" />
        </div>

        <h1>{isChecking ? `正在连接 ${deviceName}` : isError ? `未连接 ${deviceName}` : `连接 ${deviceName}`}</h1>

        {isError && connection?.message ? (
          <Alert variant="error" message={connection.message} />
        ) : (
          <p className="device-connect-desc">
            {isChecking
              ? '正在唤醒设备、检测 Wi-Fi 服务并建立控制会话'
              : connection?.message ?? ''}
          </p>
        )}

        <div className="device-connect-meta">
          <span>
            <PlugZap size={14} />
            {settings?.cameraHost ?? activeDevice?.defaultHost ?? '未配置'}
          </span>
          {connection?.httpOk && connection.controlOk && (
            <span>
              <CheckCircle2 size={14} />
              已检测到服务
            </span>
          )}
          {connection?.usbOk && (
            <span>
              <CheckCircle2 size={14} />
              已检测到 {connection.usbStorageCount ?? 0} 个数据线存储
            </span>
          )}
        </div>

        <div className="device-connect-actions">
          <Button
            variant="primary"
            onClick={handleConnect}
            disabled={connecting || isChecking}
            icon={connecting || isChecking ? <RefreshCw className="spin" size={16} /> : <RefreshCw size={16} />}
          >
            {isError ? '重新连接' : '开始连接'}
          </Button>
          <Button variant="secondary" onClick={() => window.luna.openWifiSettings()} icon={<MonitorCog size={16} />}>
            打开 Wi-Fi 设置
          </Button>
        </div>

        <div className="device-usb-panel">
          <div className="device-usb-heading">
            <span>
              <Cable size={15} />
              数据线连接
            </span>
            <button type="button" onClick={() => void scanUsb()} disabled={usbScanning}>
              <RefreshCw size={13} className={usbScanning ? 'spin' : undefined} />
              刷新
            </button>
          </div>
          {usbDevices.length > 0 ? (
            <div className="device-usb-list">
              {usbDevices.map((device) => (
                <div className="device-usb-item" key={device.id}>
                  <strong>{device.name}</strong>
                  <span>
                    {[
                      device.manufacturer || '未知厂商',
                      device.mountPath,
                      device.busName,
                    ].filter(Boolean).join(' · ')}
                  </span>
                  {(device.vendorId || device.productId || device.serialNumber) && (
                    <em>
                      {[device.vendorId, device.productId, device.serialNumber].filter(Boolean).join(' · ')}
                    </em>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="device-usb-empty">{usbMessage}</p>
          )}
          <p className="device-usb-note">
            Windows 文件传输模式会动态识别相机挂载出的内部存储和 SD 卡，不依赖固定盘符。
          </p>
        </div>
        <p className="device-connect-tip">
          Wi-Fi 连接仍可继续使用；数据线模式会直接读取 Windows 里出现的相机存储
        </p>
        <div className="device-connect-help">
          <HelpDialog>
            <button className="device-help-btn" title="帮助与反馈">
              <HelpCircle size={14} />
              帮助与反馈
            </button>
          </HelpDialog>
        </div>
      </div>
    </section>
  )
}
