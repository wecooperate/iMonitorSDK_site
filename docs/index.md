---
title: 系统行为监控开发套件
hero:
  title: iMonitorSDK
  desc: <h4 style="color:#0000cd;font-weight:bold;">一款为终端、主机提供系统行为监控的开发套件 <br> 
        <h5>旨在帮助终端安全、管控、审计、零信任、主机安全等行业应用可以快速实现必要功能，而不用关心底层驱动的开发、维护和兼容性问题，让其可以专注于业务开发 <br>
        <h6 style="color:#cd1616;">累计为10+家企业提供优质服务 <br>
  actions:
    - text: 快速开始
      link: /docs
features:
  - icon: /assets/box.png
    title: 开箱即用
    desc: 快速实现进程、文件、注册表、网络等操作事件监控、拦截
  - icon: /assets/protect.png
    title: 自保护
    desc: 同时可以保护文件、进程、注册表等不被恶意软件破坏
  - icon: /assets/stable.png
    title: 良好的兼容性
    desc: 使用标准规范的实现方式，兼容性好，同时支持XP到Win11的所有系统
  - icon: /assets/action.png
    title: 丰富的交互
    desc: 可以通过返回值来禁止当前操作，或者修改操作参数、结束当前进程、注入动态库等
  - icon:  /assets/schema.png
    title: 优秀的框架
    desc: 基于IDL的消息协议框架，高效稳定，扩展性好
  - icon: /assets/rule.png
    title: 规则引擎
    desc: 内置规则引擎，不需要写代码也可以实现强大的功能
	
footer: Copyright © 2022 创信长荣科技
---

# 适用于如下的产品

-  主动防御
-  终端管控
-  入侵检测
-  主机安全
-  零信任
-  上网行为管理

# 快速入门

示例一：进程启动拦截实现

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

示例二：sysmon

```cpp
class MonitorCallback : public IMonitorCallback
{
public:
	void OnCallback(IMonitorMessage* msg) override
	{
		printf("%S ==> %S\n", msg->GetTypeName(), msg->GetFormatedString(emMSGFieldCurrentProcessPath));

		for (ULONG i = emMSGFieldCurrentProcessCommandline; i < msg->GetFieldCount(); i++) {
			printf("\t%30S : %-30S\n", msg->GetFieldName(i), msg->GetFormatedString(i));
		}
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
	for (int i = 0; i < emMSGMax; i++) {
		config.Config[i] = emMSGConfigPost;
	}
	manager.InControl(config);

	WaitForExit("");

	return 0;
}
```

<img src="./docs/sysmon.gif" />

示例三：上网行为管理（基于网络重定向的方式实现，支持https，详细参考http_access_control例子）

<img src="./docs/ac.png" />

示例四：任意时刻对进程注入动态库

```cpp
class MonitorCallback : public IMonitorCallback
{
public:
	void OnCallback(IMonitorMessage* Message) override
	{
		if (Message->GetType() != emMSGImageLoad)
			return;

		cxMSGImageLoad* msg = (cxMSGImageLoad*)Message;

		if (!msg->IsMatchCurrentProcessName(L"notepad.exe"))
			return;

		if (msg->IsMatchPath(L"*\\kernel32.dll")) {
			msg->SetInjectDll(L"D:\\test.dll");
		}
	}
};

int main()
{
	MonitorManager manager;
	MonitorCallback callback;

	HRESULT hr = manager.Start(&callback);

	CheckSignError(hr);

	if (hr != S_OK) {
		printf("start failed = %08X\n", hr);
		return 1;
	}

	manager.InControl(cxMSGUserSetGlobalConfig());

	cxMSGUserSetMSGConfig config;
	config.Config[emMSGImageLoad] = emMSGConfigSend;
	manager.InControl(config);

	WaitForExit("模块注入：在notepad.exe启动加载kernel32.dll过程中，让其强制加载D:\\test.dll");

	return 0;
}
```

# 监控扩展

iMonitorSDK不仅仅提供了核心位置的监控，同时也提供了一整套的监控框架，基于这个框架，可以很简单的自己实现扩展的监控点。

比如进程启动的演示代码如下：

```c++
		do {
			cxProcessPtr process(ProcessId);

			if (!process)
				break;

			cxMSGProcessCreate msg;

			if (!msg.IsEnable())
				break;

			msg.ProcessId = process->m_ProcessId;
			msg.Path = process->m_Path;
			msg.Commandline = process->m_Commandline;
			msg.CreateTime = process->m_CreateTime;
            ...
			msg.Dispatch();

			if (msg.IsDeny()) {
				// Disable Process Create
			}
		}

根据IDL自动生成cxMSGProcessCreate对象，设置好cxMSGProcessCreate的各个字段后，调用Dispatch后就会跟应用层通信（根据应用层设置的配置，可以是同步，也可以是异步），如果是同步的，可以通过应用层设置回来Action，然后做出相应的反馈（比如禁止、注入、重定向等等）。
```



<div class = "md_footer" >
  <a href = "https://github.com/wecooperate/iMonitorSDK/tree/master/sample"> <button> 更多示例 </button></a>
  <a href = "https://github.com/wecooperate/iMonitorSDK"> <button class="main-button"> SDK 下载 </button></a>
</div>
