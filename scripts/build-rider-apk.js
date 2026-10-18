import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const isRelease = process.argv.includes('--release');
const gradleTask = isRelease ? 'assembleRelease' : 'assembleDebug';
const apkSource = isRelease
  ? path.join(rootDir, 'android/app/build/outputs/apk/release/app-release-unsigned.apk')
  : path.join(rootDir, 'android/app/build/outputs/apk/debug/app-debug.apk');
const apkOutput = path.join(rootDir, isRelease ? 'mandi-rider.apk' : 'mandi-rider-debug.apk');

const originalConfigPath = path.join(rootDir, 'capacitor.config.json');
const riderConfigPath = path.join(rootDir, 'capacitor.rider.json');
const backupConfigPath = path.join(rootDir, 'capacitor.config.json.bak');

console.log(`🚀 Building Mandi Rider APK (${isRelease ? 'Release' : 'Debug'})...`);

let backupCreated = false;
try {
  // 1. Backup original capacitor.config.json
  if (fs.existsSync(originalConfigPath)) {
    fs.copyFileSync(originalConfigPath, backupConfigPath);
    backupCreated = true;
  }

  // 2. Activate rider capacitor configuration
  if (!fs.existsSync(riderConfigPath)) {
    throw new Error('capacitor.rider.json not found!');
  }
  fs.copyFileSync(riderConfigPath, originalConfigPath);

  // 3. Build Vite client with VITE_APP_TARGET=rider
  console.log('📦 Step 1/3: Compiling Vite bundle with target=rider...');
  execSync('npx vite build', {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, VITE_APP_TARGET: 'rider' }
  });

  // 4. Capacitor sync Android
  console.log('🔄 Step 2/3: Syncing Capacitor Android workspace...');
  execSync('npx cap sync android', { cwd: rootDir, stdio: 'inherit' });

  // 5. Gradle build
  console.log(`🛠️ Step 3/3: Assembling APK with Gradle (${gradleTask})...`);
  const gradlewCmd = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';
  execSync(`${gradlewCmd} ${gradleTask}`, {
    cwd: path.join(rootDir, 'android'),
    stdio: 'inherit'
  });

  // 6. Copy output APK to project root
  if (fs.existsSync(apkSource)) {
    fs.copyFileSync(apkSource, apkOutput);
    const stats = fs.statSync(apkOutput);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`\n🎉 Success! Mandi Rider APK built: ${path.basename(apkOutput)} (${sizeMb} MB)`);
  } else {
    console.warn(`⚠️ Warning: Expected APK output at ${apkSource} not found.`);
  }

} catch (err) {
  console.error('\n❌ Build failed:', err.message);
  process.exitCode = 1;
} finally {
  // Always restore original consumer capacitor configuration
  if (backupCreated && fs.existsSync(backupConfigPath)) {
    console.log('🧹 Restoring original consumer capacitor configuration...');
    try {
      fs.copyFileSync(backupConfigPath, originalConfigPath);
      fs.unlinkSync(backupConfigPath);
      execSync('npx cap sync android', { cwd: rootDir, stdio: 'ignore' });
    } catch (e) {
      console.warn('Notice restoring consumer config:', e?.message);
    }
  }
}
