---
title: 网络代理
order: 4
---

## 网络代理

> 网络代理可以利用重定向中间人技术，接管系统的所有tcp网络连接。
>
> 适用于：上网行为管理、网络监控审计、零信任的网络准入、广告过滤等。
>
> 支持http、https，支持https的自动识别、回退。支持对http代理下流量的二次监控过滤。

## 上网行为管理示例

> 代码参考 sample/http_access_control

![](./ac.png)

## 接口说明

### IMonitorAgentEngine

```cpp
interface IMonitorAgentEngine : public IUnknown
{
	virtual bool			Agent				(IMonitorMessage* Message, IMonitorAgentCallback* Callback, bool SSL = false) = 0;
};

HRESULT	 CreateAgentEngine	(ULONG MaxThread, IMonitorAgentEngine** Engine);
```

| 函数              | 说明                                                         |
| ----------------- | ------------------------------------------------------------ |
| CreateAgentEngine | 创建代理引擎，MaxThread表示并发的线程数，默认是1，最大是10。SDK会为每一个线程创建一个独立监听端口。同一个连接的回调都是在单线程触发。 |
| Agent             | 建立代理，只支持SocketConnect、WFPTcpConnect的消息类型，并且需要是Wating状态的。SSL表示是否支持SSL连接。 |

> 代理建立后连接如下：
>
> client（本地客户端，比如浏览器） --> Agent --> remote(远程网络)
>
> 所有的事件通过IMonitorAgentCallback触发。

### IMonitorAgentCallback

```cpp
interface IMonitorAgentCallback
{
	virtual void			OnCreate			(IMonitorAgentChannel* Channel) {}

	virtual void			OnLocalConnect		(IMonitorAgentChannel* Channel) {}
	virtual bool			OnLocalSSLHello		(IMonitorAgentChannel* Channel, const char* ServerName) { return true; }
	virtual void			OnLocalReceive		(IMonitorAgentChannel* Channel, const char* Data, size_t Length) {}
	virtual void			OnLocalError		(IMonitorAgentChannel* Channel, const char* Error) {}
	virtual void			OnLocalDisconnect	(IMonitorAgentChannel* Channel) {}

	virtual bool			OnRemotePreConnect	(IMonitorAgentChannel* Channel) { return true; }
	virtual bool			OnRemoteSSLVerify	(IMonitorAgentChannel* Channel, bool PreVerified) { return PreVerified; }
	virtual void			OnRemoteConnect		(IMonitorAgentChannel* Channel) {}
	virtual void			OnRemoteReceive		(IMonitorAgentChannel* Channel, const char* Data, size_t Length) {}
	virtual void			OnRemoteError		(IMonitorAgentChannel* Channel, const char* Error) {}
	virtual void			OnRemoteDisconnect	(IMonitorAgentChannel* Channel) {}

	virtual void			OnClose				(IMonitorAgentChannel* Channel) {}
};
```

| 函数               | 说明                                                         |
| ------------------ | ------------------------------------------------------------ |
| OnCreate           | 代理创建的时候，这时可以通过SetContext设置上下文             |
| OnLocalConnect     | 本地（浏览器连接到Agent）连接建立成功                        |
| OnLocalSSLHello    | 【https】ssl的握手client_hello，这里可以判断是否继续代理，返回false则不会解析https的内容，直接透传原始数据，可以解决双向认证的代理失败问题等。 |
| OnRemotePreConnect | 开始连接远程服务器，可以这里设置IP、Port修改原始的远程地址，适用于网络代理、准入、零信任等需求 |
| OnRemoteSSLVerify  | 【https】证书校验结果，如果返回true的使用有效证书，返回false则保留无效证书（浏览器会变红） |
| OnRemoteConnect    | 双向连接建立成功，可以开始收发包                             |
| OnClose            | 连接断开，这时可以反初始化，比如释放Context的内容            |

### IMonitorAgentChannel

```cpp
interface IMonitorAgentChannel
{
	struct Address {
		ULONG				IP;
		USHORT				Port;
	};

	virtual ULONG			LocalGetProcessId	(void) = 0;
	virtual Address			LocalGetAddress		(void) = 0;
	virtual void			LocalSetAutoSend	(bool Enable) = 0;
	virtual void			LocalSetAutoReceive	(bool Enable) = 0;
	virtual bool			LocalSend			(const char* Data, size_t Length) = 0;
	virtual void			LocalReceive		(void) = 0;
	virtual void			LocalDisconnect		(void) = 0;

	virtual bool			RemoteSetAddress	(ULONG IP, USHORT Port) = 0;
	virtual Address			RemoteGetAddresss	(void) = 0;
	virtual void			RemoteSetAutoSend	(bool Enable) = 0;
	virtual void			RemoteSetAutoReceive(bool Enable) = 0;
	virtual bool			RemoteSend			(const char* Data, size_t Length) = 0;
	virtual void			RemoteReceive		(void) = 0;
	virtual void			RemoteDisconnect	(void) = 0;

	virtual void			SetContext			(void* Context) = 0;
	virtual void*			GetContext			(void) = 0;
	virtual bool			SSLRestartAgent		(void) = 0;
	virtual bool			SSLIsRestartAgent	(void) = 0;
	virtual bool			SSLIsFallback		(void) = 0;
	virtual void			Close				(void) = 0;
};
```

| 函数                 | 说明                                                         |
| -------------------- | ------------------------------------------------------------ |
| LocalGetProcessId    | 获取本地（浏览器）的进程id                                   |
| LocalGetAddress      | 获取本地（浏览器）的网络地址                                 |
| LocalSetAutoSend     | 是否自动发包（本地收到包后，自动发给远程），默认为true       |
| LocalSetAutoReceive  | 是否自动收包，默认为true，如果设置false，需要自己通过LocalReceive通知收包，不然不会有OnLocalReceive回调 |
| RemoteSetAddress     | 设置修改远程的服务器地址，一般在OnRemotePreConnect里面设置   |
| RemoteGetAddresss    | 参考LocalXxx                                                 |
| RemoteSetAutoSend    | 参考LocalXxx                                                 |
| RemoteSetAutoReceive | 参考LocalXxx                                                 |
| SetContext           | 设置用户自己的额外数据                                       |
| GetContext           | 返回设置的数据                                               |
| SSLRestartAgent      | 重新启动https解析：在设置了代理的情况下，所有流量都会走代理，为了解析出代理里面的内容，可以在代理连接成功后，设置SSLRestartAgent重新发起https代理，这样就可以监控到代理后的内容。（其他任何ssl前有数据包的协议都适用） |
| SSLIsRestartAgent    | 判断当前是否重新解析的                                       |
| SSLIsFallback        | 如果设置了ssl，但是解析后发现不是ssl的，会回退到原始数据包的状态，这里判断是否回退过。 |