// 手机群控系统后端服务 - Node.js
const express = require('express');
const WebSocket = require('ws');
const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const cors = require('cors');

class PhoneControlServer {
  constructor() {
    this.app = express();
    this.server = require('http').createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    this.devices = new Map();
    this.clients = new Set();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.startDeviceMonitoring();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
    this.app.use('/uploads', express.static('uploads'));
    
    // 文件上传配置
    this.upload = multer({
      dest: 'uploads/',
      limits: { fileSize: 100 * 1024 * 1024 } // 100MB限制
    });
  }

  setupRoutes() {
    // 设备管理路由
    this.app.get('/api/devices', (req, res) => {
      const deviceList = Array.from(this.devices.values());
      res.json({ devices: deviceList });
    });

    this.app.post('/api/devices/:deviceId/connect', async (req, res) => {
      const { deviceId } = req.params;
      const { connectionType, ip } = req.body;
      
      try {
        if (connectionType === 'wifi' && ip) {
          await this.connectWifiDevice(deviceId, ip);
        } else {
          await this.connectUsbDevice(deviceId);
        }
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.delete('/api/devices/:deviceId', async (req, res) => {
      const { deviceId } = req.params;
      try {
        await this.disconnectDevice(deviceId);
        this.devices.delete(deviceId);
        this.broadcastDeviceUpdate();
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 屏幕镜像路由
    this.app.get('/api/devices/:deviceId/screen', (req, res) => {
      const { deviceId } = req.params;
      this.startScreenCapture(deviceId, res);
    });

    this.app.post('/api/devices/:deviceId/input', async (req, res) => {
      const { deviceId } = req.params;
      const { action, x, y, text } = req.body;
      
      try {
        await this.sendInput(deviceId, action, { x, y, text });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 文件系统路由
    this.app.get('/api/devices/:deviceId/files', async (req, res) => {
      const { deviceId } = req.params;
      const { path: filePath = '/sdcard/' } = req.query;
      
      try {
        const files = await this.listFiles(deviceId, filePath);
        res.json({ files, currentPath: filePath });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/devices/:deviceId/files/download', async (req, res) => {
      const { deviceId } = req.params;
      const { filePath } = req.query;
      
      try {
        const localPath = await this.downloadFile(deviceId, filePath);
        res.download(localPath);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/devices/:deviceId/files/upload', 
      this.upload.single('file'), async (req, res) => {
      const { deviceId } = req.params;
      const { remotePath } = req.body;
      
      try {
        await this.uploadFile(deviceId, req.file.path, remotePath);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 命令执行路由
    this.app.post('/api/devices/:deviceId/execute', async (req, res) => {
      const { deviceId } = req.params;
      const { command } = req.body;
      
      try {
        const result = await this.executeCommand(deviceId, command);
        res.json({ result });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log('客户端连接');

      // 发送当前设备列表
      ws.send(JSON.stringify({
        type: 'devices',
        data: Array.from(this.devices.values())
      }));

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('客户端断开连接');
      });

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleWebSocketMessage(ws, data);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message
          }));
        }
      });
    });
  }

  async handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'startScreenMirror':
        await this.startScreenMirror(data.deviceId, ws);
        break;
      case 'stopScreenMirror':
        await this.stopScreenMirror(data.deviceId);
        break;
      case 'deviceInput':
        await this.sendInput(data.deviceId, data.action, data.params);
        break;
    }
