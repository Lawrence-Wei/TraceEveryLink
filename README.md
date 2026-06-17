# 接线镜 / TraceEveryLink

接线镜（TraceEveryLink）是一个面向机房现场的 Cisco 设备接线可视化系统。它用于记录和查询交换机端口、配线架、墙口、AP、服务器之间的物理连接，让手机、Windows 和 Mac 用户都能通过网页直观看到“这根线从哪里来到哪里去”。

第一版按公网部署设计：公网只开放登录入口，机房资产、接线、照片、导出文件和打印任务都必须鉴权后访问。

## 已实现功能

- 机柜正面图：以机柜、U 位、设备、端口为主视角查看接线。
- Cisco Catalyst 端口建模：支持 `Gi1/0/24`、`Te1/1/1` 这类堆叠/模块/端口格式。
- 端口级接线：记录交换机、配线架前后端口、墙口、AP、服务器之间的线缆关系。
- 路径追踪：从任意端口查看经过配线架映射后的完整链路。
- 线缆状态：支持 `planned`、`draft`、`pending_verification`、`confirmed`、`faulty`、`retired`。
- 二维码标签：每根线生成二维码，可导出标签 PDF。
- 私有照片：端口/线缆照片通过鉴权 API 访问，不暴露原始文件目录。
- Excel/PDF 导出：支持线缆台账导出。
- 标签打印机 API：支持批量打印任务，可接入 HTTP JSON、ZPL、TSPL 打印网关。
- 认证与权限：支持本地账号 + TOTP MFA，也支持 Cisco、Google、GitHub OAuth/OIDC 登录。
- 审计日志：记录登录、改线、上传照片、打印、打印机配置等关键操作。
- 公网部署：提供 Docker Compose、PostgreSQL、Caddy 自动 HTTPS 和加密备份脚本。

## 技术栈

- Next.js 16 + React 19 + TypeScript
- Prisma + PostgreSQL
- Zod 校验
- Caddy 自动 HTTPS 反向代理
- Docker Compose 部署
- Vitest 单元测试

## 角色权限

- `VIEWER`：查看机柜、端口、线缆、照片。
- `SURVEYOR`：可新增线缆、上传照片、提交待复核接线。
- `REVIEWER`：可确认线缆、导出 Excel/PDF、批量打印标签。
- `ADMIN`：拥有全部权限，可配置打印机和删除资源。

OAuth 自动创建的新用户默认是 `VIEWER`，需要管理员后续提权。

## 本地开发

```powershell
npm install
Copy-Item .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

默认管理员来自 `.env`：

```env
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="ChangeMe123!"
ADMIN_MFA_ENABLED="false"
ADMIN_TOTP_SECRET="JBSWY3DPEHPK3PXP"
```

本地开发默认关闭管理员 MFA，可直接使用邮箱和密码登录。正式部署前必须替换默认管理员密码、TOTP secret、数据库密码和 `SESSION_SECRET`，并把 `ADMIN_MFA_ENABLED` 设置为 `"true"` 后重新执行 seed。

## 服务器一键安装

推荐在 Ubuntu 22.04/24.04 或 Fedora Server 上使用 Docker 模式部署。脚本会安装依赖、生成 `.env`、初始化 PostgreSQL、构建应用并启动服务。

```sh
chmod +x scripts/install-linux.sh
sudo ./scripts/install-linux.sh --mode docker --domain traceeverylink.example.com
```

如果不想用 Docker，也可以使用 native 模式。它会安装 Node.js、PostgreSQL、Nginx，并注册 `patchplan.service`：

```sh
sudo ./scripts/install-linux.sh --mode native --domain 10.10.10.50
```

常用参数：

```sh
sudo ./scripts/install-linux.sh \
  --mode docker \
  --domain traceeverylink.example.com \
  --admin-email admin@example.com \
  --admin-password 'ChangeThisPassword!'
```

也可以直接用环境变量传入：

```sh
sudo APP_DOMAIN=traceeverylink.example.com \
  POSTGRES_PASSWORD='replace-with-strong-db-password' \
  SESSION_SECRET='replace-with-at-least-32-random-characters' \
  ./scripts/install-linux.sh --mode docker
```

安装完成后脚本会打印访问地址、管理员邮箱和初始密码。默认安装目录是 `/opt/patchplan`。

## Docker Compose 手动部署

1. 准备一台云服务器，并把域名 DNS 指向该服务器。
2. 复制并编辑环境变量：

```sh
cp .env.example .env
```

至少设置：

```env
APP_DOMAIN="traceeverylink.example.com"
APP_URL="https://traceeverylink.example.com"
NEXT_PUBLIC_APP_URL="https://traceeverylink.example.com"
POSTGRES_DB="patchplan"
POSTGRES_USER="patchplan"
POSTGRES_PASSWORD="replace-with-strong-password"
SESSION_SECRET="replace-with-at-least-32-random-characters"
BACKUP_ENCRYPTION_PASSPHRASE="replace-with-backup-passphrase"
```

3. 启动：

```sh
docker compose up -d --build
```

4. 查看状态：

```sh
docker compose ps
docker compose logs -f app
```

防火墙建议：

- 只向公网开放 `80` 和 `443`。
- SSH 使用密钥登录，并限制管理员来源 IP。
- 不要把 PostgreSQL 端口暴露到公网。

PostgreSQL 只在 Docker Compose 内部网络访问。照片存储在私有 volume 中，只通过鉴权 API 读取。若需要从宿主机临时连库，请使用单独的 `docker-compose.override.yml`，不要在生产 compose 里长期暴露 `5432`。

## OAuth 登录

Google 和 GitHub 使用标准 OAuth 端点：

```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

Cisco 使用 OIDC 配置，推荐使用 discovery issuer：

```env
CISCO_CLIENT_ID=""
CISCO_CLIENT_SECRET=""
CISCO_OIDC_ISSUER="https://your-cisco-issuer.example.com"
```

如果 Cisco OIDC discovery 不可用，可以手工指定：

```env
CISCO_AUTHORIZATION_URL=""
CISCO_TOKEN_URL=""
CISCO_USERINFO_URL=""
```

可选限制登录邮箱域名：

```env
ALLOWED_EMAIL_DOMAINS="example.com,example.cn"
```

## 标签打印机 API

管理员配置打印机：

```http
POST /api/printers
PATCH /api/printers/{id}
DELETE /api/printers/{id}
```

打印机配置示例：

```json
{
  "name": "Rack Label Printer",
  "protocol": "HTTP_JSON",
  "endpoint": "https://printer-gateway.example.com/api/print",
  "apiKey": "optional-bearer-token",
  "enabled": true,
  "notes": "机房标签打印网关"
}
```

支持的协议：

- `HTTP_JSON`：向打印网关 POST JSON，包含线缆号、两端端口、二维码 URL。
- `HTTP_ZPL`：生成 ZPL 文本并 POST 到打印网关。
- `HTTP_TSPL`：生成 TSPL 文本并 POST 到打印网关。

复核员或管理员提交批量打印任务：

```http
POST /api/printing/jobs
```

请求示例：

```json
{
  "printerId": "printer-id",
  "cableIds": ["cable-id-1", "cable-id-2"],
  "copies": 1
}
```

## 导出

- `GET /api/exports/excel`：导出线缆台账。
- `GET /api/exports/pdf`：导出 PDF 台账。
- `GET /api/exports/labels`：导出二维码标签 PDF。
- `GET /api/exports/labels?ids=id1,id2`：只导出选中的线缆标签。

导出接口需要 `REVIEWER` 或 `ADMIN` 权限。

## 备份

运行：

```sh
scripts/backup.sh
```

脚本会创建：

- 加密 PostgreSQL dump
- 加密照片 volume 备份
- 自动删除 30 天以前的备份

建议在服务器 cron 中每日执行，并把备份同步到独立存储。

## 验证记录

已通过：

```sh
npm audit --audit-level=moderate
npm run typecheck
npm run test
npm run build
```

当前验证结果：

- `npm audit`：0 vulnerabilities
- `npm run typecheck`：通过
- `npm run test`：2 个测试文件，3 个测试通过
- `npm run build`：通过

本机未完成浏览器端真实联调，因为 Docker CLI 存在但 Docker Desktop daemon 未启动，且本地没有可用 PostgreSQL 服务。启动 Docker Desktop 后可用 `docker compose up -d --build` 进行完整联调。

## 目录结构

```text
prisma/
  schema.prisma          数据库模型
  seed.ts                初始化管理员、机柜、端口、线缆、打印机示例
src/app/
  page.tsx               主工作台
  DashboardClient.tsx    机柜图、查线、打印、导出交互
  login/                 登录页
  api/                   认证、线缆、照片、导出、打印机 API
src/server/
  auth.ts                本地登录、MFA、会话
  oauth.ts               Cisco/Google/GitHub OAuth
  inventory.ts           机柜和线缆数据查询
  printing.ts            标签打印机适配器
  exports.ts             Excel/PDF/标签导出
  network-model.ts       Cisco 端口校验和路径追踪
scripts/
  backup.sh              加密备份脚本
```

## 注意事项

- `.env.example` 中的默认密码和关闭 MFA 的设置只能用于开发。
- 公网部署时不要提供匿名只读页面。
- 打印机 API key 会在审计日志里脱敏。
- 标签打印机通常需要一个内网打印网关，公网应用不应直接暴露打印机管理端口。
- 第一版预留了 LLDP/CDP/SNMP 字段，但还没有实现自动发现。
