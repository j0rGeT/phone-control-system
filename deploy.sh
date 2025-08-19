#!/bin/bash
# deploy.sh - 自动化部署脚本

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印彩色消息
print_message() {
    color=$1
    message=$2
    echo -e "${color}[$(date +'%Y-%m-%d %H:%M:%S')] ${message}${NC}"
}

print_success() {
    print_message $GREEN "✅ $1"
}

print_error() {
    print_message $RED "❌ $1"
}

print_warning() {
    print_message $YELLOW "⚠️  $1"
}

print_info() {
    print_message $BLUE "ℹ️  $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装，请先安装 $1"
        exit 1
    fi
}

# 检查端口是否被占用
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        print_warning "端口 $1 已被占用"
        return 1
    fi
    return 0
}

# 检查系统要求
check_requirements() {
    print_info "检查系统要求..."
    
    # 检查操作系统
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        print_error "不支持的操作系统: $OSTYPE"
        exit 1
    fi
    
    print_success "操作系统: $OS"
    
    # 检查Node.js
    check_command "node"
    NODE_VERSION=$(node --version)
    print_success "Node.js版本: $NODE_VERSION"
    
    # 检查npm
    check_command "npm"
    NPM_VERSION=$(npm --version)
    print_success "npm版本: $NPM_VERSION"
    
    # 检查Git
    check_command "git"
    GIT_VERSION=$(git --version)
    print_success "Git版本: $GIT_VERSION"
}

# 安装ADB
install_adb() {
    print_info "安装ADB..."
    
    if command -v adb &> /dev/null; then
        print_success "ADB已安装: $(adb --version | head -1)"
        return
    fi
    
    case $OS in
        "linux")
            if command -v apt &> /dev/null; then
                sudo apt update
                sudo apt install -y android-tools-adb android-tools-fastboot
            elif command -v yum &> /dev/null; then
                sudo yum install -y android-tools
            else
                print_error "不支持的Linux发行版"
                exit 1
            fi
            ;;
        "macos")
            if command -v brew &> /dev/null; then
                brew install android-platform-tools
            else
                print_error "请先安装Homebrew"
                exit 1
            fi
            ;;
        "windows")
            print_warning "请手动下载并安装ADB工具"
            print_info "下载地址: https://developer.android.com/studio/releases/platform-tools"
            ;;
    esac
    
    if command -v adb &> /dev/null; then
        print_success "ADB安装成功"
    else
        print_error "ADB安装失败"
        exit 1
    fi
}

# 安装Scrcpy
install_scrcpy() {
    print_info "安装Scrcpy..."
    
    if command -v scrcpy &> /dev/null; then
        print_success "Scrcpy已安装: $(scrcpy --version | head -1)"
        return
    fi
    
    case $OS in
        "linux")
            if command -v apt &> /dev/null; then
                sudo apt install -y scrcpy
            elif command -v snap &> /dev/null; then
                sudo snap install scrcpy
            else
                print_warning "使用预编译版本安装Scrcpy..."
                SCRCPY_VERSION="2.3.1"
                wget -O /tmp/scrcpy.tar.gz "https://github.com/Genymobile/scrcpy/releases/download/v${SCRCPY_VERSION}/scrcpy-linux-v${SCRCPY_VERSION}.tar.gz"
                sudo tar -xzf /tmp/scrcpy.tar.gz -C /opt/
                sudo ln -sf /opt/scrcpy-linux-v${SCRCPY_VERSION}/scrcpy /usr/local/bin/scrcpy
                rm /tmp/scrcpy.tar.gz
            fi
            ;;
        "macos")
            if command -v brew &> /dev/null; then
                brew install scrcpy
            else
                print_error "请先安装Homebrew"
                exit 1
            fi
            ;;
        "windows")
            print_warning "请手动下载并安装Scrcpy"
            print_info "下载地址: https://github.com/Genymobile/scrcpy/releases"
            ;;
    esac
    
    if command -v scrcpy &> /dev/null; then
        print_success "Scrcpy安装成功"
    else
        print_error "Scrcpy安装失败"
        exit 1
    fi
}

# 设置项目
setup_project() {
    print_info "设置项目..."
    
    # 安装Node.js依赖
    print_info "安装依赖包..."
    npm install
    
    # 创建必要目录
    print_info "创建目录结构..."
    mkdir -p downloads uploads logs temp tools
    
    # 设置权限
    if [[ "$OS" != "windows" ]]; then
        chmod 755 downloads uploads logs temp tools
    fi
    
    # 复制配置文件
    if [ ! -f config.json ]; then
        print_info "创建默认配置文件..."
        cp config.example.json config.json 2>/dev/null || cat > config.json << EOF
{
  "server": {
    "port": 3001,
    "host": "0.0.0.0"
  },
  "adb": {
    "path": "adb",
    "timeout": 30000
  },
  "scrcpy": {
    "path": "scrcpy",
    "maxSize": 720,
    "bitRate": 8000000
  },
  "security": {
    "allowedCommands": ["shell", "pull", "push", "install", "uninstall"],
    "blockedCommands": ["rm -rf", "format", "dd", "fastboot"]
  },
  "storage": {
    "maxFileSize": 104857600,
    "downloadPath": "./downloads",
    "uploadPath": "./uploads"
  }
}
EOF
    fi
    
    print_success "项目设置完成"
}

# 启动服务
start_service() {
    print_info "启动手机群控服务..."
    
    # 检查端口
    if ! check_port 3001; then
        print_error "端口3001被占用，请停止相关服务或修改配置"
        exit 1
    fi
    
    # 启动ADB服务器
    print_info "启动ADB服务器..."
    adb start-server
    
    # 启动应用服务
    if [ "$1" == "dev" ]; then
        print_info "以开发模式启动..."
        npm run dev
    elif [ "$1" == "docker" ]; then
        print_info "使用Docker启动..."
        docker-compose up -d
        print_success "服务已在Docker中启动"
        print_info "访问地址: http://localhost:3001"
    else
        print_info "以生产模式启动..."
        npm start &
        echo $! > .server.pid
        sleep 2
        
        if kill -0 $(cat .server.pid) 2>/dev/null; then
            print_success "服务启动成功 (PID: $(cat .server.pid))"
            print_info "访问地址: http://localhost:3001"
        else
            print_error "服务启动失败"
            exit 1
        fi
    fi
}

# 停止服务
stop_service() {
    print_info "停止服务..."
    
    if [ -f .server.pid ]; then
        PID=$(cat .server.pid)
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            rm .server.pid
            print_success "服务已停止"
        else
            print_warning "服务未运行"
            rm .server.pid
        fi
    else
        print_warning "未找到服务PID文件"
    fi
    
    # 停止Docker服务
    if [ -f docker-compose.yml ] && command -v docker-compose &> /dev/null; then
        docker-compose down
    fi
}

# 更新系统
update_system() {
    print_info "更新系统..."
    
    # 备份当前版本
    BACKUP_DIR="../phone-control-backup-$(date +%Y%m%d_%H%M%S)"
    print_info "创建备份: $BACKUP_DIR"
    cp -r . "$BACKUP_DIR"
    
    # 拉取最新代码
    if [ -d .git ]; then
        print_info "更新代码..."
        git pull origin main
    else
        print_warning "非Git仓库，跳过代码更新"
    fi
    
    # 更新依赖
    print_info "更新依赖..."
    npm update
    
    print_success "系统更新完成"
}

# 卸载系统
uninstall_system() {
    print_warning "准备卸载手机群控系统..."
    
    read -p "确定要卸载吗？这将删除所有数据 (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "取消卸载"
        exit 0
    fi
    
    # 停止服务
    stop_service
    
    # 删除文件
    print_info "清理文件..."
    rm -rf downloads uploads logs temp tools
    rm -f .server.pid config.json
    
    # 停止ADB服务器
    adb kill-server 2>/dev/null || true
    
    print_success "卸载完成"
}

# 显示帮助信息
show_help() {
    echo "手机群控系统部署脚本"
    echo ""
    echo "用法: $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  install    - 完整安装系统"
    echo "  start      - 启动服务 (生产模式)"
    echo "  start dev  - 启动服务 (开发模式)"
    echo "  start docker - 使用Docker启动"
    echo "  stop       - 停止服务"
    echo "  restart    - 重启服务"
    echo "  update     - 更新系统"
    echo "  status     - 查看服务状态"
    echo "  logs       - 查看日志"
    echo "  uninstall  - 卸载系统"
    echo "  help       - 显示帮助"
    echo ""
    echo "示例:"
    echo "  $0 install        # 完整安装"
    echo "  $0 start          # 启动服务"
    echo "  $0 start dev      # 开发模式启动"
    echo "  $0 status         # 查看状态"
}

# 查看服务状态
show_status() {
    print_info "检查服务状态..."
    
    # 检查进程
    if [ -f .server.pid ]; then
        PID=$(cat .server.pid)
        if kill -0 $PID 2>/dev/null; then
            print_success "服务运行中 (PID: $PID)"
            
            # 显示资源使用情况
            if command -v ps &> /dev/null; then
                ps -p $PID -o pid,ppid,pcpu,pmem,time,comm --no-headers
            fi
        else
            print_error "服务未运行 (PID文件存在但进程不存在)"
        fi
    else
        print_warning "服务未运行 (无PID文件)"
    fi
    
    # 检查端口
    if check_port 3001; then
        print_warning "端口3001未被监听"
    else
        print_success "端口3001正在监听"
    fi
    
    # 检查ADB服务器
    if pgrep -f "adb.*server" > /dev/null; then
        print_success "ADB服务器运行中"
    else
        print_warning "ADB服务器未运行"
    fi
    
    # 检查连接的设备
    if command -v adb &> /dev/null; then
        DEVICE_COUNT=$(adb devices | grep -c "device$" || echo "0")
        print_info "已连接设备数量: $DEVICE_COUNT"
    fi
    
    # Docker状态
    if [ -f docker-compose.yml ] && command -v docker-compose &> /dev/null; then
        print_info "Docker服务状态:"
        docker-compose ps
    fi
}

# 查看日志
show_logs() {
    print_info "查看系统日志..."
    
    if [ -f logs/system.log ]; then
        tail -f logs/system.log
    elif [ -f docker-compose.yml ] && command -v docker-compose &> /dev/null; then
        docker-compose logs -f
    else
        print_warning "未找到日志文件"
    fi
}

# 重启服务
restart_service() {
    print_info "重启服务..."
    stop_service
    sleep 2
    start_service $1
}

# 完整安装
full_install() {
    print_info "开始完整安装..."
    
    check_requirements
    install_adb
    install_scrcpy
    setup_project
    
    print_success "安装完成！"
    print_info ""
    print_info "下一步操作:"
    print_info "1. 修改配置文件 config.json (如需要)"
    print_info "2. 运行 '$0 start' 启动服务"
    print_info "3. 打开浏览器访问 http://localhost:3001"
    print_info "4. 连接Android设备并启用USB调试"
}

# 性能监控
monitor_performance() {
    print_info "性能监控模式..."
    
    while true; do
        clear
        echo "==================== 手机群控系统监控 ===================="
        echo "时间: $(date)"
        echo ""
        
        # 系统资源
        echo "系统资源使用:"
        if command -v free &> /dev/null; then
            free -h | grep -E "(Mem|Swap)"
        fi
        
        if command -v df &> /dev/null; then
            echo "磁盘使用:"
            df -h . | tail -1
        fi
        
        echo ""
        
        # 服务状态
        show_status 2>/dev/null
        
        echo ""
        echo "按 Ctrl+C 退出监控"
        
        sleep 5
    done
}

# 主函数
main() {
    case "${1:-help}" in
        "install")
            full_install
            ;;
        "start")
            start_service $2
            ;;
        "stop")
            stop_service
            ;;
        "restart")
            restart_service $2
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "update")
            update_system
            ;;
        "uninstall")
            uninstall_system
            ;;
        "monitor")
            monitor_performance
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 信号处理
trap 'print_warning "\n用户中断操作"; exit 130' INT
trap 'print_error "\n脚本异常终止"; exit 1' ERR

# 执行主函数
main "$@"
