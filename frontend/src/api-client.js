// api-client.js - 前端API客户端
class PhoneControlAPI {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.ws = null;
    this.wsCallbacks = new Map();
  }

  // HTTP请求封装
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          message: response.statusText 
        }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response;
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  // WebSocket连接
  connectWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        const wsURL = this.baseURL.replace('http', 'ws');
        this.ws = new WebSocket(wsURL);

        this.ws.onopen = () => {
          console.log('WebSocket连接已建立');
          resolve(this.ws);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
          } catch (error) {
            console.error('WebSocket消息解析错误:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket连接已关闭');
          setTimeout(() => this.connectWebSocket(), 3000); // 自动重连
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket错误:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // WebSocket消息处理
  handleWebSocketMessage(data) {
    const { type } = data;
    const callbacks = this.wsCallbacks.get(type);
    
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // 订阅WebSocket事件
  on(eventType, callback) {
    if (!this.wsCallbacks.has(eventType)) {
      this.wsCallbacks.set(eventType, []);
    }
    this.wsCallbacks.get(eventType).push(callback);
  }

  // 取消订阅
  off(eventType, callback) {
    const callbacks = this.wsCallbacks.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // 发送WebSocket消息
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // 设备管理API
  async getDevices() {
    return await this.request('/api/devices');
  }

  async connectDevice(deviceId, options = {}) {
    return await this.request(`/api/devices/${deviceId}/connect`, {
      method: 'POST',
      body: options
    });
  }

  async disconnectDevice(deviceId) {
    return await this.request(`/api/devices/${deviceId}`, {
      method: 'DELETE'
    });
  }

  async getDeviceInfo(deviceId) {
    return await this.request(`/api/devices/${deviceId}/info`);
  }

  // 屏幕镜像API
  async startScreenMirror(deviceId) {
    this.send({
      type: 'startScreenMirror',
      deviceId
    });
  }

  async stopScreenMirror(deviceId) {
    this.send({
      type: 'stopScreenMirror',
      deviceId
    });
  }

  async sendInput(deviceId, action, params) {
    return await this.request(`/api/devices/${deviceId}/input`, {
      method: 'POST',
      body: { action, ...params }
    });
  }

  // 文件系统API
  async listFiles(deviceId, path = '/sdcard/') {
    return await this.request(`/api/devices/${deviceId}/files?path=${encodeURIComponent(path)}`);
  }

  async downloadFile(deviceId, filePath) {
    const response = await this.request(`/api/devices/${deviceId}/files/download?filePath=${encodeURIComponent(filePath)}`, {
      method: 'GET'
    });
    
    // 创建下载链接
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filePath.split('/').pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  async uploadFile(deviceId, file, remotePath) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('remotePath', remotePath);

    return await this.request(`/api/devices/${deviceId}/files/upload`, {
      method: 'POST',
      headers: {}, // 让浏览器自动设置Content-Type
      body: formData
    });
  }

  // 命令执行API
  async executeCommand(deviceId, command) {
    return await this.request(`/api/devices/${deviceId}/execute`, {
      method: 'POST',
      body: { command }
    });
  }

  // 批量操作API
  async batchExecute(deviceIds, command) {
    const promises = deviceIds.map(deviceId => 
      this.executeCommand(deviceId, command)
    );
    
    const results = await Promise.allSettled(promises);
    return results.map((result, index) => ({
      deviceId: deviceIds[index],
      success: result.status === 'fulfilled',
      result: result.status === 'fulfilled' ? result.value : result.reason
    }));
  }

  // 应用管理API
  async installApp(deviceId, apkFile) {
    const formData = new FormData();
    formData.append('apk', apkFile);

    return await this.request(`/api/devices/${deviceId}/install`, {
      method: 'POST',
      headers: {},
      body: formData
    });
  }

  async uninstallApp(deviceId, packageName) {
    return await this.request(`/api/devices/${deviceId}/uninstall`, {
      method: 'POST',
      body: { packageName }
    });
  }

  async getInstalledApps(deviceId) {
    return await this.request(`/api/devices/${deviceId}/apps`);
  }

  // 系统信息API
  async getSystemInfo(deviceId) {
    return await this.request(`/api/devices/${deviceId}/system-info`);
  }

  async getPerformanceData(deviceId) {
    return await this.request(`/api/devices/${deviceId}/performance`);
  }

  // 截屏API
  async takeScreenshot(deviceId) {
    const response = await this.request(`/api/devices/${deviceId}/screenshot`, {
      method: 'GET'
    });
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // 录屏API
  async startRecording(deviceId, options = {}) {
    return await this.request(`/api/devices/${deviceId}/record/start`, {
      method: 'POST',
      body: options
    });
  }

  async stopRecording(deviceId) {
    return await this.request(`/api/devices/${deviceId}/record/stop`, {
      method: 'POST'
    });
  }

  // 日志API
  async getLogs(deviceId, logType = 'main') {
    return await this.request(`/api/devices/${deviceId}/logs?type=${logType}`);
  }

  async clearLogs(deviceId) {
    return await this.request(`/api/devices/${deviceId}/logs`, {
      method: 'DELETE'
    });
  }

  // 网络代理API
  async setProxy(deviceId, proxyConfig) {
    return await this.request(`/api/devices/${deviceId}/proxy`, {
      method: 'POST',
      body: proxyConfig
    });
  }

  async clearProxy(deviceId) {
    return await this.request(`/api/devices/${deviceId}/proxy`, {
      method: 'DELETE'
    });
  }

  // 位置模拟API
  async setLocation(deviceId, latitude, longitude) {
    return await this.request(`/api/devices/${deviceId}/location`, {
      method: 'POST',
      body: { latitude, longitude }
    });
  }

  async clearLocation(deviceId) {
    return await this.request(`/api/devices/${deviceId}/location`, {
      method: 'DELETE'
    });
  }
}

// React Hook for API integration
function usePhoneControlAPI() {
  const [api] = React.useState(() => new PhoneControlAPI());
  const [connected, setConnected] = React.useState(false);

  React.useEffect(() => {
    api.connectWebSocket()
      .then(() => setConnected(true))
      .catch(error => console.error('WebSocket连接失败:', error));
  }, [api]);

  return { api, connected };
}

// 设备管理Hook
function useDevices() {
  const [devices, setDevices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const { api } = usePhoneControlAPI();

  const loadDevices = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getDevices();
      setDevices(response.devices);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  React.useEffect(() => {
    loadDevices();

    // 订阅设备更新
    const handleDeviceUpdate = (data) => {
      setDevices(data.data);
    };

    api.on('deviceUpdate', handleDeviceUpdate);

    return () => {
      api.off('deviceUpdate', handleDeviceUpdate);
    };
  }, [api, loadDevices]);

  return {
    devices,
    loading,
    error,
    reload: loadDevices
  };
}

// 屏幕镜像Hook
function useScreenMirror(deviceId) {
  const [isActive, setIsActive] = React.useState(false);
  const [screenData, setScreenData] = React.useState(null);
  const { api } = usePhoneControlAPI();

  const startMirror = React.useCallback(async () => {
    try {
      await api.startScreenMirror(deviceId);
      setIsActive(true);
    } catch (error) {
      console.error('启动屏幕镜像失败:', error);
    }
  }, [api, deviceId]);

  const stopMirror = React.useCallback(async () => {
    try {
      await api.stopScreenMirror(deviceId);
      setIsActive(false);
      setScreenData(null);
    } catch (error) {
      console.error('停止屏幕镜像失败:', error);
    }
  }, [api, deviceId]);

  const sendInput = React.useCallback(async (action, params) => {
    try {
      await api.sendInput(deviceId, action, params);
    } catch (error) {
      console.error('发送输入失败:', error);
    }
  }, [api, deviceId]);

  React.useEffect(() => {
    if (!deviceId) return;

    const handleScreenData = (data) => {
      if (data.deviceId === deviceId) {
        setScreenData(data.data);
      }
    };

    const handleScreenStopped = (data) => {
      if (data.deviceId === deviceId) {
        setIsActive(false);
        setScreenData(null);
      }
    };

    api.on('screenData', handleScreenData);
    api.on('screenMirrorStopped', handleScreenStopped);

    return () => {
      api.off('screenData', handleScreenData);
      api.off('screenMirrorStopped', handleScreenStopped);
    };
  }, [api, deviceId]);

  return {
    isActive,
    screenData,
    startMirror,
    stopMirror,
    sendInput
  };
}

// 文件管理Hook
function useFileManager(deviceId) {
  const [currentPath, setCurrentPath] = React.useState('/sdcard/');
  const [files, setFiles] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const { api } = usePhoneControlAPI();

  const listFiles = React.useCallback(async (path = currentPath) => {
    if (!deviceId) return;
    
    try {
      setLoading(true);
      const response = await api.listFiles(deviceId, path);
      setFiles(response.files);
      setCurrentPath(response.currentPath);
    } catch (error) {
      console.error('获取文件列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [api, deviceId, currentPath]);

  const downloadFile = React.useCallback(async (filePath) => {
    try {
      await api.downloadFile(deviceId, filePath);
    } catch (error) {
      console.error('下载文件失败:', error);
    }
  }, [api, deviceId]);

  const uploadFile = React.useCallback(async (file, remotePath) => {
    try {
      await api.uploadFile(deviceId, file, remotePath);
      await listFiles(); // 刷新文件列表
    } catch (error) {
      console.error('上传文件失败:', error);
    }
  }, [api, deviceId, listFiles]);

  React.useEffect(() => {
    listFiles();
  }, [listFiles]);

  return {
    currentPath,
    files,
    loading,
    listFiles,
    downloadFile,
    uploadFile,
    setCurrentPath: (path) => {
      setCurrentPath(path);
      listFiles(path);
    }
  };
}

// 导出API客户端和Hooks
export {
  PhoneControlAPI,
  usePhoneControlAPI,
  useDevices,
  useScreenMirror,
  useFileManager
};
