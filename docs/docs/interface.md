---
title: 接口说明
order: 1
---

## 头文件说明

-   iMonitor.h 驱动、应用层共用的定义
-   iMonitorSDK.h SDK接口定义
-   iMonitorProtocol.h idl自动生成的协议辅助类
-   iMonitorSDKExtesnion.h 基于SDK在应用层实现的扩展功能

## 接口说明

### IMonitorManager

>   SDK的使用接口

```cpp
interface IMonitorManager : public IUnknown
{
	virtual HRESULT			Start				(IMonitorCallbackInternal* Callback) = 0;
	virtual HRESULT			Start				(IMonitorCallback* Callback) = 0;
	virtual HRESULT			Control				(PVOID Data, ULONG Length, PVOID OutData, ULONG OutLength, PULONG ReturnLength) = 0;
	virtual HRESULT			Stop				(void) = 0;
    virtual HRESULT         UnloadDriver        (void) = 0
	
	virtual	HRESULT			CreateRuleEngine	(LPCWSTR Path, IMonitorRuleEngine** Engine) = 0;
	virtual	HRESULT			CreateAgentEngine	(ULONG MaxThread, IMonitorAgentEngine** Engine) = 0;
};
```

| 函数              | 说明                                                         |
| ----------------- | ------------------------------------------------------------ |
| Start             | 设置驱动回调、安装并启动驱动                                 |
| Control           | 跟驱动通讯的入口，详细参考cxMSGUserXxxx结构体                |
| CreateRuleEngine  | 应用层扩展功能： 加载基于jsonlogic的规则引擎，详细参考[规则引擎](/docs/rule)部分 |
| CreateAgentEngine | 应用层扩展功能：创建网络中间人服务器，详细参考[网络代理](/docs/agent)部分 |
| UnloadDriver      | 停止并卸载驱动                                               |

#### 支持的Control参数类型

| 类型                          | 说明                                           |
| ----------------------------- | ---------------------------------------------- |
| cxMSGUserSetGlobalConfig      | 设置全局配置                                   |
| cxMSGUserGetGlobalConfig      | 获取全局配置                                   |
| cxMSGUserSetSessionConfig     | 设置当前会话配置                               |
| cxMSGUserGetSessionConfig     | 获取当前配置会话                               |
| **cxMSGUserSetMSGConfig**     | 设置监控消息配置，开启监控都通过这个命令字设置 |
| cxMSGUserGetMSGConfig         | 获取监控消息配置                               |
| cxMSGUserEnableProtect        | 开启自保护                                     |
| cxMSGUserDisableProtect       | 关闭自保护                                     |
| cxMSGUserAddProtectRule       | 添加保护规则                                   |
| cxMSGUserRemoveProtectRule    | 删除保护规则                                   |
| cxMSGUserRemoveAllProtectRule | 清空保护规则                                   |

### IMonitorCallback

> 事件回调接口，监控到的事件都通过OnCallback通知到应用层，在回调里面可以通过IMonitorMessage获取事件的详细信息，也可以设置需要响应的结果。

```cpp
interface IMonitorCallback
{
	virtual void			OnCallback			(IMonitorMessage* Message) = 0;
};
```

### IMonitorCallbackInternal

>   内部使用的接口，参数是为解析前的原始参数，只供内部使用，没特殊原因，不需要设置这类型的回调

```cpp
interface IMonitorCallbackInternal
{
	virtual void			OnCallback			(cxMSGHeader* Header, cxMSGAction* Action) = 0;
};
```

### IMonitorMessage

>   驱动事件消息，包括公共字段（当前进程信息等）、私有字段（具体参考附录的协议字段）

```cpp
interface IMonitorMessage
{
    struct Binary {
        PVOID Data;
        ULONG Length;
    };

    virtual cxMSGHeader*    GetHeader           (void) = 0;
    inline  ULONG           GetType             (void) { return GetHeader()->Type; }
    inline  ULONG           GetStatus           (void) { return GetHeader()->Status; }
    inline  ULONG           GetCurrentProcessId (void) { return GetHeader()->CurrentProcessId; }
    inline  ULONG           GetCurrentThreadId  (void) { return GetHeader()->CurrentThreadId; }

    virtual LPCWSTR         GetTypeName         (void) = 0;
    virtual ULONG           GetFieldCount       (void) = 0;
    virtual emMSGDataType   GetFieldType        (ULONG Index) = 0;
    virtual LPCWSTR         GetFieldName        (ULONG Index) = 0;
    virtual ULONG           GetFieldIndex       (LPCWSTR Name) = 0;

    virtual ULONG           GetULONG            (ULONG Index) = 0;
    virtual ULONGLONG       GetULONGLONG        (ULONG Index) = 0;
    virtual LPCWSTR         GetString           (ULONG Index) = 0;
    virtual LPCWSTR         GetFormatedString   (ULONG Index) = 0;
    virtual Binary          GetBinary           (ULONG Index) = 0;

    virtual bool            IsMatch             (ULONG Index, LPCWSTR Pattern, bool IgnoreCase = true) = 0;

    virtual bool            IsWaiting           (void) = 0;
    virtual bool            SetAction           (const cxMSGAction& Action) = 0;
    virtual bool            SetBlock            (void) = 0;
    virtual bool            SetGrantedAccess    (ULONG Access) = 0;
    virtual bool            SetIPRedirect       (ULONG IP, USHORT Port, ULONG ProcessId = ::GetCurrentProcessId()) = 0;
   	virtual bool			SetTerminateProcess	(void) = 0;
	virtual bool			SetTerminateThread	(void) = 0;
    virtual bool            SetInjectDll        (LPCWSTR Path) = 0;
    virtual bool            SetFileRedirect     (LPCWSTR Path) = 0;
};
```

| 函数                | 说明                                                         |
| ------------------- | ------------------------------------------------------------ |
| GetType             | 消息类型，比如 emMSGProcessCreate                            |
| GetTypeName         | 消息类型的字符串，比如 ProcessCreate                         |
| GetFieldCount       | 当前消息字段的格式，每个字段可以通过GetFieldXxx、GetXxx获取属性和值 |
| GetStatus           | Post请求有效：当前操作的执行结果                             |
| GetString           | 要求字段必须是字符串，如果对应的字段不是字符串，则返回空字符串 |
| GetFormatedString   | 同GetString，区别在于：不是字符串的内容会强制转换成字符串    |
| IsWaiting           | 驱动是否阻塞事件执行，如果是可以通过SetXxx来响应事件（阻止、重定向等） |
| SetBlock            | 阻止当前的操作                                               |
| SetGrantedAccess    | 对于打开进程、打开线程操作，可以设置允许的打开权限           |
| SetTerminateProcess | 结束当前进程                                                 |
| SetTerminateThread  | 结束当前线程                                                 |
| SetInjectDll        | 对当前进程注入动态库（自己判断是32位的还是64位进程）         |
| SetIPRedirect       | 对于Tcp连接，可以设置IP、Port重定向到新的地址                |
| IsMatch             | 内置通配符字符串匹配，支持 * ？ >  （> 表示目录，dir>  等同于 dir + dir\\\\*） IgnoreCase表示是否忽略大小写，默认忽略 |

### iMonitorSDKExtesnion

在应用层实现的能力扩展，详细参考[规则引擎](/docs/rule)、[网络代理](/docs/agent)。
