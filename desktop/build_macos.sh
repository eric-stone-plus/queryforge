#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="$ROOT/QueryForge.app"
DIST="$ROOT/desktop/dist"
ARCH="${ARCH:-x86_64}"
TARGET="$ARCH-apple-macos14.0"
LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"

if [[ "$ARCH" != "x86_64" ]]; then
  echo "Unsupported ARCH=$ARCH. This build script currently targets x86_64." >&2
  exit 1
fi

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources/data" "$APP/Contents/Resources/node_modules" "$DIST"

swiftc \
  -target "$TARGET" \
  -parse-as-library \
  -O \
  "$ROOT/desktop/QueryForge.swift" \
  -o "$APP/Contents/MacOS/QueryForge"

cp "$ROOT/desktop/Info.plist" "$APP/Contents/Info.plist"
cp "$ROOT/desktop/AppIcon.icns" "$APP/Contents/Resources/AppIcon.icns"
cp "$ROOT/desktop/server.js" "$APP/Contents/Resources/server.js"
cp "$ROOT/data/ecommerce.db" "$APP/Contents/Resources/data/ecommerce.db"
printf 'APPL????' > "$APP/Contents/PkgInfo"

chmod 755 "$APP/Contents/MacOS/QueryForge"
chmod 644 "$APP/Contents/Info.plist" "$APP/Contents/PkgInfo" "$APP/Contents/Resources/AppIcon.icns" "$APP/Contents/Resources/server.js" "$APP/Contents/Resources/data/ecommerce.db"

xattr -cr "$APP" 2>/dev/null || true
codesign --force --deep --sign - "$APP"
touch "$APP"
"$LSREGISTER" -f "$APP" 2>/dev/null || true

rm -rf "$DIST/QueryForge.app"
cp -R "$APP" "$DIST/QueryForge.app"
rm -f "$DIST/QueryForge-macOS-x86_64.zip"
(
  cd "$ROOT"
  ditto -c -k --keepParent "QueryForge.app" "desktop/dist/QueryForge-macOS-x86_64.zip"
)

echo "Built $APP"
echo "Archived $DIST/QueryForge-macOS-x86_64.zip"
