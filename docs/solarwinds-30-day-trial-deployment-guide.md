# SolarWinds 30-Day Trial 部署测试教程

版本日期：2026-06-16  
适用目标：在实验环境部署 SolarWinds Observability Self-Hosted / Network Performance Monitoring 30 天试用版，用于测试 Cisco 交换机监控、接口流量、Syslog、SNMP Trap、告警和配置备份能力。

> 本教程只覆盖合法 30 天试用和采购前评估流程。不要把 SolarWinds 平台暴露到公网，不要使用破解授权。

## 1. 官方资料入口

部署前建议先打开下面几个官方页面，后面排错会用到：

| 用途 | 链接 |
|---|---|
| 30 天试用下载 | [SolarWinds Network Performance Monitoring Trial](https://www.solarwinds.com/network-performance-monitor/registration) |
| 新环境安装指南 | [Install SolarWinds Platform products in a new environment](https://documentation.solarwinds.com/en/success_center/orionplatform/content/install-new-deployment.htm) |
| 2026.1 系统要求 | [SolarWinds Platform 2026.1 system requirements](https://documentation.solarwinds.com/en/success_center/orionplatform/content/system_requirements/solarwinds_platform_2026-1_system_requirements.htm) |
| NPM 2026.1 要求 | [NPM 2026.1 system requirements](https://documentation.solarwinds.com/en/success_center/npm/content/system_requirements/npm_2026-1_system_requirements.htm) |
| 授权模型 | [SolarWinds Observability Self-Hosted licensing model](https://documentation.solarwinds.com/en/success_center/orionplatform/content/orion_platform_licensing_model.htm) |

当前官方说明里，NPM 2026.1 运行在 SolarWinds Platform 2026.1 上；试用版为全功能 30 天。试用版适合功能验证，不建议作为生产基础。

## 2. 本次实验目标

建议你用 30 天完成这些测试：

1. 添加 Cisco 交换机节点。
2. 通过 SNMPv3 采集设备状态、CPU、Memory、接口流量。
3. 对关键接口做 up/down 告警。
4. 接收 Cisco Syslog。
5. 接收 SNMP Trap。
6. 测试 NCM 配置备份和配置变更记录。
7. 统计真实需要购买的 node/interface/license 规模。

建议先监控 3 到 10 台核心/汇聚/接入交换机，不要第一天就扫全网。

## 3. 实验拓扑建议

```text
                         Management VLAN
                                |
              +-----------------+-----------------+
              |                                   |
      +-------+--------+                  +-------+--------+
      | SolarWinds VM  |                  | Cisco Switches |
      | SWLAB01        |                  | Core/Access    |
      | 10.10.10.50    |                  | 10.10.10.x     |
      +----------------+                  +----------------+

SolarWinds -> Cisco:
  ICMP
  UDP/161 SNMP
  UDP/162 Trap, optional
  UDP/514 Syslog, optional
  TCP/22 SSH for NCM backup, optional
```

## 4. 服务器规格

实验环境推荐：

| 项目 | 建议值 |
|---|---|
| VM 名称 | `SWLAB01` |
| OS | Windows Server 2022 Standard / Datacenter |
| CPU | 4 vCPU |
| RAM | 16 GB |
| Disk | 120 GB SSD，薄置备也可以，但不要低于 100 GB |
| Network | 1 张网卡，接入管理 VLAN |
| IP | 静态 IP，例如 `10.10.10.50/24` |
| DNS | 使用内网 DNS 或可靠 DNS |
| SQL | 实验用本机 SQL Server Express |
| 浏览器 | Edge / Chrome |

官方 small deployment 的最低建议是 4 CPU、16 GB RAM、100 GB SSD。生产环境应使用独立 SQL Server，不建议用 SQL Server Express。

不要安装在这些服务器上：

| 不建议/不支持 | 原因 |
|---|---|
| Domain Controller | SolarWinds Platform 产品不应安装在 DC 上 |
| Exchange / SharePoint | 官方明确限制 |
| 公网服务器 | 官方建议不要 internet-facing |
| 日常办公 Windows 10/11 | 只适合临时评估，不适合迁移到生产 |

## 5. Windows Server 预配置

### 5.1 设置主机名

在 Windows Server 上执行：

```powershell
Rename-Computer -NewName "SWLAB01" -Restart
```

重启后确认：

```powershell
hostname
```

### 5.2 设置静态 IP

如果你通过 GUI 配 IP，按你的网段填写即可。

示例：

```text
IP Address: 10.10.10.50
Subnet Mask: 255.255.255.0
Default Gateway: 10.10.10.1
DNS: 10.10.10.10
```

检查：

```powershell
ipconfig /all
ping 10.10.10.1
ping <Cisco交换机管理IP>
```

### 5.3 时间同步

SolarWinds、SQL、交换机日志都依赖时间准确。检查时间：

```powershell
w32tm /query /status
```

如果是域环境，建议使用域时间源。独立实验环境也要保证 Windows 和 Cisco 交换机时间基本一致。

### 5.4 更新系统

安装前先跑 Windows Update，避免 .NET、IIS、证书组件缺失导致安装失败。

### 5.5 登录账号权限

安装时使用本地 Administrator 或具有本地管理员权限的域账号。

## 6. 网络端口规划

### 6.1 SolarWinds Web Console

| 方向 | 端口 | 说明 |
|---|---:|---|
| 管理员电脑 -> SolarWinds | TCP/443 | Web Console，推荐 HTTPS |
| 管理员电脑 -> SolarWinds | TCP/80 | HTTP，不推荐长期使用 |

### 6.2 SolarWinds 到 Cisco

| 方向 | 端口 | 说明 |
|---|---:|---|
| SolarWinds -> Cisco | ICMP | 节点可达性 |
| SolarWinds -> Cisco | UDP/161 | SNMP polling |
| Cisco -> SolarWinds | UDP/162 | SNMP Trap |
| Cisco -> SolarWinds | UDP/514 | Syslog |
| SolarWinds -> Cisco | TCP/22 | SSH，用于 NCM 配置备份 |

如果服务器防火墙很严格，先临时允许这些端口，部署完成后再收紧到管理网段。

## 7. 下载 SolarWinds 试用版

1. 打开 [SolarWinds Trial 注册页面](https://www.solarwinds.com/network-performance-monitor/registration)。
2. 填写公司邮箱、姓名、电话、国家、公司等信息。
3. 下载 installer。
4. 将 installer 放到 SolarWinds 服务器本地目录，例如：

```text
C:\Install\SolarWinds\
```

不要从第三方下载 SolarWinds 安装包。

## 8. 安装 SolarWinds Platform

### 8.1 启动安装器

右键 installer：

```text
Run as administrator
```

### 8.2 安装向导选择

安装界面名称可能会随版本略有变化，但大体选择如下：

| 页面 | 选择 |
|---|---|
| Welcome | Start |
| Installation Type | Standard Platform |
| License Agreement | 勾选同意后 Next |
| SQL Server | Install SQL Server Express |
| Language | English 或 Simplified Chinese |
| Install Path | 默认路径即可 |
| System Check | 先处理 Critical，再继续 |

说明：

- `Install SQL Server Express` 适合实验环境。
- 如果要未来转生产，建议从一开始就用独立 SQL Server Standard/Enterprise。
- 如果 System Check 出现 Critical，必须解决后才能安装。

### 8.3 等待安装完成

安装时间取决于服务器性能和网络速度，通常 30 到 90 分钟。期间不要重启服务器，不要关闭 installer。

## 9. Configuration Wizard

安装完成后会自动启动 Configuration Wizard。

按下面方式选择：

| 页面 | 建议 |
|---|---|
| Welcome | Next |
| Stop Services | Yes |
| Database Settings | 使用安装器创建的本地 SQL Express |
| Database Account | 默认或按向导创建 |
| Website Settings | `All Unassigned` |
| Protocol | HTTPS |
| Port | 443 |
| Certificate | 没有正式证书时选择生成 self-signed certificate |
| Services | 默认全选 |
| SNMP Trap Service 提示 | 允许 SolarWinds Trap Service |

完成后访问：

```text
https://<SolarWinds服务器IP>
```

示例：

```text
https://10.10.10.50
```

浏览器提示自签证书不受信任是正常的。实验环境可以继续访问；生产环境应换成正式证书。

## 10. 首次登录和基础设置

首次打开 Web Console 后：

1. 创建管理员账号。
2. 设置强密码。
3. 确认 License Manager 中 trial 已启用。
4. 设置时区和显示偏好。
5. 进入 `Settings > All Settings` 熟悉菜单。

建议创建两个账号：

| 账号 | 用途 |
|---|---|
| `admin` | 平台管理员 |
| `netops-view` | 只读查看账号，用于体验权限控制 |

## 11. Cisco 交换机 SNMP 配置

推荐使用 SNMPv3。下面的配置以 Cisco IOS / IOS XE 为例。

### 11.1 SNMPv3 推荐配置

替换占位符：

| 占位符 | 含义 |
|---|---|
| `<SolarWinds服务器IP>` | SolarWinds VM 的 IP |
| `<AuthPassword>` | SNMPv3 认证密码 |
| `<PrivPassword>` | SNMPv3 加密密码 |

配置：

```cisco
conf t

ip access-list standard SOLARWINDS-SNMP
 permit <SolarWinds服务器IP>
exit

snmp-server view SWVIEW iso included
snmp-server group SWGROUP v3 priv read SWVIEW access SOLARWINDS-SNMP
snmp-server user swpoll SWGROUP v3 auth sha <AuthPassword> priv aes 128 <PrivPassword>

snmp-server location Shanghai
snmp-server contact Network-Team

end
write memory
```

### 11.2 SNMPv2c 临时配置

如果只是快速实验，也可以用 SNMPv2c：

```cisco
conf t

ip access-list standard SOLARWINDS-SNMP
 permit <SolarWinds服务器IP>
exit

snmp-server community <CommunityString> RO SOLARWINDS-SNMP
snmp-server location Shanghai
snmp-server contact Network-Team

end
write memory
```

SNMPv2c community 等同明文口令，不建议长期使用。

### 11.3 验证 SNMP ACL 命中

在 Cisco 上检查：

```cisco
show snmp
show access-lists SOLARWINDS-SNMP
```

如果 ACL hit count 不增加，说明 SolarWinds 请求可能没到交换机，优先检查路由、防火墙、IP 是否填错。

## 12. 添加第一台 Cisco 设备

SolarWinds Web Console：

```text
Settings > Network Discovery > Add New Discovery
```

建议第一轮只加一台交换机：

| 页面 | 配置 |
|---|---|
| Network | Specific Nodes |
| IP | 填 Cisco 管理 IP |
| Agents | 跳过 |
| Virtualization | 跳过 |
| SNMP Credentials | 添加 SNMPv3 或 SNMPv2c |
| Windows Credentials | 不需要 |
| Monitoring Settings | 默认 |
| Discovery Scheduling | Run once now |

Discovery 完成后，导入：

```text
Node
CPU
Memory
Hardware Health
关键 Interfaces
```

接口选择建议：

| 接口类型 | 是否建议导入 |
|---|---|
| Uplink | 是 |
| Core/Distribution link | 是 |
| CATO/WAN link | 是 |
| Port-channel | 是 |
| 普通用户接入口 | 先不要全部导入 |
| shutdown 接口 | 不导入 |

## 13. 验证节点监控

进入节点详情页，确认以下项目有数据：

| 项目 | 正常表现 |
|---|---|
| Node Status | Up |
| Response Time | 有曲线 |
| Packet Loss | 有曲线或 0% |
| CPU Load | 有数据 |
| Memory Used | 有数据 |
| Interfaces | 有流量图 |
| Hardware Health | 能识别则显示温度、电源、风扇等 |

如果接口流量图为空，先等 10 到 20 分钟。SNMP polling 需要几个周期才会出现趋势。

## 14. 配置 Syslog

### 14.1 Cisco 侧配置

```cisco
conf t

logging host <SolarWinds服务器IP>
logging trap warnings
logging source-interface Vlan<管理VLAN号>
service timestamps log datetime localtime show-timezone

end
write memory
```

如果不确定 source-interface，可以先不配，等收到日志后再规范。

### 14.2 测试 Syslog

在 Cisco 上制造一条低风险日志：

```cisco
send log SolarWinds syslog test from lab switch
```

更实际的测试方式是在实验接口上执行：

```cisco
conf t
interface GigabitEthernetX/Y/Z
 shutdown
 no shutdown
end
```

只在测试接口做，不要在生产业务接口做。

SolarWinds 中查看：

```text
Alerts & Activity > Log Viewer
```

## 15. 配置 SNMP Trap

### 15.1 SNMPv3 Trap

```cisco
conf t

snmp-server host <SolarWinds服务器IP> version 3 priv swpoll
snmp-server enable traps

end
write memory
```

### 15.2 SNMPv2c Trap

```cisco
conf t

snmp-server host <SolarWinds服务器IP> version 2c <CommunityString>
snmp-server enable traps

end
write memory
```

### 15.3 验证 Trap

SolarWinds 中查看：

```text
Alerts & Activity > Log Viewer
```

如果收不到，检查：

```text
Cisco -> SolarWinds UDP/162
Windows 防火墙
SNMPv3 用户/认证/加密是否一致
SolarWinds Trap Service 是否运行
```

## 16. 测试 NCM 配置备份

如果 trial 包含 NCM 或 Observability Self-Hosted 对应功能，建议测试配置备份。

### 16.1 Cisco SSH 基础配置

如果交换机已经有 AAA/SSH，先不要照抄覆盖。下面只是实验模板：

```cisco
conf t

ip domain-name example.local
crypto key generate rsa modulus 2048
ip ssh version 2

username swbackup privilege 15 secret <StrongPassword>

line vty 0 15
 transport input ssh
 login local

end
write memory
```

如果你的生产设备已经接入 TACACS+/RADIUS，应该让 SolarWinds 使用正式的网络设备管理账号，不要随意改 AAA。

### 16.2 SolarWinds 添加 NCM 凭据

在 Web Console 中：

```text
Settings > All Settings > NCM Settings > Device Login Credentials
```

添加：

| 项目 | 示例 |
|---|---|
| Credential Name | Cisco-SSH-Backup |
| Username | `swbackup` |
| Password | `<StrongPassword>` |
| Enable Level | 如需要则填写 enable secret |
| Protocol | SSH |
| Port | 22 |

### 16.3 测试配置下载

进入节点：

```text
Node Details > Management / Configs > Download Config
```

或：

```text
Settings > NCM Settings > Jobs > Create New Job
```

创建每日配置备份任务：

| 项目 | 建议 |
|---|---|
| Job Type | Download Configs |
| Nodes | 先选测试交换机 |
| Schedule | Daily, 02:00 |
| Config Type | Running + Startup |

验证是否能看到 running-config 和 startup-config。

## 17. 告警测试

### 17.1 推荐先测的告警

| 告警 | 测试方式 |
|---|---|
| Node Down | 测试设备断开管理网，或用测试节点模拟 |
| Interface Down | 在测试接口 `shutdown` |
| High CPU | 一般不建议人为打高生产设备 CPU |
| High Memory | 观察即可 |
| Interface Errors/Discards | 找已有错误接口验证 |
| Config Changed | 改一行 description 后保存 |
| Syslog Contains Suspended | 用 EtherChannel suspend 日志触发规则 |

### 17.2 接口 Down 告警建议

不要对所有接口都启用 Interface Down 告警。建议只对这些接口启用：

```text
Uplink
WAN/CATO
Firewall link
Server trunk
Port-channel
核心互联
```

普通用户端口如果全开告警，会产生大量噪音。

### 17.3 CATO / EtherChannel 相关 Syslog 关键字

可以重点观察这些关键字：

```text
LINEPROTO
LINK
EC
ETHERCHANNEL
SUSPENDED
STP
ERRDISABLE
```

你之前遇到的 `Gi2/0/46 suspended`，如果交换机发出相关 syslog，可以通过 SolarWinds 做告警。

## 18. Dashboard 建议

建议建立一个 `Network Operations - Shanghai` 页面，放这些组件：

| 区域 | 内容 |
|---|---|
| Top Left | 当前 Down Nodes |
| Top Right | 当前 Active Alerts |
| Middle | Critical Interfaces |
| Middle | Top 10 Interfaces by Utilization |
| Middle | Top 10 Errors/Discards |
| Bottom | Recent Syslog |
| Bottom | Recent Config Changes |

关键节点建议分组：

```text
Shanghai-Core
Shanghai-Access
Shanghai-CATO
Shanghai-Firewall
```

## 19. 30 天测试计划

| 时间 | 任务 | 输出物 |
|---|---|---|
| 第 1 天 | 安装 SolarWinds，创建 admin，确认 Web Console | 安装截图、访问 URL |
| 第 2 天 | 配置 1 台 Cisco SNMPv3，Discovery 导入 | 节点详情截图 |
| 第 3 天 | 导入关键接口，观察流量 | 接口流量截图 |
| 第 4-5 天 | 添加 3 到 5 台设备 | 节点列表 |
| 第 6-7 天 | 配置 Syslog 和 Trap | Log Viewer 截图 |
| 第 8-10 天 | 配置接口 Down / Node Down 告警 | 告警触发截图 |
| 第 11-14 天 | 配置 NCM SSH 凭据和配置备份 | running-config 备份记录 |
| 第 15-18 天 | 测试配置变更记录 | Config diff 截图 |
| 第 19-22 天 | 优化 Dashboard | Dashboard 截图 |
| 第 23-25 天 | 生成可用性/接口流量报表 | PDF/报表截图 |
| 第 26-28 天 | 统计节点、接口、功能需求 | 授权需求表 |
| 第 29-30 天 | 总结是否采购 | 评估结论 |

## 20. 采购前需要统计的数据

试用结束前，整理这些数据：

| 项目 | 示例 |
|---|---|
| 需要监控的网络设备数量 | 80 台 |
| 只 Ping 的节点数量 | 20 台 |
| 需要 SNMP 的节点数量 | 60 台 |
| 需要监控的接口数量 | 300 个 |
| 需要 NCM 备份的设备数量 | 60 台 |
| 需要 Syslog 的设备数量 | 60 台 |
| 需要 Trap 的设备数量 | 60 台 |
| 同时登录 SolarWinds 的用户数 | 5 到 10 人 |
| 是否需要 HA | 是/否 |
| 是否需要 Additional Polling Engine | 是/否 |

这些数据会直接影响报价和架构。

## 21. 常见问题排查

### 21.1 安装器 System Check 失败

检查：

```text
RAM 是否低于 16 GB
磁盘是否低于 100 GB
是否装在 Domain Controller
Windows Update 是否未完成
是否缺少重启
是否没有管理员权限
```

### 21.2 Web Console 打不开

检查：

```powershell
Get-Service *SolarWinds*
Get-Service W3SVC
```

检查端口：

```powershell
netstat -ano | findstr ":443"
```

浏览器访问：

```text
https://localhost
https://<SolarWinds服务器IP>
```

### 21.3 SNMP Discovery 失败

优先检查：

```text
SolarWinds 能否 ping 通交换机管理 IP
Cisco ACL 是否 permit SolarWinds IP
SNMPv3 auth/priv 密码是否一致
SNMPv3 group 是否是 priv
UDP/161 是否被防火墙阻断
交换机是否使用了正确的 VRF/管理接口
```

Cisco 检查：

```cisco
show snmp
show access-lists SOLARWINDS-SNMP
show run | include snmp-server
```

### 21.4 接口没有流量图

处理：

```text
等待 10 到 20 分钟
确认导入的是正确接口
确认接口状态 up/up
确认 SNMP ifHCInOctets/ifHCOutOctets 能被读取
确认没有只选择 Node 而没选择 Interface
```

### 21.5 收不到 Syslog

检查：

```text
Cisco logging host 是否正确
logging trap 级别是否太高
UDP/514 是否被 Windows 防火墙挡住
SolarWinds Syslog Service 是否运行
source-interface 是否可达 SolarWinds
```

Cisco 检查：

```cisco
show logging
show run | include logging
```

### 21.6 NCM 备份失败

检查：

```text
SolarWinds 到 Cisco TCP/22 是否通
SSH 用户名密码是否正确
账号 privilege 是否足够
enable secret 是否需要填写
设备模板是否识别正确
AAA/TACACS 是否限制了 SolarWinds 来源 IP
```

Cisco 检查：

```cisco
show ip ssh
show users
show logging | include SSH
```

## 22. 安全建议

1. SolarWinds 服务器不要暴露到公网。
2. SNMP 优先用 SNMPv3。
3. SNMP ACL 只允许 SolarWinds 服务器 IP。
4. Web Console 使用 HTTPS。
5. 管理员账号使用强密码。
6. NCM 备份账号单独创建，避免共用个人账号。
7. 定期导出测试报告，不要把真实密码写进文档。
8. 测试接口 shutdown/no shutdown 前确认不是生产链路。

## 23. 最小可执行部署清单

部署前：

```text
[ ] Windows Server 2022 VM 已创建
[ ] 4 vCPU / 16 GB RAM / 120 GB SSD
[ ] 静态 IP 已配置
[ ] 能 ping 到 Cisco 管理 IP
[ ] Windows Update 完成
[ ] SolarWinds installer 已下载
```

安装中：

```text
[ ] Run as administrator
[ ] Standard Platform
[ ] Install SQL Server Express
[ ] HTTPS 443
[ ] Configuration Wizard 完成
```

Cisco：

```text
[ ] SNMPv3 配置完成
[ ] ACL permit SolarWinds IP
[ ] Syslog host 配置完成
[ ] Trap host 配置完成
[ ] SSH/NCM 账号配置完成
```

SolarWinds：

```text
[ ] Discovery 成功
[ ] Node Up
[ ] CPU/Memory 有数据
[ ] 关键接口有流量
[ ] Syslog 有日志
[ ] Trap 有事件
[ ] NCM 能下载配置
[ ] 告警能触发
```

## 24. 建议命名规范

### 24.1 节点 Caption

```text
CN-PIR-SHANGHAI-BB148.2
CN-PIR-SHANGHAI-CORE01
CN-PIR-SHANGHAI-ACCESS01
```

### 24.2 自定义属性

建议添加这些 custom properties：

| 属性 | 示例 |
|---|---|
| Site | Shanghai |
| Role | Core / Access / WAN |
| Vendor | Cisco |
| Criticality | High / Medium / Low |
| Owner | Network |
| Service | CATO / LAN / WAN |

后续做 Dashboard、告警、报表会很方便。

## 25. 试用结束前的结论模板

```text
SolarWinds 30-Day Trial 评估结论

评估时间：
评估人：
部署版本：
监控节点数：
监控接口数：
测试设备类型：

已验证能力：
- SNMP 节点监控：
- 接口流量：
- CPU/Memory：
- Syslog：
- SNMP Trap：
- NCM 配置备份：
- 告警：
- Dashboard：
- 报表：

主要优点：
1.
2.
3.

主要问题：
1.
2.
3.

采购建议：
□ 建议采购
□ 暂缓采购
□ 改用其他方案

建议授权规模：
建议服务器规格：
是否需要 HA：
是否需要独立 SQL：
```
