# 手机群控系统部署指南

## 🚀 快速开始

### 系统要求

- **操作系统**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Node.js**: 14.0+ 
- **内存**: 最低 4GB RAM (推荐 8GB+)
- **存储**: 最低 2GB 可用空间
- **USB端口**: 支持USB 2.0+
- **网络**: WiFi/以太网连接

### 一键安装

```bash
# 1. 克隆项目
git clone https://github.com/your-repo/phone-control-system.git
cd phone-control-system

# 2. 安装依赖和配置环境
npm run install-deps

# 3. 启动服务
npm start
```

### 手动安装

#### 1. 安装Node.js依赖

```bash
npm install
```

#### 2. 安装ADB工具

**Windows:**
```bash
# 下载Android SDK Platform Tools
# 或使用包管理器
choco install adb
```

**macOS:**
```bash
brew install android-platform-tools
```

**Ubuntu/Linux:**
```bash
sudo apt update
sudo apt install android-tools-adb android-tools-fastboot
```

#### 3. 安装Scrcpy

**Windows:**
```bash
choco install scrcpy
```

**macOS:**
```bash
brew install scrcpy
```

**Ubuntu/Linux:**
```bash
sudo apt install scrcpy
```

#### 4. 启动服务器

```bash
node server.js
```

## 📱 设备配置

### Android设备准备

#### 1. 启用开发者选项
1. 打开 **设置** > **关于手机**
2. 连续点击 **版本号** 7次
3. 返回设置，找到 **开发者选项**

#### 2. 启用USB调试
1. 进入 **开发者选项**
2. 启用 **USB调试**
3. 启用 **USB调试(安全设置)** (如有)

#### 3. 授权计算机
1. 用USB线连接手机和电脑
2. 手机会弹出授权提示，点击 **确定**
3. 勾选 **始终允许这台计算机进行调试**

### WiFi连接配置

#### 方法1: 通过USB先连接
```bash
# 1. USB连接后执行
adb tcpip 5555

# 2. 断开USB，通过WiFi连接
adb connect 192.168.1.100:5555
```

#### 方法2: 通过开发者选项
1. 进入 **开发者选项**
2. 启用 **无线调试**
3. 点击 **使用配对码配对设备**
4. 在系统中输入配对码和端口号

## 🖥️ 系统功能详解

### 1. 设备管理
- **自动检测**: 系统自动检测USB和WiFi连接的设备
- **状态监控**: 实时显示设备在线状态、电量、信号强度
- **批量操作**: 支持同时管理多台设备
- **设备信息**: 显示设备型号、Android版本、分辨率等

### 2. 屏幕镜像
- **实时镜像**: 通过Scrcpy实现低延迟屏幕镜像
- **远程控制**: 支持点击、滑动、文字输入
- **录屏功能**: 可录制设备屏幕操作
- **画质调节**: 支持分辨率和码率调整

### 3. 文件管理
- **文件浏览**: 浏览设备完整文件系统
- **上传下载**: 双向文件传输
- **批量操作**: 支持多文件选择操作
- **权限管理**: 安全的文件访问控制

### 4. 命令终端
- **ADB命令**: 执行完整的ADB Shell命令
- **安全过滤**: 阻止危险命令执行
- **历史记录**: 保存命令执行历史
- **批处理**: 支持脚本批量执行

## 🔧 配置文件详解

### config.json 配置项

```json
{
  "server": {
    "port": 3001,                 // 服务端口
    "host": "0.0.0.0",           // 监听地址
    "maxConnections": 50         // 最大连接数
  },
  "adb": {
    "path": "adb",               // ADB路径
    "timeout": 30000,            // 命令超时(ms)
    "retryAttempts": 3           // 重试次数
  },
  "scrcpy": {
    "path": "scrcpy",            // Scrcpy路径
    "maxSize": 720,              // 最大分辨率
    "bitRate": 8000000,          // 码率
    "frameRate": 60              // 帧率
  },
  "security": {
    "allowedCommands": [         // 允许的命令
      "shell", "pull", "push", "install", "uninstall"
    ],
    "blockedCommands": [         // 禁止的命令
      "rm -rf", "format", "dd", "fastboot", "recovery"
    ],
    "requireAuth": false,        // 是否需要认证
    "apiKey": ""                 // API密钥
  },
  "storage": {
    "maxFileSize": 104857600,    // 最大文件大小(100MB)
    "downloadPath": "./downloads", // 下载目录
    "uploadPath": "./uploads",   // 上传目录
    "tempPath": "./temp",        // 临时目录
    "autoCleanup": true          // 自动清理临时文件
  },
  "logging": {
    "level": "info",             // 日志级别
    "file": "./logs/system.log", // 日志文件
    "maxSize": 10485760,         // 日志文件最大大小(10MB)
    "maxFiles": 5                // 保留日志文件数量
  }
}
```

## 🔒 安全配置

### 1. 网络安全
```javascript
// 启用HTTPS (生产环境推荐)
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem')
};

https.createServer(options, app).listen(443);
```

### 2. API认证
```javascript
// config.json中启用认证
{
  "security": {
    "requireAuth": true,
    "apiKey": "your-secret-api-key",
    "tokenExpiry": 3600000  // 1小时
  }
}
```

### 3. 防火墙配置
```bash
# Ubuntu/Linux 防火墙设置
sudo ufw allow 3001/tcp
sudo ufw enable

# Windows防火墙
netsh advfirewall firewall add rule name="Phone Control" dir=in action=allow protocol=TCP localport=3001
```

## 🚨 故障排除

### 常见问题解决

#### 1. 设备检测不到
**问题**: 手机连接后系统检测不到设备
**解决方案**:
```bash
# 检查ADB状态
adb devices

# 重启ADB服务
adb kill-server
adb start-server

# 检查USB驱动
# Windows: 更新设备管理器中的Android设备驱动
# macOS/Linux: 检查USB权限
```

#### 2. 屏幕镜像失败
**问题**: 无法启动屏幕镜像
**解决方案**:
```bash
# 检查Scrcpy安装
scrcpy --version

# 手动测试屏幕镜像
scrcpy -s device_id

# 检查设备权限
# Android: 设置 > 显示 > 投射屏幕
```

#### 3. WiFi连接不稳定
**问题**: WiFi连接经常断开
**解决方案**:
```bash
# 检查网络稳定性
ping device_ip

# 调整ADB超时设置
adb connect device_ip:5555

# 检查路由器设置，关闭AP隔离
```

#### 4. 文件传输失败
**问题**: 上传下载文件失败
**解决方案**:
```bash
# 检查存储权限
adb shell ls -la /sdcard/

# 检查剩余空间
adb shell df -h

# 手动测试文件传输
adb pull /sdcard/test.txt ./
adb push ./test.txt /sdcard/
```

### 日志分析

#### 系统日志位置
- **应用日志**: `./logs/system.log`
- **ADB日志**: `~/.android/adb.log` 
- **错误日志**: `./logs/error.log`

#### 关键日志信息
```bash
# 查看实时日志
tail -f logs/system.log

# 搜索错误信息
grep "ERROR" logs/system.log

# 分析设备连接问题
grep "device" logs/system.log | grep -E "(connect|disconnect)"
```

## 📊 性能优化

### 1. 系统优化
```javascript
// 服务器配置优化
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  // 创建工作进程
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // 启动服务器
  startServer();
}
```

### 2. 设备性能监控
```javascript
// 设备性能数据收集
const getDevicePerformance = async (deviceId) => {
  const commands = {
    cpu: `adb -s ${deviceId} shell top -n 1`,
    memory: `adb -s ${deviceId} shell cat /proc/meminfo`,
    battery: `adb -s ${deviceId} shell dumpsys battery`,
    temperature: `adb -s ${deviceId} shell cat /sys/class/thermal/thermal_zone0/temp`
  };
  
  // 执行监控命令...
};
```

### 3. 网络优化
```javascript
// WebSocket连接池管理
class ConnectionPool {
  constructor(maxConnections = 50) {
    this.maxConnections = maxConnections;
    this.connections = new Map();
    this.queue = [];
  }
  
  addConnection(deviceId, ws) {
    if (this.connections.size >= this.maxConnections) {
      this.queue.push({ deviceId, ws });
      return false;
    }
    
    this.connections.set(deviceId, ws);
    return true;
  }
}
```

## 🔄 系统更新

### 自动更新脚本
```bash
#!/bin/bash
# update.sh - 系统更新脚本

echo "开始更新手机群控系统..."

# 备份当前版本
cp -r . ../phone-control-backup-$(date +%Y%m%d)

# 拉取最新代码
git pull origin main

# 更新依赖
npm install

# 重启服务
npm run restart

echo "系统更新完成!"
```

### 数据库迁移 (如使用)
```javascript
// migrate.js - 数据迁移脚本
const migrations = [
  {
    version: '1.1.0',
    up: async (db) => {
      // 添加新字段
      await db.query('ALTER TABLE devices ADD COLUMN last_activity TIMESTAMP');
    },
    down: async (db) => {
      // 回滚操作
      await db.query('ALTER TABLE devices DROP COLUMN last_activity');
    }
  }
];
```

## 🎯 高级功能

### 1. 批量操作脚本
```javascript
// 批量安装应用
const batchInstallApk = async (apkPath, deviceIds) => {
  const results = [];
  
  for (const deviceId of deviceIds) {
    try {
      await execCommand(`adb -s ${deviceId} install ${apkPath}`);
      results.push({ deviceId, status: 'success' });
    } catch (error) {
      results.push({ deviceId, status: 'failed', error: error.message });
    }
  }
  
  return results;
};
```

### 2. 自动化测试集成
```javascript
// 自动化测试支持
class AutomationRunner {
  constructor(deviceId) {
    this.deviceId = deviceId;
  }
  
  async runTestScript(script) {
    const commands = script.split('\n');
    const results = [];
    
    for (const command of commands) {
      if (command.trim()) {
        const result = await this.executeCommand(command);
        results.push({ command, result });
      }
    }
    
    return results;
  }
}
```

### 3. 设备群组管理
```javascript
// 设备分组功能
class DeviceGroupManager {
  constructor() {
    this.groups = new Map();
  }
  
  createGroup(groupName, deviceIds) {
    this.groups.set(groupName, new Set(deviceIds));
  }
  
  async executeOnGroup(groupName, command) {
    const deviceIds = this.groups.get(groupName);
    const results = [];
    
    for (const deviceId of deviceIds) {
      const result = await this.executeCommand(deviceId, command);
      results.push({ deviceId, result });
    }
    
    return results;
  }
}
```

## 📞 技术支持

### 联系方式
- **GitHub Issues**: [项目Issue页面]
- **文档**: [在线文档地址]
- **社区**: [讨论社区链接]

### 贡献指南
1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

此项目使用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。


