import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Smartphone, Wifi, Usb, FolderOpen, Terminal, Plus, Trash2, Power, Battery, Signal, RefreshCw, Download, Upload, Play, Square } from 'lucide-react';

const PhoneControlSystem = () => {
  const [phones, setPhones] = useState([
    {
      id: 'phone_001',
      name: '华为 P40',
      model: 'P40 Pro',
      android_version: '10',
      ip: '192.168.1.100',
      status: 'online',
      connection: 'wifi',
      battery: 85,
      signal: 4,
      screen_resolution: '2640x1200',
      last_seen: new Date().toISOString()
    },
    {
      id: 'phone_002', 
      name: '小米 11',
      model: 'Mi 11',
      android_version: '11',
      ip: '192.168.1.101',
      status: 'online',
      connection: 'usb',
      battery: 62,
      signal: 3,
      screen_resolution: '3200x1440',
      last_seen: new Date().toISOString()
    },
    {
      id: 'phone_003',
      name: 'Samsung S21',
      model: 'Galaxy S21',
      android_version: '12',
      ip: '192.168.1.102', 
      status: 'offline',
      connection: 'wifi',
      battery: 0,
      signal: 0,
      screen_resolution: '2400x1080',
      last_seen: new Date(Date.now() - 300000).toISOString()
    }
  ]);

  const [selectedPhone, setSelectedPhone] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [commandHistory, setCommandHistory] = useState([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isScreenMirroring, setIsScreenMirroring] = useState(false);
  const [fileSystem, setFileSystem] = useState({
    currentPath: '/sdcard/',
    files: [
      { name: 'Download', type: 'folder', size: '-', modified: '2024-01-15' },
      { name: 'Pictures', type: 'folder', size: '-', modified: '2024-01-14' },
      { name: 'Documents', type: 'folder', size: '-', modified: '2024-01-13' },
      { name: 'test.txt', type: 'file', size: '1.2KB', modified: '2024-01-12' },
      { name: 'app.apk', type: 'file', size: '25.6MB', modified: '2024-01-11' }
    ]
  });

  const canvasRef = useRef(null);

  useEffect(() => {
    // 模拟屏幕镜像
    if (isScreenMirroring && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // 绘制模拟的手机屏幕
      const drawMockScreen = () => {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 状态栏
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, canvas.width, 30);
        
        // 时间
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(new Date().toLocaleTimeString(), 10, 20);
        
        // 电池
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(canvas.width - 60, 8, 50, 14);
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText('85%', canvas.width - 55, 18);
        
        // 主屏幕图标网格
        const iconSize = 60;
        const spacing = 20;
        const cols = 4;
        const startX = (canvas.width - (cols * iconSize + (cols - 1) * spacing)) / 2;
        const startY = 60;
        
        for (let row = 0; row < 6; row++) {
          for (let col = 0; col < cols; col++) {
            const x = startX + col * (iconSize + spacing);
            const y = startY + row * (iconSize + spacing);
            
            // 图标背景
            ctx.fillStyle = '#3b82f6';
            ctx.roundRect(x, y, iconSize, iconSize, 12);
            ctx.fill();
            
            // 图标文字
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('App', x + iconSize/2, y + iconSize/2 + 3);
          }
        }
        
        // 底部导航栏
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
        
        // 导航按钮
        const navButtons = ['⬅', '⚫', '▢'];
        navButtons.forEach((btn, idx) => {
          ctx.fillStyle = '#fff';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(btn, canvas.width/2 + (idx - 1) * 80, canvas.height - 25);
        });
      };
      
      drawMockScreen();
      const interval = setInterval(drawMockScreen, 1000);
      return () => clearInterval(interval);
    }
  }, [isScreenMirroring]);

  const executeCommand = () => {
    if (!currentCommand.trim() || !selectedPhone) return;
    
    const newCommand = {
      id: Date.now(),
      command: currentCommand,
      timestamp: new Date().toLocaleTimeString(),
      result: `执行命令: ${currentCommand}\n输出: 命令执行成功`,
      status: 'success'
    };
    
    setCommandHistory([newCommand, ...commandHistory]);
    setCurrentCommand('');
  };

  const addNewPhone = () => {
    const newPhone = {
      id: `phone_${Date.now()}`,
      name: '新设备',
      model: '未知',
      android_version: '未知',
      ip: '待分配',
      status: 'connecting',
      connection: 'usb',
      battery: 0,
      signal: 0,
      screen_resolution: '未知',
      last_seen: new Date().toISOString()
    };
    setPhones([...phones, newPhone]);
  };

  const removePhone = (phoneId) => {
    setPhones(phones.filter(phone => phone.id !== phoneId));
    if (selectedPhone && selectedPhone.id === phoneId) {
      setSelectedPhone(null);
    }
  };

  const toggleScreenMirror = () => {
    setIsScreenMirroring(!isScreenMirroring);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'connecting': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionIcon = (connection) => {
    return connection === 'wifi' ? <Wifi className="w-4 h-4" /> : <Usb className="w-4 h-4" />;
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* 头部工具栏 */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Monitor className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">手机群控系统</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>在线设备: {phones.filter(p => p.status === 'online').length}</span>
              <span>/</span>
              <span>总设备: {phones.length}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={addNewPhone}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>添加设备</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
              <span>刷新</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 设备列表侧边栏 */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-700">设备列表</h2>
          </div>
          <div className="divide-y">
            {phones.map((phone) => (
              <div
                key={phone.id}
                onClick={() => setSelectedPhone(phone)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedPhone?.id === phone.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-800">{phone.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhone(phone.id);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>{phone.model}</span>
                    <span className={`font-medium ${getStatusColor(phone.status)}`}>
                      {phone.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {getConnectionIcon(phone.connection)}
                      <span>{phone.ip}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Battery className="w-4 h-4" />
                      <span>{phone.battery}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col">
          {selectedPhone ? (
            <>
              {/* 设备信息头部 */}
              <div className="bg-white border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">{selectedPhone.name}</h2>
                    <p className="text-gray-600">{selectedPhone.model} • Android {selectedPhone.android_version}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Power className={`w-5 h-5 ${getStatusColor(selectedPhone.status)}`} />
                      <span className="text-sm text-gray-600">状态: {selectedPhone.status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Battery className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">{selectedPhone.battery}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Signal className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">信号: {selectedPhone.signal}/5</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 功能标签页 */}
              <div className="bg-white border-b">
                <div className="flex space-x-8 px-6">
                  {[
                    { id: 'overview', name: '概览', icon: Monitor },
                    { id: 'screen', name: '屏幕镜像', icon: Smartphone },
                    { id: 'files', name: '文件管理', icon: FolderOpen },
                    { id: 'terminal', name: '命令终端', icon: Terminal }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 标签页内容 */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'overview' && (
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">设备型号</p>
                            <p className="text-lg font-semibold">{selectedPhone.model}</p>
                          </div>
                          <Smartphone className="w-8 h-8 text-blue-500" />
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">连接方式</p>
                            <p className="text-lg font-semibold">{selectedPhone.connection.toUpperCase()}</p>
                          </div>
                          {getConnectionIcon(selectedPhone.connection)}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">屏幕分辨率</p>
                            <p className="text-lg font-semibold">{selectedPhone.screen_resolution}</p>
                          </div>
                          <Monitor className="w-8 h-8 text-green-500" />
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">最后在线</p>
                            <p className="text-lg font-semibold">
                              {new Date(selectedPhone.last_seen).toLocaleTimeString()}
                            </p>
                          </div>
                          <RefreshCw className="w-8 h-8 text-gray-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'screen' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">屏幕镜像</h3>
                      <button
                        onClick={toggleScreenMirror}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                          isScreenMirroring
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {isScreenMirroring ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>{isScreenMirroring ? '停止镜像' : '开始镜像'}</span>
                      </button>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4 flex justify-center">
                      {isScreenMirroring ? (
                        <canvas
                          ref={canvasRef}
                          width={300}
                          height={600}
                          className="border border-gray-600 rounded-lg"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                          <Smartphone className="w-16 h-16 mb-4" />
                          <p>点击"开始镜像"查看设备屏幕</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'files' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">文件管理器</h3>
                      <div className="text-sm text-gray-600">
                        当前路径: {fileSystem.currentPath}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow">
                      <div className="divide-y">
                        {fileSystem.files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50">
                            <div className="flex items-center space-x-3">
                              {file.type === 'folder' ? (
                                <FolderOpen className="w-5 h-5 text-blue-500" />
                              ) : (
                                <div className="w-5 h-5 bg-gray-300 rounded"></div>
                              )}
                              <span className="font-medium">{file.name}</span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{file.size}</span>
                              <span>{file.modified}</span>
                              <div className="flex space-x-2">
                                <button className="text-blue-600 hover:text-blue-800">
                                  <Download className="w-4 h-4" />
                                </button>
                                <button className="text-green-600 hover:text-green-800">
                                  <Upload className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'terminal' && (
                  <div className="p-6 flex flex-col h-full">
                    <h3 className="text-lg font-semibold mb-4">命令终端</h3>
                    <div className="flex-1 bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-hidden flex flex-col">
                      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                        {commandHistory.map((cmd) => (
                          <div key={cmd.id} className="text-white">
                            <div className="text-green-400">
                              [{cmd.timestamp}] $ {cmd.command}
                            </div>
                            <div className="text-gray-300 whitespace-pre-wrap ml-4">
                              {cmd.result}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2 border-t border-gray-700 pt-4">
                        <span className="text-green-400">$</span>
                        <input
                          type="text"
                          value={currentCommand}
                          onChange={(e) => setCurrentCommand(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
                          placeholder="输入ADB命令..."
                          className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
                        />
                        <button
                          onClick={executeCommand}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          执行
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Smartphone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h2 className="text-xl font-semibold mb-2">选择设备</h2>
                <p>从左侧列表选择要管理的设备</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhoneControlSystem;
