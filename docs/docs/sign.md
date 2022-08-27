---
title: 驱动签名
order: 5
---

> 如果希望购买SDK的企业没有驱动签名证书，可以联系申请正式签名的驱动版本。

为了安全性，SDK所带驱动没有签名，驱动加载需要签名，测试前请先对驱动进行签名。

如果没有正式的签名证书，可以使用测试签名，详细参考：

1. 开启测试模式： https://docs.microsoft.com/zh-cn/windows-hardware/drivers/install/the-testsigning-boot-configuration-option
2. 对启动进行签名： https://docs.microsoft.com/zh-cn/windows-hardware/drivers/install/test-signing-a-driver-file

#### 为了方便测试，SDK的bin\test_signed也附带了已经添加测试签名的驱动，按照里面的说明即可正常按照驱动





