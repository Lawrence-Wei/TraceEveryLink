# C3750X IOS Upgrade From Ubuntu TFTP

本文记录如何从 Ubuntu 上的 TFTP 服务，把 Cisco Catalyst 3750X 的 IOS 镜像拷贝到交换机 `flash:`，校验 MD5，并设置下次从新 IOS 启动。

适用现场：

| 项目 | 值 |
| --- | --- |
| 交换机 | `PIR-LAB-CORE3750-77.2` |
| 管理 IP | `192.168.77.2` |
| 型号 | `WS-C3750X-48P-S` |
| Ubuntu TFTP 服务器 | `192.168.77.199` |
| Ubuntu 镜像目录 | `/home/lawrence/C3750E` |
| Ubuntu TFTP 根目录 | `/var/lib/tftpboot` |
| 新 IOS 文件 | `c3750e-universalk9-mz.152-4.E10.bin` |
| 新 IOS 大小 | `25,549,824 bytes` |
| 新 IOS MD5 | `6f3b3ddec62c77747c214cc7be555ec4` |
| 旧 IOS 备份 | `/home/lawrence/C3750E/c3750e-ipbasek9-mz.150-2.SE12.bin` |

> 只在已授权的实验交换机上执行。升级 IOS 会导致交换机重启，所有接在这台交换机上的链路会短暂中断。

## 1. 升级前确认

在 Cisco Console 上先确认当前型号、版本、boot、Flash 空间：

```cisco
terminal length 0
show version
show inventory
show boot
dir flash:
show file systems
```

应确认：

```text
Model number: WS-C3750X-48P-S
Current boot: flash:c3750e-ipbasek9-mz.150-2.SE12.bin
Flash free: 大于 25,549,824 bytes
```

如果空间不足，先确认旧镜像已经备份，再删除未使用的旧目录。例如本次删除的是旧的 `12.2(55)SE10` 目录：

```cisco
delete /recursive /force flash:/c3750e-universalk9-mz.122-55.SE10
dir flash:
```

删除后本次 Flash 剩余空间为：

```text
37,003,776 bytes free
```

这个空间足够放入新的 `25,549,824 bytes` IOS 镜像，并保留当前 `15.0(2)SE12` 作为回退镜像。

## 2. 确认 Ubuntu 上镜像完整

在 Ubuntu 上确认旧镜像备份和新镜像都在：

```bash
ls -lh /home/lawrence/C3750E
md5sum /home/lawrence/C3750E/c3750e-ipbasek9-mz.150-2.SE12.bin
md5sum /home/lawrence/C3750E/c3750e-universalk9-mz.152-4.E10.bin
```

本次应看到：

```text
305610556c397ec705b26f7972da1771  c3750e-ipbasek9-mz.150-2.SE12.bin
6f3b3ddec62c77747c214cc7be555ec4  c3750e-universalk9-mz.152-4.E10.bin
```

## 3. 准备 Ubuntu TFTP 文件

Ubuntu 已安装并运行 `tftpd-hpa`，TFTP 根目录是：

```text
/var/lib/tftpboot
```

确认服务状态：

```bash
systemctl status tftpd-hpa --no-pager
ss -lunp | grep ':69 '
```

把新 IOS 放进 TFTP 根目录：

```bash
sudo install -m 0644 -o tftp -g tftp \
  /home/lawrence/C3750E/c3750e-universalk9-mz.152-4.E10.bin \
  /var/lib/tftpboot/c3750e-universalk9-mz.152-4.E10.bin
```

校验 TFTP 根目录里的文件：

```bash
ls -lh /var/lib/tftpboot/c3750e-universalk9-mz.152-4.E10.bin
md5sum /var/lib/tftpboot/c3750e-universalk9-mz.152-4.E10.bin
```

期望 MD5：

```text
6f3b3ddec62c77747c214cc7be555ec4
```

## 4. 测试交换机到 Ubuntu 连通性

在 Cisco Console 上执行：

```cisco
ping 192.168.77.199 source Vlan12
```

成功时应看到：

```text
!!!!!
Success rate is 100 percent
```

如果失败，先不要升级。检查：

- `interface Vlan12` 是否有 `192.168.77.2/24`。
- Ubuntu 是否是 `192.168.77.199/24`。
- Ubuntu TFTP 服务是否监听 UDP/69。
- 中间链路和 VLAN 是否正确。

## 5. 从 TFTP 拷贝 IOS 到交换机 Flash

在 Cisco Console 上输入：

```cisco
copy tftp: flash:
```

按提示填写：

```text
Address or name of remote host []? 192.168.77.199
Source filename []? c3750e-universalk9-mz.152-4.E10.bin
Destination filename [c3750e-universalk9-mz.152-4.E10.bin]? 
```

最后一个问题直接按回车。

传输时 Console 会显示很多感叹号：

```text
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
```

Cisco IOS 的 `copy tftp:` 默认不显示百分比。它只用符号表示进度：

| 符号 | 含义 |
| --- | --- |
| `!` | 成功传输一个数据块 |
| `.` | 某个数据块超时或重传 |
| `O` | 收到乱序包 |

传输完成后应看到类似：

```text
25549824 bytes copied in xxx.xxx secs
```

## 6. 确认文件已经写入 Flash

```cisco
dir flash:
```

应看到：

```text
c3750e-universalk9-mz.152-4.E10.bin
```

文件大小应为：

```text
25549824
```

如果看不到这个文件，或者大小不对，不要设置 boot。重新执行 `copy tftp: flash:`。

## 7. 校验 MD5

在 Cisco Console 上执行：

```cisco
verify /md5 flash:c3750e-universalk9-mz.152-4.E10.bin 6f3b3ddec62c77747c214cc7be555ec4
```

通过时会显示校验成功。只有 MD5 通过后，才继续设置 boot。

如果提示文件不存在：

```text
%Error computing MD5 hash ... (No such file or directory)
```

说明新 IOS 还没有成功写入 `flash:`，需要重新拷贝。

## 8. 设置下次从新 IOS 启动

```cisco
conf t
no boot system
boot system flash:c3750e-universalk9-mz.152-4.E10.bin
end
wr
```

检查 boot 变量：

```cisco
show boot
```

期望看到：

```text
BOOT path-list      : flash:c3750e-universalk9-mz.152-4.E10.bin
```

## 9. 重启交换机

确认 Console 线在线后执行：

```cisco
reload
```

如果提示保存配置：

```text
System configuration has been modified. Save? [yes/no]:
```

输入：

```text
yes
```

如果提示确认重启：

```text
Proceed with reload? [confirm]
```

直接按回车。

## 10. 重启后验证

交换机启动回来后执行：

```cisco
show version
show boot
dir flash:
```

确认：

```text
Cisco IOS Software ... Version 15.2(4)E10
System image file is "flash:c3750e-universalk9-mz.152-4.E10.bin"
BOOT path-list      : flash:c3750e-universalk9-mz.152-4.E10.bin
```

再确认管理面：

```cisco
show ip interface brief
ping 192.168.77.1 source Vlan12
show ip ssh
```

从电脑或 Ubuntu 测试 SSH：

```bash
ssh \
  -oKexAlgorithms=+diffie-hellman-group14-sha1 \
  -oHostKeyAlgorithms=+ssh-rsa \
  -oPubkeyAcceptedAlgorithms=+ssh-rsa \
  -oCiphers=+aes128-cbc \
  lawrence@192.168.77.2
```

## 11. 回退方法

如果新 IOS 启动后异常，而旧 IOS 仍在 Flash：

```cisco
conf t
no boot system
boot system flash:c3750e-ipbasek9-mz.150-2.SE12.bin
end
wr
reload
```

如果交换机进不了正常 IOS，但能进 boot loader，可以在 `switch:` 提示符下手工指定旧镜像启动：

```text
flash_init
dir flash:
boot flash:c3750e-ipbasek9-mz.150-2.SE12.bin
```

## 12. 本次关键命令速查

Ubuntu：

```bash
sudo install -m 0644 -o tftp -g tftp \
  /home/lawrence/C3750E/c3750e-universalk9-mz.152-4.E10.bin \
  /var/lib/tftpboot/c3750e-universalk9-mz.152-4.E10.bin

systemctl status tftpd-hpa --no-pager
ss -lunp | grep ':69 '
md5sum /var/lib/tftpboot/c3750e-universalk9-mz.152-4.E10.bin
```

Cisco：

```cisco
terminal length 0
show boot
dir flash:
show file systems
ping 192.168.77.199 source Vlan12

copy tftp: flash:

dir flash:
verify /md5 flash:c3750e-universalk9-mz.152-4.E10.bin 6f3b3ddec62c77747c214cc7be555ec4

conf t
no boot system
boot system flash:c3750e-universalk9-mz.152-4.E10.bin
end
wr
show boot
reload
```

## 13. 结论

本次升级的安全顺序是：

```text
确认旧 IOS 已备份到 Ubuntu
确认新 IOS 在 Ubuntu 且 MD5 正确
删除交换机上未使用的旧 12.2 目录释放空间
从 Ubuntu TFTP 拷贝 15.2(4)E10 到 flash:
校验 flash 中新 IOS 的 MD5
设置 boot system
保存配置
reload
show version 验证
```

不要跳过 MD5 校验。`dir flash:` 看到文件只代表传完了，不代表文件一定完整。
