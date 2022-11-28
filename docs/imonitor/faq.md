---
title: 常见问题
order: 10
---

## Win7提示加载驱动失败

因为安全性，现在数字证书都使用sha256的算法，但是因为早期版本win7系统不支持sha256的签名证书 ，会导致无法识别签名。

解决方案：安装补丁支持sha256签名证书

[KB3033929](https://technet.microsoft.com/en-us/library/security/3033929) 支持sha256证书

[KB2921916](https://support.microsoft.com/en-us/kb/2921916)  修复静默安装时即使授权也会被判断为不信任的发布者
