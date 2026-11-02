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

const gradleAppBuildPath = path.join(rootDir, 'android/app/build.gradle');
const gradleAppBuildBak = path.join(rootDir, 'build.gradle.bak');

const stringsXmlPath = path.join(rootDir, 'android/app/src/main/res/values/strings.xml');
const stringsXmlBak = path.join(rootDir, 'strings.xml.bak');

console.log(`🚀 Building Dedicated Mandi Rider APK (${isRelease ? 'Release' : 'Debug'})...`);
console.log('📌 Package ID: com.mandiminutes.rider | App Title: "Mandi Rider"');

let configBackupCreated = false;
let gradleBackupCreated = false;
let stringsBackupCreated = false;

try {
  // 1. Backup original capacitor.config.json & copy rider config
  if (fs.existsSync(originalConfigPath)) {
    fs.copyFileSync(originalConfigPath, backupConfigPath);
    configBackupCreated = true;
  }
  if (!fs.existsSync(riderConfigPath)) {
    throw new Error('capacitor.rider.json not found!');
  }
  fs.copyFileSync(riderConfigPath, originalConfigPath);

  // 2. Backup and configure separate Android applicationId for Mandi Rider
  if (fs.existsSync(gradleAppBuildPath)) {
    fs.copyFileSync(gradleAppBuildPath, gradleAppBuildBak);
    gradleBackupCreated = true;
    let gradleContent = fs.readFileSync(gradleAppBuildPath, 'utf8');
    gradleContent = gradleContent.replace(
      /applicationId\s+["']com\.mandiminutes\.app["']/,
      'applicationId "com.mandiminutes.rider"'
    );
    fs.writeFileSync(gradleAppBuildPath, gradleContent, 'utf8');
    console.log('📝 Android build.gradle configured for: com.mandiminutes.rider');
  }

  // 3. Backup and configure separate App Title in strings.xml for Mandi Rider
  if (fs.existsSync(stringsXmlPath)) {
    fs.copyFileSync(stringsXmlPath, stringsXmlBak);
    stringsBackupCreated = true;
    let stringsContent = fs.readFileSync(stringsXmlPath, 'utf8');
    stringsContent = stringsContent
      .replace(/<string name="app_name">.*?<\/string>/, '<string name="app_name">Mandi Rider</string>')
      .replace(/<string name="title_activity_main">.*?<\/string>/, '<string name="title_activity_main">Mandi Rider</string>')
      .replace(/<string name="package_name">.*?<\/string>/, '<string name="package_name">com.mandiminutes.rider</string>')
      .replace(/<string name="custom_url_scheme">.*?<\/string>/, '<string name="custom_url_scheme">com.mandiminutes.rider</string>');
    fs.writeFileSync(stringsXmlPath, stringsContent, 'utf8');
    console.log('📝 strings.xml configured for: "Mandi Rider"');
  }

  // 4. Build Vite client with VITE_APP_TARGET=rider
  console.log('📦 Step 1/3: Compiling Vite bundle with target=rider...');
  execSync('npx vite build', {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, VITE_APP_TARGET: 'rider' }
  });

  // 5. Capacitor sync Android
  console.log('🔄 Step 2/3: Syncing Capacitor Android workspace...');
  execSync('npx cap sync android', { cwd: rootDir, stdio: 'inherit' });

  // 6. Gradle build
  console.log(`🛠️ Step 3/3: Assembling APK with Gradle (${gradleTask})...`);
  const gradlewCmd = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';
  execSync(`${gradlewCmd} ${gradleTask}`, {
    cwd: path.join(rootDir, 'android'),
    stdio: 'inherit'
  });

  // 7. Copy output APK to project root
  if (fs.existsSync(apkSource)) {
    fs.copyFileSync(apkSource, apkOutput);
    const stats = fs.statSync(apkOutput);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`\n🎉 Success! Mandi Rider APK built: ${path.basename(apkOutput)} (${sizeMb} MB)`);
    console.log('✅ Coexists independently with consumer Mandi Minutes APK (distinct package name).');
  } else {
    console.warn(`⚠️ Warning: Expected APK output at ${apkSource} not found.`);
  }

} catch (err) {
  console.error('\n❌ Build failed:', err.message);
  process.exitCode = 1;
} finally {
  // Always restore original consumer files
  if (gradleBackupCreated && fs.existsSync(gradleAppBuildBak)) {
    try {
      fs.copyFileSync(gradleAppBuildBak, gradleAppBuildPath);
      fs.unlinkSync(gradleAppBuildBak);
    } catch (e) {
      console.warn('Notice restoring build.gradle:', e?.message);
    }
  }

  if (stringsBackupCreated && fs.existsSync(stringsXmlBak)) {
    try {
      fs.copyFileSync(stringsXmlBak, stringsXmlPath);
      fs.unlinkSync(stringsXmlBak);
    } catch (e) {
      console.warn('Notice restoring strings.xml:', e?.message);
    }
  }

  if (configBackupCreated && fs.existsSync(backupConfigPath)) {
    console.log('🧹 Restoring original consumer configuration...');
    try {
      fs.copyFileSync(backupConfigPath, originalConfigPath);
      fs.unlinkSync(backupConfigPath);
      execSync('npx cap sync android', { cwd: rootDir, stdio: 'ignore' });
    } catch (e) {
      console.warn('Notice restoring consumer config:', e?.message);
    }
  }
}
