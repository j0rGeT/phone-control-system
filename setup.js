// setup-tools.js - 环境配置脚本
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class SetupTools {
  constructor() {
    this.platform = process.platform;
    this.arch = process.arch;
    this.toolsDir = path.join(__dirname, 'tools');
    this.downloadDir = path.join(__dirname, 'downloads');
  }

  async setup() {
    console.log('🚀 开始配置手机群控系统环境...');
    
    try {
      await this.createDirectories();
      await this.checkSystemRequirements();
      await this.setupADB();
      await this.setupScrcpy();
      await this.verifyInstallation();
      
      console.log('✅ 环境配置完成！');
      console.log('\n📱 系统已准备就绪，可以开始使用手机群控功能。');
      console.log('\n🔧 使用说明:');
      console.log('1. npm start - 启动服务器');
      console.log('2. 打开浏览器访问 http://localhost:3001');
      console.log('3. 连接手机并启用USB调试');
      console.log('4. 在界面中管理您的设备');
      
    } catch (error) {
      console.error('❌ 配置失败:', error.message);
      process.exit(1);
    }
  }

  async createDirectories() {
    const dirs = [this.toolsDir, this.downloadDir, 'uploads', 'logs'];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
        console.log(`📁 创建目录: ${dir}`);
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
    }
  }

  async checkSystemRequirements() {
    console.log('🔍 检查系统要求...');
    
    // 检查Node.js版本
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 14) {
      throw new Error(`需要Node.js 14+，当前版本: ${nodeVersion}`);
    }
    
    console.log(`✅ Node.js版本: ${nodeVersion}`);
    
    // 检查操作系统
    console.log(`✅ 操作系统: ${this.platform} ${this.arch}`);
    
    // 检查Python（某些依赖需要）
    try {
      const { stdout } = await execAsync('python --version');
      console.log(`✅ Python: ${stdout.trim()}`);
    } catch {
      console.log('⚠️  警告: 未检测到Python，某些功能可能受限');
    }
  }

  async setupADB() {
    console.log('📱 配置Android Debug Bridge (ADB)...');
    
    try {
      // 尝试检查系统是否已安装ADB
      await execAsync('adb version');
      console.log('✅ 系统已安装ADB');
      return;
    } catch {
      console.log('📦 下载并配置ADB...');
    }

    const adbUrl = this.getADBDownloadUrl();
    const adbPath = await this.downloadAndExtract(adbUrl, 'adb');
    
    // 将ADB添加到PATH
    await this.addToPath(adbPath);
    
    // 验证ADB安装
    try {
      await execAsync(`${path.join(adbPath, 'adb')} version`);
      console.log('✅ ADB配置完成');
    } catch (error) {
      throw new Error(`ADB配置失败: ${error.message}`);
    }
  }

  async setupScrcpy() {
    console.log('🖥️  配置Scrcpy屏幕镜像工具...');
    
    try {
      await execAsync('scrcpy --version');
      console.log('✅ 系统已安装Scrcpy');
      return;
    } catch {
      console.log('📦 下载并配置Scrcpy...');
    }

    const scrcpyUrl = this.getScrcpyDownloadUrl();
    const scrcpyPath = await this.downloadAndExtract(scrcpyUrl, 'scrcpy');
    
    await this.addToPath(scrcpyPath);
    
    try {
      await execAsync(`${path.join(scrcpyPath, 'scrcpy')} --version`);
      console.log('✅ Scrcpy配置完成');
    } catch (error) {
      throw new Error(`Scrcpy配置失败: ${error.message}`);
    }
  }

  getADBDownloadUrl() {
    const baseUrl = 'https://dl.google.com/android/repository';
    
    switch (this.platform) {
      case 'win32':
        return `${baseUrl}/platform-tools-latest-windows.zip`;
      case 'darwin':
        return `${baseUrl}/platform-tools-latest-darwin.zip`;
      case 'linux':
        return `${baseUrl}/platform-tools-latest-linux.zip`;
      default:
        throw new Error(`不支持的操作系统: ${this.platform}`);
    }
  }

  getScrcpyDownloadUrl() {
    const version = '2.3.1';
    const baseUrl = `https://github.com/Genymobile/scrcpy/releases/download/v${version}`;
    
    switch (this.platform) {
      case 'win32':
        return `${baseUrl}/scrcpy-win64-v${version}.zip`;
      case 'darwin':
        return `${baseUrl}/scrcpy-macos-v${version}.zip`;
      case 'linux':
        return `${baseUrl}/scrcpy-linux-v${version}.tar.gz`;
      default:
        throw new Error(`不支持的操作系统: ${this.platform}`);
    }
  }

  async downloadAndExtract(url, toolName) {
    const fetch = (await import('node-fetch')).default;
    const fileName = path.basename(url);
    const filePath = path.join(this.downloadDir, fileName);
    const extractPath = path.join(this.toolsDir, toolName);
    
    console.log(`📥 下载 ${toolName}: ${url}`);
    
    // 下载文件
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.statusText}`);
    }
    
    const buffer = await response.buffer();
    await fs.writeFile(filePath, buffer);
    
    console.log(`📦 解压 ${toolName}...`);
    
    // 解压文件
    await fs.mkdir(extractPath, { recursive: true });
    
    if (fileName.endsWith('.zip')) {
      await this.extractZip(filePath, extractPath);
    } else if (fileName.endsWith('.tar.gz')) {
      await this.extractTarGz(filePath, extractPath);
    }
    
    return extractPath;
  }

  async extractZip(zipPath, extractPath) {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);
  }

  async extractTarGz(tarPath, extractPath) {
    const tar = require('tar');
    await tar.x({
      file: tarPath,
      cwd: extractPath
    });
  }

  async addToPath(toolPath) {
    // 这里可以根据操作系统添加到PATH
    // 对于开发环境，我们创建一个启动脚本
    const startScript = this.platform === 'win32' ? 'start.bat' : 'start.sh';
    const scriptPath = path.join(__dirname, startScript);
    
    const pathExport = this.platform === 'win32' 
      ? `set PATH=%PATH%;${toolPath}\n`
      : `export PATH=$PATH:${toolPath}\n`;
    
    const scriptContent = this.platform === 'win32'
      ? `${pathExport}node server.js\n`
      : `#!/bin/bash\n${pathExport}node server.js\n`;
    
    await fs.writeFile(scriptPath, scriptContent);
    
    if (this.platform !== 'win32') {
      await execAsync(`chmod +x ${scriptPath}`);
    }
  }

  async verifyInstallation() {
    console.log('🔍 验证安装...');
    
    const commands = [
      { name: 'ADB', cmd: 'adb version' },
      { name: 'Scrcpy', cmd: 'scrcpy --version' }
    ];
    
    for (const { name, cmd } of commands) {
      try {
        const { stdout } = await execAsync(cmd);
        console.log(`✅ ${name}: ${stdout.split('\n')[0]}`);
      } catch (error) {
        console.log(`❌ ${name}: 验证失败`);
        throw error;
      }
    }
  }

  async createConfigFile() {
    const config = {
      server: {
        port: 3001,
        host: '0.0.0.0'
      },
      adb: {
        path: 'adb',
        timeout: 30000
      },
      scrcpy: {
        path: 'scrcpy',
        maxSize: 720,
        bitRate: 8000000
      },
      security: {
        allowedCommands: [
          'shell',
          'pull',
          'push',
          'install',
          'uninstall'
        ],
        blockedCommands: [
          'rm -rf',
          'format',
          'dd',
          'fastboot'
        ]
      },
      storage: {
        maxFileSize: 104857600, // 100MB
        downloadPath: './downloads',
        uploadPath: './uploads'
      }
    };
    
    await fs.writeFile(
      path.join(__dirname, 'config.json'),
      JSON.stringify(config, null, 2)
    );
    
    console.log('📝 配置文件已创建: config.json');
  }
}

// 运行配置
if (require.main === module) {
  const setup = new SetupTools();
  setup.setup().catch(console.error);
}

module.exports = SetupTools;
