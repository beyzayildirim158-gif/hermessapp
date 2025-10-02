# HermessApp Mac Geliştirme Kurulumu

Bu dosya macOS üzerinde projeyi eksiksiz ayağa kaldırmak için sıralı adımları içerir. Komutlar `zsh` varsayılarak yazılmıştır. Node 20 hedeflenmiştir.

## 1. Depoyu Klonla
```bash
git clone <REPO_URL>
cd HermessApp
```

## 2. NVM & Node 20 Kurulumu
```bash
# Homebrew yoksa önce kur:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install nvm
mkdir -p ~/.nvm
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
source ~/.zshrc
nvm install 20
nvm use 20
```
`.nvmrc` dosyası eklendi; dizine girince `nvm use` yeterli.

## 3. Watchman
```bash
brew install watchman
```

## 4. Xcode & CocoaPods
- App Store'dan Xcode kur ve ilk açılışı yap, lisansı onayla.
```bash
xcode-select --install
sudo xcodebuild -runFirstLaunch
sudo gem install cocoapods
```

## 5. Android (Opsiyonel)
```bash
brew install --cask android-studio
# Android Studio içinden SDK + bir emulator (API 34) kur
```
`~/.zshrc` içine:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH="$ANDROID_HOME/platform-tools:$PATH"
```

## 6. Bağımlılıkları Kur
```bash
npm install
npx expo-doctor
```

## 7. Geliştirme Sunucusu
```bash
npx expo start --clear
# i -> iOS Simulator, a -> Android Emulator
```

## 8. EAS CLI & Login
```bash
npm i -g eas-cli
eas login
```

## 9. iOS Build (Remote)
```bash
eas build -p ios --profile production
```

## 10. Apple API Key Ortam Değişkenleri (Submit İçin)
`~/Secrets/AuthKey_<KEYID>.p8` dosyasını koy.
```bash
export APP_STORE_CONNECT_API_KEY_ID="KEYID12345"
export APP_STORE_CONNECT_API_KEY_ISSUER_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export APP_STORE_CONNECT_API_KEY="$(cat ~/Secrets/AuthKey_KEYID12345.p8)"
```

## 11. Submit
```bash
eas submit -p ios --latest
```

## 12. Android Build / APK
```bash
eas build -p android --profile production
# APK için
.eas build -p android --profile apk
```

## 13. Sorun Giderme
- Metro cache: `rm -rf $TMPDIR/metro-*` veya `expo start --clear`
- Pods yeniden: `cd ios && pod install --repo-update`
- Path case hataları: import yollarını küçük-büyük harf tutarlı yap.

## 14. Gizli Dosyalar
`.gitignore` güncel; `.env_local`, p8 anahtarları commit etme.

## 15. Versiyonlama
- iOS: `app.json` -> `ios.buildNumber` artır
- Android (remote version source uyarısı): EAS panelinden versiyon yönetimi.

---
Bu rehberi güncellemek için düzenleyip commit yeterli. Sorun devam ederse build logunu ekle.
