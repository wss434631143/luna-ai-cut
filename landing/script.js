// Luna AI Cut — Landing Page Script
//
// 每次本地发版后，deploy-release.sh 会自动更新下方
// LATEST_RELEASE 中的地址，确保首页展示最新下载链接。
// ============================================================

// ★ 由 deploy-release.sh 自动更新 ★
const LATEST_RELEASE = {
  tag: 'v1.2.14',
  mac_x64: 'https://github.com/wss434631143/luna-ai-cut/releases/download/v1.2.14/LunaAICut-Mac-1.2.14-x64-Installer.dmg',
  mac_arm64: 'https://github.com/wss434631143/luna-ai-cut/releases',
  win_x64: 'https://github.com/wss434631143/luna-ai-cut/releases',
}

// ── 版本号渲染 ──────────────────────────────────────────
const versionEl = document.getElementById('current-version')
if (versionEl) versionEl.textContent = LATEST_RELEASE.tag

// ── 地区检测 ──────────────────────────────────────────
const isChineseUser =
  navigator.language.startsWith('zh') ||
  (navigator.languages && navigator.languages.some((l) => l.startsWith('zh')))

// ── 工具函数 ──────────────────────────────────────────
function isDmg(name) {
  return /\.dmg$/i.test(name)
}
function isSetupExe(name) {
  return /Setup.*\.exe$/i.test(name) || /LunaAICut.*\.exe$/i.test(name)
}

// ── DOM 引用 ──────────────────────────────────────────
const macX64Card = document.getElementById('dl-mac-x64')
const macArm64Card = document.getElementById('dl-mac-arm64')
const winCard = document.getElementById('dl-win')
const macX64Region = document.getElementById('dl-mac-x64-region')
const macArm64Region = document.getElementById('dl-mac-arm64-region')
const winRegion = document.getElementById('dl-win-region')

document.addEventListener('DOMContentLoaded', () => {
  // ── 平滑滚动 ──
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'))
      if (target) {
        e.preventDefault()
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  })

  // ── 当前日期 ──
  const dateEl = document.getElementById('mockup-date')
  if (dateEl) {
    const now = new Date()
    dateEl.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
  }

  // ── 设置下载链接 ──
  setDownloadLinks()
})

// ── 根据地区设置下载链接 ──────────────────────────────
function setDownloadLinks() {
  const ua = navigator.userAgent.toLowerCase()
  const isMac = /macintosh|mac os x/.test(ua)

  // 高亮当前平台
  if (isMac && macX64Card) {
    macX64Card.style.borderColor = '#2997ff'
    macX64Card.style.background = 'rgba(41, 151, 255, 0.08)'
  } else if (!isMac && winCard) {
    winCard.style.borderColor = '#2997ff'
    winCard.style.background = 'rgba(41, 151, 255, 0.08)'
  }

  // 优先使用 embed 的地址，否则 fallback 到 GitHub Release 页
  const releaseUrl = 'https://github.com/wss434631143/luna-ai-cut/releases'
  const macX64Url = LATEST_RELEASE.mac_x64 || releaseUrl
  const macArm64Url = LATEST_RELEASE.mac_arm64 || releaseUrl
  const winUrl = LATEST_RELEASE.win_x64 || releaseUrl

  // 地区标记文字
  const regionLabel = 'GitHub Release'
  const buildLabel = '源码打包'

  if (macX64Card) {
    macX64Card.href = macX64Url
  }
  if (macArm64Card) {
    macArm64Card.href = macArm64Url
  }
  if (winCard) {
    winCard.href = winUrl
  }
  if (macX64Region) {
    macX64Region.textContent = regionLabel
  }
  if (macArm64Region) {
    macArm64Region.textContent = buildLabel
  }
  if (winRegion) {
    winRegion.textContent = buildLabel
  }

  // ── API Fallback ──
  fetchGitHubRelease()
}

// ── GitHub API: 获取最新 Release ──────────────────────
function fetchGitHubRelease() {
  fetch('https://api.github.com/repos/wss434631143/luna-ai-cut/releases/latest')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch release')
      return res.json()
    })
    .then((data) => {
      const assets = data.assets || []
      const macX64Asset = assets.find((a) => /x64.*Installer\.dmg$/i.test(a.name) || isDmg(a.name))
      const macArm64Asset = assets.find((a) => /arm64.*Installer\.dmg$/i.test(a.name))
      const winAsset = assets.find((a) => isSetupExe(a.name))

      // 国际用户走 GitHub 直链
      if (!isChineseUser) {
        if (macX64Asset && macX64Card) macX64Card.href = macX64Asset.browser_download_url
        if (macArm64Asset && macArm64Card) {
          macArm64Card.href = macArm64Asset.browser_download_url
          if (macArm64Region) macArm64Region.textContent = 'GitHub Release'
        }
        if (winAsset && winCard) winCard.href = winAsset.browser_download_url
        if (macX64Region) macX64Region.textContent = 'GitHub Release'
        if (winAsset && winRegion) winRegion.textContent = 'GitHub Release'
      }
    })
    .catch(() => {})
}
