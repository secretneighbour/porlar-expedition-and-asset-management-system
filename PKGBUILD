# Maintainer: Polar Expedition Operations Consortium
pkgname=polaris-ops
pkgver=1.0.0
pkgrel=1
pkgdesc="Tactical Polar Expedition and Asset Management Console (Tauri 2 Native Client)"
arch=('x86_64')
url="https://github.com/solid/polar-expedition-and-asset-management-system"
license=('MIT')
depends=('webkit2gtk-4.1' 'gtk3' 'libsoup3' 'openssl')
makedepends=('nodejs' 'npm' 'cargo' 'rust')
options=('!strip')

build() {
  cd "$startdir"
  npm run build
  npx tauri build --no-bundle
}

package() {
  cd "$startdir"
  install -Dm755 "src-tauri/target/release/polaris-ops" "$pkgdir/usr/bin/polaris-ops"
  install -Dm644 "polaris-ops.desktop" "$pkgdir/usr/share/applications/polaris-ops.desktop"
  install -Dm644 "src-tauri/icons/128x128.png" "$pkgdir/usr/share/icons/hicolor/128x128/apps/polaris-ops.png"
  install -Dm644 "src-tauri/icons/32x32.png" "$pkgdir/usr/share/icons/hicolor/32x32/apps/polaris-ops.png"
  if [ -f LICENSE ]; then
    install -Dm644 "LICENSE" "$pkgdir/usr/share/licenses/$pkgname/LICENSE"
  fi
}
