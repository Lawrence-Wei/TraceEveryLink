# C3750X Management SSH VLAN 12 Troubleshooting Notes

本文记录这次把 `PIR-LAB-CORE3750-77.2` / C3750X 交换机做成可 SSH 管理设备的完整排错过程。

目标结果：

| 项目 | 值 |
| --- | --- |
| 管理 IP | `192.168.77.2/24` |
| 默认网关 | `192.168.77.1` |
| SSH 用户 | `lawrence` |
| 管理入口 | `ssh lawrence@192.168.77.2` |
| 实际承载 VLAN | `VLAN 12` / `interface Vlan12` |

> 说明：本文只适用于已授权的办公室实验设备和退役实验交换机。不要把测试 VLAN 用作绕过公司网络安全或审计控制的方式。

## 1. 现场现象

最初的目标很简单：希望这台 C3750X 可以通过管理网 `192.168.77.0/24` 被 SSH 登录：

```text
Switch management IP: 192.168.77.2/24
Gateway:              192.168.77.1
Expected SSH:         ssh lawrence@192.168.77.2
```

但实际现象是：

- 交换机 Console 可以进入。
- Windows / Ubuntu 侧无法稳定 SSH 到 `192.168.77.2`。
- 交换机原先把 `192.168.77.2/24` 放在 `interface Vlan1`。
- 上游 iStoreOS 网关 `192.168.77.1` 实际不是从 VLAN 1 学到，而是从 VLAN 12 的上联方向学到。

这就是整个问题的核心。

## 2. 从 Ubuntu 找 Console 线

Ubuntu 笔记本信息：

```text
Hostname: Laptop
IP:       192.168.77.199
User:     lawrence
```

从本机进入 Ubuntu：

```bash
ssh lawrence@192.168.77.199
```

查看 USB 串口设备：

```bash
ls -l /dev/ttyUSB* /dev/ttyACM* 2>/dev/null
ls -l /dev/serial/by-id/
```

当时识别到两根 Console 相关设备：

```text
/dev/ttyUSB0  -> FTDI FT231X USB UART
/dev/ttyACM0  -> Cisco USB Console
```

对应的 by-id 设备类似：

```text
/dev/serial/by-id/usb-FTDI_FT231X_USB_UART_D30HBAWT-if00-port0
```

查看串口占用：

```bash
fuser -v /dev/ttyUSB0
fuser -v /dev/ttyACM0
```

如果有旧的 `picocom` 占着端口，需要先退出旧会话，或者确认后杀掉对应进程：

```bash
kill 28690
```

> 本次实际发现 `/dev/ttyUSB0` 曾经被旧的 `picocom` 占用，所以先释放后再接入。

## 3. 通过串口进入交换机

用户侧手工进入 Console 的命令：

```bash
picocom -b 9600 /dev/ttyUSB0
```

进入后如果屏幕看起来“没反应”，通常不是坏了，而是 Cisco Console 没有主动输出。按几次回车即可唤醒：

```text
<Enter>
<Enter>
```

Cisco Console 常用退出键：

```text
Ctrl-a 然后 Ctrl-x
```

本次后续通过串口拿到的提示符为：

```text
PIR-LAB-CORE3750-77.2#
```

进入后先关闭分页，避免 `--More--` 截断输出：

```cisco
terminal length 0
```

## 4. 先看当前基础状态

查看当前接口摘要：

```cisco
show ip interface brief
```

重点看：

```text
Interface              IP-Address      OK? Method Status                Protocol
Vlan1                  192.168.77.2    YES manual up                    up
Vlan12                 192.168.10.7    YES manual up                    up
```

这说明当时 `192.168.77.2` 在 VLAN 1，`192.168.10.7` 在 VLAN 12。

查看 VLAN 相关配置：

```cisco
show vlan brief
show run interface Vlan1
show run interface Vlan12
```

当时关键配置类似：

```cisco
interface Vlan1
 ip address 192.168.77.2 255.255.255.0

interface Vlan12
 description LAN-LOC-INTWIFI192.168.10.0/24
 ip address 192.168.10.7 255.255.254.0
```

查看路由：

```cisco
show ip route
```

当时默认路由类似：

```cisco
ip route 0.0.0.0 0.0.0.0 192.168.10.1
```

这说明交换机原先把默认出口指向了旧办公室网关 `192.168.10.1`，不是目标 iStoreOS 网关 `192.168.77.1`。

## 5. 查 SSH 基础配置

检查 SSH 是否启用：

```cisco
show ip ssh
```

查看 SSH 相关运行配置：

```cisco
show run | include ip ssh|ip domain-name|username|enable secret
show run | section line vty
```

本次确认到的关键配置：

```cisco
ip domain-name office.lab
ip ssh version 2
username lawrence privilege 15 secret <hidden>

line vty 0 15
 login local
 transport input ssh
```

这些说明：

- 已经有本地用户 `lawrence`。
- VTY 线路使用 `login local`。
- 只允许 SSH，不允许 Telnet。
- SSH version 2 已启用。

所以问题不在“没有开 SSH”，而在“管理 IP 放错了二层位置 / 默认网关不匹配”。

## 6. 查 `192.168.77.1` 到底在哪个 VLAN

这是本次排错最关键的一步。

在交换机上查 ARP：

```cisco
show arp | include 192.168.77.1
```

查 MAC 地址表：

```cisco
show mac address-table | include da22.2a64.8d89
```

本次发现：

```text
192.168.77.1  -> MAC da22.2a64.8d89
da22.2a64.8d89 learned on VLAN 12 via Gi1/1/1
```

这句话很重要：

```text
192.168.77.1 是从 VLAN 12 学到的，不是从 VLAN 1 学到的。
```

也就是说，虽然我们想用 `192.168.77.0/24` 作为管理网，但这条网络在当前物理连接里实际被承载在 VLAN 12 上。

## 7. 为什么 VLAN 1 不行，VLAN 12 才行

Cisco 三层交换机上的 `interface VlanX` 是 SVI，意思是某个 VLAN 的三层网关/管理接口。它不是一个独立虚拟网卡随便放 IP 就一定能通，它必须依附于对应 VLAN 的二层广播域。

当 `192.168.77.2/24` 放在 `interface Vlan1` 时，交换机会认为：

```text
192.168.77.0/24 在 VLAN 1 里面。
```

于是交换机要找 `192.168.77.1` 时，会在 VLAN 1 里 ARP：

```text
Who has 192.168.77.1? Tell 192.168.77.2
```

但实际 `192.168.77.1` 的 iStoreOS 上联流量在 VLAN 12，所以这个 ARP 不会在正确的二层广播域里相遇。结果就是：

```text
Vlan1 上的 192.168.77.2 看不到 Vlan12 上的 192.168.77.1。
```

这和 IP 地址看起来在同一个 `/24` 没关系。二层 VLAN 不同的时候，它们就是两个不同的广播域：

| 项目 | 当时状态 |
| --- | --- |
| `interface Vlan1` | `192.168.77.2/24` |
| `192.168.77.1` 实际位置 | VLAN 12 |
| 结果 | 同 IP 网段，不同二层 VLAN，ARP 不通 |

所以不是“VLAN 1 永远不能做管理”，而是：

```text
管理 IP 必须放在能二层到达网关 192.168.77.1 的 VLAN 上。
```

在你的现场，能到达 `192.168.77.1` 的 VLAN 是 VLAN 12，所以这次必须把 `192.168.77.2/24` 放到 `interface Vlan12`。

## 8. 正式修复配置

进入配置模式：

```cisco
conf t
```

从 VLAN 1 移除管理 IP：

```cisco
interface Vlan1
 no ip address
 no shutdown
exit
```

把 `192.168.77.2/24` 加到 VLAN 12。因为 VLAN 12 原来已经有 `192.168.10.7/23`，所以这里把 `192.168.77.2/24` 作为 secondary 地址：

```cisco
interface Vlan12
 description LAN-LOC-INTWIFI / PIR-LAB-MGMT
 ip address 192.168.10.7 255.255.254.0
 ip address 192.168.77.2 255.255.255.0 secondary
 no shutdown
exit
```

修改默认路由，让交换机默认出口走 iStoreOS：

```cisco
no ip route 0.0.0.0 0.0.0.0 192.168.10.1
ip route 0.0.0.0 0.0.0.0 192.168.77.1
```

补一条 `ip default-gateway`：

```cisco
ip default-gateway 192.168.77.1
```

> 注意：在 `ip routing` 开启的三层交换机上，真正生效的是 `ip route 0.0.0.0 0.0.0.0 192.168.77.1`。`ip default-gateway` 对三层路由模式通常不生效，但留着无害，也方便以后如果关闭 `ip routing` 时有参考。

确认 SSH 基础配置：

```cisco
ip domain-name office.lab
ip ssh version 2
username lawrence privilege 15 secret <your-password>

line vty 0 15
 login local
 transport input ssh
exit
```

保存配置：

```cisco
end
write memory
```

或：

```cisco
wr
```

## 9. 修复后的完整关键配置

修复后应看到类似配置：

```cisco
interface Vlan1
 no ip address

interface Vlan12
 description LAN-LOC-INTWIFI / PIR-LAB-MGMT
 ip address 192.168.10.7 255.255.254.0
 ip address 192.168.77.2 255.255.255.0 secondary

ip routing
ip route 0.0.0.0 0.0.0.0 192.168.77.1
ip default-gateway 192.168.77.1

ip domain-name office.lab
ip ssh version 2
username lawrence privilege 15 secret <hidden>

line vty 0 15
 login local
 transport input ssh
```

## 10. 修复后在交换机上验证

查看 VLAN 1：

```cisco
show run interface Vlan1
```

期望：

```cisco
interface Vlan1
 no ip address
```

查看 VLAN 12：

```cisco
show run interface Vlan12
```

期望：

```cisco
interface Vlan12
 ip address 192.168.10.7 255.255.254.0
 ip address 192.168.77.2 255.255.255.0 secondary
```

查看接口状态：

```cisco
show ip interface brief
```

期望：

```text
Vlan12  192.168.10.7  YES manual up  up
```

> `show ip interface brief` 通常只显示 primary IP，不一定显示 secondary IP。要看 secondary，需要用 `show run interface Vlan12` 或 `show ip interface Vlan12`。

查看默认路由：

```cisco
show ip route
```

期望看到：

```text
Gateway of last resort is 192.168.77.1
```

查看 ARP：

```cisco
show arp | include 192.168.77
```

期望看到：

```text
Internet  192.168.77.1  ...  ARPA  Vlan12
Internet  192.168.77.2  ...  ARPA  Vlan12
```

从交换机源地址 `Vlan12` ping 网关：

```cisco
ping 192.168.77.1 source Vlan12 repeat 5
```

本次结果：

```text
!!!!!
Success rate is 100 percent (5/5)
```

## 11. 从 Ubuntu 验证网络连通性

Ubuntu 笔记本 IP：

```text
192.168.77.199
```

Ping 交换机管理 IP：

```bash
ping -c 4 192.168.77.2
```

检查 TCP 22：

```bash
nc -vz 192.168.77.2 22
```

或：

```bash
timeout 5 bash -c '</dev/tcp/192.168.77.2/22' && echo open || echo closed
```

本次结果是：

```text
192.168.77.2 ping 成功
TCP/22 成功
```

这证明：

```text
IP 层和 TCP 22 都已经通了。
```

## 12. 从 Windows 验证网络连通性

在 Windows PowerShell 上测试 ICMP：

```powershell
Test-Connection 192.168.77.2
```

测试 SSH 端口：

```powershell
Test-NetConnection 192.168.77.2 -Port 22
```

期望看到：

```text
TcpTestSucceeded : True
```

本次已经验证：

```text
Windows -> 192.168.77.2 ICMP 成功
Windows -> 192.168.77.2 TCP/22 成功
```

## 13. 为什么端口通了，SSH 客户端还可能报错

老 Cisco IOS 的 SSH 算法比较旧。现代 OpenSSH 默认禁用了很多旧算法，所以会出现这种情况：

```text
网络通了，22 端口也通了，但 ssh 命令仍然失败。
```

本次遇到过的 KEX 报错类似：

```text
Unable to negotiate with 192.168.77.2 port 22:
no matching key exchange method found.
Their offer: diffie-hellman-group-exchange-sha1,diffie-hellman-group14-sha1,diffie-hellman-group1-sha1
```

加上旧 KEX / hostkey 参数后，又遇到 cipher 报错，交换机提供的 cipher 类似：

```text
aes128-cbc,3des-cbc,aes192-cbc,aes256-cbc
```

所以旧 IOS 需要用 legacy SSH 参数连接：

```bash
ssh \
  -oKexAlgorithms=+diffie-hellman-group14-sha1 \
  -oHostKeyAlgorithms=+ssh-rsa \
  -oPubkeyAcceptedAlgorithms=+ssh-rsa \
  -oCiphers=+aes128-cbc \
  lawrence@192.168.77.2
```

如果还提示 MAC 不匹配，再加：

```bash
  -oMACs=+hmac-sha1
```

完整命令：

```bash
ssh \
  -oKexAlgorithms=+diffie-hellman-group14-sha1 \
  -oHostKeyAlgorithms=+ssh-rsa \
  -oPubkeyAcceptedAlgorithms=+ssh-rsa \
  -oCiphers=+aes128-cbc \
  -oMACs=+hmac-sha1 \
  lawrence@192.168.77.2
```

Windows PowerShell 也可以用同样参数：

```powershell
ssh -oKexAlgorithms=+diffie-hellman-group14-sha1 -oHostKeyAlgorithms=+ssh-rsa -oPubkeyAcceptedAlgorithms=+ssh-rsa -oCiphers=+aes128-cbc lawrence@192.168.77.2
```

## 14. 建议添加本机 SSH Alias

为了以后不用每次打一长串参数，可以在本机 SSH config 加一段。

Linux / macOS / Windows OpenSSH 路径通常是：

```text
~/.ssh/config
```

建议内容：

```sshconfig
Host pir-core3750 c3750x pir-lab-core77.2
  HostName 192.168.77.2
  User lawrence
  KexAlgorithms +diffie-hellman-group14-sha1
  HostKeyAlgorithms +ssh-rsa
  PubkeyAcceptedAlgorithms +ssh-rsa
  Ciphers +aes128-cbc
  MACs +hmac-sha1
```

以后连接：

```bash
ssh pir-core3750
```

## 15. 可选：改善交换机 SSH Key

如果这台 IOS 支持，可以重新生成 2048-bit RSA key：

```cisco
conf t
crypto key zeroize rsa
crypto key generate rsa modulus 2048
ip ssh version 2
ip ssh dh min size 2048
end
wr
```

注意：

- `crypto key zeroize rsa` 会删除现有 RSA key，可能会中断已有 SSH。
- 老 IOS 即使生成 2048-bit key，也不一定支持现代 KEX / cipher。
- 如果这是实验设备，最现实的方式通常还是客户端加 legacy SSH 参数。
- 如果生产长期使用，建议升级 IOS 或换新设备。

## 16. 本次用过的命令清单

### 16.1 Windows / PowerShell

```powershell
ssh lawrence@192.168.77.199
Test-Connection 192.168.77.2
Test-NetConnection 192.168.77.2 -Port 22
ssh -oKexAlgorithms=+diffie-hellman-group14-sha1 -oHostKeyAlgorithms=+ssh-rsa -oPubkeyAcceptedAlgorithms=+ssh-rsa -oCiphers=+aes128-cbc lawrence@192.168.77.2
```

### 16.2 Ubuntu

```bash
hostname
ip -4 -brief addr
ls -l /dev/ttyUSB* /dev/ttyACM* 2>/dev/null
ls -l /dev/serial/by-id/
fuser -v /dev/ttyUSB0
fuser -v /dev/ttyACM0
kill 28690
picocom -b 9600 /dev/ttyUSB0
ping -c 4 192.168.77.2
nc -vz 192.168.77.2 22
timeout 5 bash -c '</dev/tcp/192.168.77.2/22' && echo open || echo closed
```

### 16.3 Cisco show / debug 类命令

```cisco
terminal length 0
show ip interface brief
show vlan brief
show interfaces trunk
show cdp neighbors
show cdp neighbors detail
show vtp status
show run interface Vlan1
show run interface Vlan12
show run | include ip ssh|ip domain-name|username|enable secret
show run | section line vty
show ip ssh
show ip route
show arp | include 192.168.77
show arp | include 192.168.77.1
show mac address-table | include da22.2a64.8d89
ping 192.168.77.1 source Vlan12 repeat 5
```

### 16.4 Cisco 修改配置命令

```cisco
conf t

interface Vlan1
 no ip address
 no shutdown
exit

interface Vlan12
 description LAN-LOC-INTWIFI / PIR-LAB-MGMT
 ip address 192.168.10.7 255.255.254.0
 ip address 192.168.77.2 255.255.255.0 secondary
 no shutdown
exit

no ip route 0.0.0.0 0.0.0.0 192.168.10.1
ip route 0.0.0.0 0.0.0.0 192.168.77.1
ip default-gateway 192.168.77.1

ip domain-name office.lab
ip ssh version 2

line vty 0 15
 login local
 transport input ssh
exit

end
write memory
```

### 16.5 之前修 Native VLAN mismatch 时用过的命令

这部分不是本次 SSH 管理 IP 的根因，但属于同一台交换机排错过程的一部分。

当时日志出现：

```text
%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on GigabitEthernet1/1/1 (12), with CN-PIR-SHANGHAI-SW148.22 GigabitEthernet1/0/49 (1).
```

修复方向是让本端 trunk native VLAN 和对端一致：

```cisco
conf t
interface GigabitEthernet1/1/1
 switchport trunk encapsulation dot1q
 switchport trunk native vlan 1
end
wr
```

查看 trunk：

```cisco
show interfaces trunk
```

后续看到类似：

```text
Port        Mode             Encapsulation  Status        Native vlan
Gi1/0/47    on               802.1q         trunking      1
Gi1/1/1     auto             n-802.1q       trunking      1
Gi1/1/2     auto             n-802.1q       trunking      1
```

## 17. 最终结论

本次问题不是 SSH 服务没开，也不是用户名问题，而是管理 IP 所在 SVI 和真实网关所在 VLAN 不一致：

```text
错误状态：
192.168.77.2/24 在 interface Vlan1
192.168.77.1 实际在 VLAN 12
结果：ARP 不在同一个广播域，管理不通
```

修复后：

```text
192.168.77.2/24 secondary 放到 interface Vlan12
默认路由指向 192.168.77.1
交换机能 ping 通 192.168.77.1
Ubuntu / Windows 都能访问 192.168.77.2:22
```

最终可用连接方式：

```bash
ssh \
  -oKexAlgorithms=+diffie-hellman-group14-sha1 \
  -oHostKeyAlgorithms=+ssh-rsa \
  -oPubkeyAcceptedAlgorithms=+ssh-rsa \
  -oCiphers=+aes128-cbc \
  lawrence@192.168.77.2
```

一句话总结：

```text
IP 地址看起来同网段还不够，管理 SVI 必须放在网关实际所在的 VLAN 里。
```
