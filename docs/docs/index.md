---
order: 0
nav:
  path: /docs
  title: 文档
  order: 1
---

## 快速开始

### 获取SDK

通过Github下载SDK：https://github.com/wecooperate/iMonitorSDK

执行SDK目录下面的build.bat即可编译SDK带的sample

### 手动接入SDK

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

更多的使用说明可以参考SDK的sample和文档的接口说明。
