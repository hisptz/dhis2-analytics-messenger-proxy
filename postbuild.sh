echo "Clearing past builds..."
rimraf build

PKG_VERSION=$(node -p "require('./package.json').version")
PKG_NAME=$(node -p "require('./package.json').name")
echo "Building app"
BUNDLE_NAME="$PKG_NAME-$PKG_VERSION.zip"
zip "$BUNDLE_NAME" app package.json .env.example yarn.lock Dockerfile
mkdir "build"
mv $BUNDLE_NAME build
