# Dockerfile for Phone Control System
FROM node:18-alpine

# 安装系统依赖
RUN apk add --no-cache \
    android-tools \
    ffmpeg \
    python3 \
    py3-pip \
    build-base \
    linux-headers \
    udev \
    wget \
    unzip

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装Node.js依赖
RUN npm install --only=production

# 安装Scrcpy
RUN wget https://github.com/Genymobile/scrcpy/releases/download/v2.3.1/scrcpy-linux-v2.3.1.tar.gz \
    && tar -xzf scrcpy-linux-v2.3.1.tar.gz \
    && mv scrcpy-linux-v2.3.1 /opt/scrcpy \
    && ln -s /opt/scrcpy/scrcpy /usr/local/bin/scrcpy \
    && rm scrcpy-linux-v2.3.1.tar.gz

# 复制应用代码
COPY . .

# 创建必要目录
RUN mkdir -p downloads uploads logs tools temp

# 设置权限
RUN chmod +x start.sh || true

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV NODE_ENV=production
ENV ADB_SERVER_SOCKET=tcp:5037

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# 启动应用
CMD ["npm", "start"]

# Labels
LABEL maintainer="your-email@example.com"
LABEL version="1.0.0"
LABEL description="Phone Control System - Remote Android Device Management"
