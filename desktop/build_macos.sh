#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="$ROOT/QueryForge.app"
DIST="$ROOT/desktop/dist"
RUNTIME="$ROOT/desktop/.runtime"
HOST_ARCH="$(uname -m)"
ARCH="${ARCH:-$HOST_ARCH}"
TARGET="$ARCH-apple-macos14.0"
LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
NODE_VERSION="${NODE_VERSION:-22.22.3}"
if [[ "$ARCH" == "x86_64" ]]; then
  NODE_PLATFORM_ARCH="x64"
else
  NODE_PLATFORM_ARCH="$ARCH"
fi
NODE_DIST="node-v$NODE_VERSION-darwin-$NODE_PLATFORM_ARCH"
NODE_TARBALL="$RUNTIME/$NODE_DIST.tar.gz"
NODE_DIR="$RUNTIME/$NODE_DIST"
SQLITE_ADDON="$ROOT/node_modules/better-sqlite3/build/Release/better_sqlite3.node"

if [[ "$ARCH" != "$HOST_ARCH" ]]; then
  echo "Unsupported ARCH=$ARCH on host $HOST_ARCH because the desktop bundle embeds the host Node runtime." >&2
  exit 1
fi

mkdir -p "$RUNTIME"

if [[ ! -x "$NODE_DIR/bin/node" ]]; then
  if [[ ! -f "$NODE_TARBALL" ]]; then
    echo "Downloading Node.js $NODE_VERSION runtime for darwin-$NODE_PLATFORM_ARCH..."
    curl -fL "https://nodejs.org/dist/v$NODE_VERSION/$NODE_DIST.tar.gz" -o "$NODE_TARBALL"
  fi
  rm -rf "$NODE_DIR"
  tar -xzf "$NODE_TARBALL" -C "$RUNTIME"
fi

npm rebuild better-sqlite3 --build-from-source

if ! file "$NODE_DIR/bin/node" | grep -q "$ARCH"; then
  echo "Bundled Node architecture does not match ARCH=$ARCH" >&2
  file "$NODE_DIR/bin/node" >&2
  exit 1
fi

if [[ -f "$SQLITE_ADDON" ]] && ! file "$SQLITE_ADDON" | grep -q "$ARCH"; then
  echo "better-sqlite3 native addon architecture does not match ARCH=$ARCH" >&2
  file "$SQLITE_ADDON" >&2
  exit 1
fi

npm run build

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources/app" "$APP/Contents/Resources/data" "$APP/Contents/Resources/node/bin" "$DIST"

swiftc \
  -target "$TARGET" \
  -parse-as-library \
  -O \
  "$ROOT/desktop/QueryForge.swift" \
  -o "$APP/Contents/MacOS/QueryForge"

cp "$ROOT/desktop/Info.plist" "$APP/Contents/Info.plist"
cp "$ROOT/desktop/AppIcon.icns" "$APP/Contents/Resources/AppIcon.icns"
cp -R "$ROOT/.next/standalone/." "$APP/Contents/Resources/app/"
mkdir -p "$APP/Contents/Resources/app/.next"
cp -R "$ROOT/.next/static" "$APP/Contents/Resources/app/.next/static"
if [[ -d "$ROOT/public" ]]; then
  cp -R "$ROOT/public" "$APP/Contents/Resources/app/public"
fi
cp "$ROOT/data/ecommerce.db" "$APP/Contents/Resources/data/ecommerce.db"
node -e "const Database=require('better-sqlite3'); const db=new Database(process.argv[1]); db.pragma('wal_checkpoint(TRUNCATE)'); db.pragma('journal_mode=DELETE'); db.close();" "$APP/Contents/Resources/data/ecommerce.db"
cp "$NODE_DIR/bin/node" "$APP/Contents/Resources/node/bin/node"
printf 'APPL????' > "$APP/Contents/PkgInfo"

chmod 755 "$APP/Contents/MacOS/QueryForge"
chmod 755 "$APP/Contents/Resources/node/bin/node"
chmod 644 "$APP/Contents/Info.plist" "$APP/Contents/PkgInfo" "$APP/Contents/Resources/AppIcon.icns" "$APP/Contents/Resources/data/ecommerce.db"

xattr -cr "$APP" 2>/dev/null || true
codesign --force --deep --sign - "$APP"
touch "$APP"
"$LSREGISTER" -f "$APP" 2>/dev/null || true

rm -rf "$DIST/QueryForge.app"
cp -R "$APP" "$DIST/QueryForge.app"
rm -f "$DIST/QueryForge-macOS-$ARCH.zip"
(
  cd "$ROOT"
  ditto -c -k --keepParent "QueryForge.app" "desktop/dist/QueryForge-macOS-$ARCH.zip"
)

echo "Built $APP"
echo "Archived $DIST/QueryForge-macOS-$ARCH.zip"
