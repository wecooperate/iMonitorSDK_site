---
order: 0
nav:
  path: /docs
  title: 文档
  order: 0
---

> 为了安全性，SDK所带驱动没有签名，驱动加载需要签名，测试前请先对驱动进行签名。
>
> 如果没有正式的签名证书，可以使用测试签名，详细参考：
>
> 1. 开启测试模式： https://docs.microsoft.com/zh-cn/windows-hardware/drivers/install/the-testsigning-boot-configuration-option
> 2. 对启动进行签名： https://docs.microsoft.com/zh-cn/windows-hardware/drivers/install/test-signing-a-driver-file

## 快速开始

- 从Github或者Gitee下载SDK

  Github：https://github.com/wecooperate/iMonitorSDK

  Gitee：https://gitee.com/wecooperate/iMonitorSDK

- 执行SDK目录下面的build.bat即可编译SDK带的sample

- 自己接入SDK

  1. 从IMonitorCallback继承
  2. 通过MonitorManager传入IMonitorCallback启动
  3. 设置需要监控的消息
  
  ```cpp
  class MonitorCallback : public IMonitorCallback
  {
  public:
  	void OnCallback(IMonitorMessage* Message) override
  	{
  		if (Message->GetType() != emMSGProcessCreate)
  			return;
  
  		cxMSGProcessCreate* msg = (cxMSGProcessCreate*)Message;
  
  		//
  		// 禁止进程名 cmd.exe 的进程启动
  		//
  
  		if (msg->IsMatchPath(L"*\\cmd.exe"))
  			msg->SetBlock();
  	}
  };
  
  int main()
  {
  	MonitorManager manager;
  	MonitorCallback callback;
  
  	HRESULT hr = manager.Start(&callback);
  
  	if (hr != S_OK) {
  		printf("start failed = %08X\n", hr);
  		return 0;
  	}
  
  	cxMSGUserSetMSGConfig config;
  	config.Config[emMSGProcessCreate] = emMSGConfigSend;
  	manager.InControl(config);
  
  	WaitForExit("禁止进程名 cmd.exe 的进程启动");
  
  	return 0;
  }
  ```
  
  
