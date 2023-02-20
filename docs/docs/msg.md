---
title: 消息类型
order: 100
---

### 消息封装

为了方便从IMonitorMessage里面获取需要的字段，SDK同时提供对每个消息的封装，比如进程创建消息：

```C++
class cxMSGProcessCreate : public MonitorMessage
{
public:
	enum {
		emMSGFieldCallstack,
		emMSGFieldCurrentProcessCreateTime,
		emMSGFieldCurrentProcessName,
		emMSGFieldCurrentProcessPath,
		emMSGFieldCurrentProcessCommandline,
		emMSGFieldPath,
		emMSGFieldProcessId,
		emMSGFieldCommandline,
		emMSGFieldCreateTime,
		emMSGFieldParentPath,
		emMSGFieldParentProcessId,
		emMSGFieldParentCommandline,
		emMSGFieldParentCreateTime,
	};

public:
	auto Path() { return GetPath(emMSGFieldPath); }
	auto ProcessId() { return GetULONG(emMSGFieldProcessId); }
	auto Commandline() { return GetString(emMSGFieldCommandline); }
	auto CreateTime() { return GetTime(emMSGFieldCreateTime); }
	auto ParentPath() { return GetPath(emMSGFieldParentPath); }
	auto ParentProcessId() { return GetULONG(emMSGFieldParentProcessId); }
	auto ParentCommandline() { return GetString(emMSGFieldParentCommandline); }
	auto ParentCreateTime() { return GetTime(emMSGFieldParentCreateTime); }

	bool IsMatchPath(LPCWSTR Pattern, bool IgnoreCase = true) { return IsMatch(emMSGFieldPath, Pattern, IgnoreCase); }
	bool IsMatchCommandline(LPCWSTR Pattern, bool IgnoreCase = true) { return IsMatch(emMSGFieldCommandline, Pattern, IgnoreCase); }
	bool IsMatchParentPath(LPCWSTR Pattern, bool IgnoreCase = true) { return IsMatch(emMSGFieldParentPath, Pattern, IgnoreCase); }
	bool IsMatchParentCommandline(LPCWSTR Pattern, bool IgnoreCase = true) { return IsMatch(emMSGFieldParentCommandline, Pattern, IgnoreCase); }
};
```

使用的时候，直接强制转换就可以了

```
if (Message->GetType() == emMSGProcessCreate) {
	auto msg = (cxMSGProcessCreate*)Message;
	msg->Path();
}
```

### 全部消息

全部的消息和对应消息的各个字段

```idl
//进程创建：可以用于拦截进程的启动
struct ProcessCreate {
	Path                 : Path;
	ProcessId            : ULONG;
	Commandline          : String;
	CreateTime           : Time;
	ParentPath           : Path;
	ParentProcessId      : ULONG;
	ParentCommandline    : String;
	ParentCreateTime     : Time;
}

//进程退出：比如缓存了进程列表，可以根据这个事件清理进程
struct ProcessExit {
	Path                 : Path;
	ProcessId            : ULONG;
}

//打开进程：可以用于做进程保护
struct ProcessOpen {
	Path                 : Path;
	ProcessId            : ULONG;
	ParentProcessId      : ULONG;
	DesiredAccess        : ProcessAccess;
	Duplicate            : Bool;
}

//线程创建：可以拦截远程线程注入
struct ThreadCreate {
	Path                 : Path;
	ProcessId            : ULONG;
	ThreadId             : ULONG;
	StartAddress         : ULONGLONG;
	RemoteThread         : Bool;
}

//线程退出
struct ThreadExit {
	Path                 : Path;
	ProcessId            : ULONG;
	ThreadId             : ULONG;
}

//打开线程
struct ThreadOpen {
	Path                 : Path;
	ProcessId            : ULONG;
	ParentProcessId      : ULONG;
	DesiredAccess        : ThreadAccess;
	Duplicate            : Bool;
	ThreadId             : ULONG;
}

//加载动态库、或者加载驱动
struct ImageLoad {
	Path                 : Path;
	ProcessId            : ULONG;
	ImageBase            : ULONGLONG;
	ImageSize            : ULONGLONG;
	IsKernelImage        : Bool;
}

//打开、创建文件，具体参数参考CreateFile
struct FileCreate {
	Path                 : Path;
	Attributes           : FileAttributes;
	Access               : FileAccess;
	ShareAccess          : FileShareAccess;
	CreateDisposition    : FileDisposition;
	CreateOptions        : FileOptions;
}

//FileCreate的完成事件，后续到Post的是类似，不再添加说明
struct FilePostCreate {
	Path                 : Path;
	Attributes           : FileAttributes;
	Access               : FileAccess;
	ShareAccess          : FileShareAccess;
	CreateDisposition    : FileDisposition;
	CreateOptions        : FileOptions;
	Information          : ULONG;
}

//只读打开文件
struct FileQueryOpen {
	Path                 : Path;
}

struct FilePostQueryOpen {
	Path                 : Path;
	CreationTime         : Time;
	LastAccessTime       : Time;
	LastWriteTime        : Time;
	ChangeTime           : Time;
	FileSize             : ULONGLONG;
	FileAttributes       : FileAttributes;
}

//文件关闭：可以用于文件落地杀毒
struct FileCleanup {
	Path                 : Path;
	Information          : ULONG;
}

//创建文件映射：加载模块的时候会用到，也可以用于拦截模块加载
struct FileCreateSection {
	Path                 : Path;
	PageProtection       : FilePageProtection;
}

struct FilePostCreateSection {
	Path                 : Path;
	PageProtection       : FilePageProtection;
}

//读取文件
struct FileRead {
	Path                 : Path;
	ReadLength           : ULONG;
	Offset               : ULONGLONG;
	Buffer               : ULONGLONG;
}

struct FilePostRead {
	Path                 : Path;
	ReadLength           : ULONG;
	Offset               : ULONGLONG;
	Buffer               : ULONGLONG;
	ReturnLength         : ULONG;
}

//写文件
struct FileWrite {
	Path                 : Path;
	WriteLength          : ULONG;
	Offset               : ULONGLONG;
	Buffer               : ULONGLONG;
	Data                 : Binary;
}

struct FilePostWrite {
	Path                 : Path;
	WriteLength          : ULONG;
	Offset               : ULONGLONG;
	Buffer               : ULONGLONG;
	Data                 : Binary;
	ReturnLength         : ULONG;
}

//创建文件硬链接
struct FileCreateHardLink {
	Path                 : Path;
	LinkPath             : Path;
	ReplaceIfExists      : Bool;
}

struct FilePostCreateHardLink {
	Path                 : Path;
	LinkPath             : Path;
	ReplaceIfExists      : Bool;
}

//重命名文件
struct FileRename {
	Path                 : Path;
	NewPath              : Path;
	ReplaceIfExists      : Bool;
}

struct FilePostRename {
	Path                 : Path;
	NewPath              : Path;
	ReplaceIfExists      : Bool;
}

//删除文件
struct FileDelete {
	Path                 : Path;
}

struct FilePostDelete {
	Path                 : Path;
}

//修改文件大小
struct FileSetSize {
	Path                 : Path;
	Size                 : ULONGLONG;
	SizeType             : ULONG;
}

struct FilePostSetSize {
	Path                 : Path;
	Size                 : ULONGLONG;
	SizeType             : ULONG;
}

//修改文件信息
struct FileSetBasicInfo {
	Path                 : Path;
	CreationTime         : Time;
	LastAccessTime       : Time;
	LastWriteTime        : Time;
	ChangeTime           : Time;
	FileAttributes       : FileAttributes;
}

struct FilePostSetBasicInfo {
	Path                 : Path;
	CreationTime         : Time;
	LastAccessTime       : Time;
	LastWriteTime        : Time;
	ChangeTime           : Time;
	FileAttributes       : FileAttributes;
}

//查找文件：可以用于文件隐藏
struct FileFindFile {
	Path                 : Path;
	FindName             : Path;
	RestartScan          : Bool;
}

struct FilePostFindFile {
	Path                 : Path;
	FindName             : Path;
	RestartScan          : Bool;
	FileName             : Path;
	CreationTime         : Time;
	LastAccessTime       : Time;
	LastWriteTime        : Time;
	ChangeTime           : Time;
	FileSize             : ULONGLONG;
	FileAttributes       : FileAttributes;
}

//创建、打开注册表键
struct RegCreateKey {
	Path                 : Path;
	Options              : RegOptions;
	DesiredAccess        : RegAccess;
}

struct RegPostCreateKey {
	Path                 : Path;
	Options              : RegOptions;
	DesiredAccess        : RegAccess;
	Disposition          : ULONG;
}

//打开注册表键
struct RegOpenKey {
	Path                 : Path;
	Options              : RegOptions;
	DesiredAccess        : RegAccess;
}

struct RegPostOpenKey {
	Path                 : Path;
	Options              : RegOptions;
	DesiredAccess        : RegAccess;
}

//删除注册表键
struct RegDeleteKey {
	Path                 : Path;
}

struct RegPostDeleteKey {
	Path                 : Path;
}

//重命名注册表键
struct RegRenameKey {
	Path                 : Path;
	NewName              : String;
}

struct RegPostRenameKey {
	Path                 : Path;
	NewName              : String;
}

//枚举注册表键
struct RegEnumKey {
	Path                 : Path;
	Index                : ULONG;
	InformationClass     : ULONG;
	InformationLength    : ULONG;
}

struct RegPostEnumKey {
	Path                 : Path;
	Index                : ULONG;
	InformationClass     : ULONG;
	InformationLength    : ULONG;
	ResultLength         : ULONG;
	Information          : Binary;
}

//加载注册表文件
struct RegLoadKey {
	Path                 : Path;
	FilePath             : String;
}

struct RegPostLoadKey {
	Path                 : Path;
	FilePath             : String;
}

//替换注册表键
struct RegReplaceKey {
	Path                 : Path;
	OldFilePath          : String;
	NewFilePath          : String;
}

struct RegPostReplaceKey {
	Path                 : Path;
	OldFilePath          : String;
	NewFilePath          : String;
}

//删除注册表值
struct RegDeleteValue {
	Path                 : Path;
	ValueName            : String;
}

struct RegPostDeleteValue {
	Path                 : Path;
	ValueName            : String;
}

//设置注册表值
struct RegSetValue {
	Path                 : Path;
	ValueName            : String;
	DataType             : RegType;
	Data                 : Binary;
}

struct RegPostSetValue {
	Path                 : Path;
	ValueName            : String;
	DataType             : RegType;
	Data                 : Binary;
}

//查询注册表值
struct RegQueryValue {
	Path                 : Path;
	ValueName            : String;
}

struct RegPostQueryValue {
	Path                 : Path;
	ValueName            : String;
}

//创建网络套接字
struct SocketCreate {
	SocketObject         : ULONGLONG;
}

//网络套接字层驱动通信
struct SocketControl {
	SocketObject         : ULONGLONG;
	Code                 : ULONG;
	InputLength          : ULONG;
	OutputLength         : ULONG;
	InputData            : Binary;
}

struct SocketPostControl {
	SocketObject         : ULONGLONG;
	Code                 : ULONG;
	InputLength          : ULONG;
	OutputLength         : ULONG;
	InputData            : Binary;
	OutputData           : Binary;
}

////网络套接字连接远程服务器：可以用于拦截网络
struct SocketConnect {
	SocketObject         : ULONGLONG;
	IP                   : SocketIP;
	Port                 : SocketPort;
	LocalIP              : SocketIP;
	LocalPort            : SocketPort;
	SuperConnect         : Bool;
}

struct SocketPostConnect {
	SocketObject         : ULONGLONG;
	IP                   : SocketIP;
	Port                 : SocketPort;
	LocalIP              : SocketIP;
	LocalPort            : SocketPort;
	SuperConnect         : Bool;
}

//网络套接字发送数据包
struct SocketSend {
	SocketObject         : ULONGLONG;
	IP                   : SocketIP;
	Port                 : SocketPort;
	LocalIP              : SocketIP;
	LocalPort            : SocketPort;
	DataLength           : ULONG;
	Data                 : Binary;
}

//网络套接字接受数据
struct SocketRecv {
	SocketObject         : ULONGLONG;
	IP                   : SocketIP;
	Port                 : SocketPort;
	LocalIP              : SocketIP;
	LocalPort            : SocketPort;
}

struct SocketPostRecv {
	SocketObject         : ULONGLONG;
	IP                   : SocketIP;
	Port                 : SocketPort;
	LocalIP              : SocketIP;
	LocalPort            : SocketPort;
	DataLength           : ULONG;
	Data                 : Binary;
}

//网络套接字发送数据UDP
struct SocketSendTo {
	SocketObject         : ULONGLONG;
	IP                   : SocketIP;
	Port                 : SocketPort;
	LocalIP              : SocketIP;
	LocalPort            : SocketPort;
	DataLength           : ULONG;
	Data                 : Binary;
}

//网络套接字接受数据UDP：可以用于分析DNS协议等
struct SocketRecvFrom {
	SocketObject         : ULONGLONG;
	IP                   : SocketIP;
	Port                 : SocketPort;
	LocalIP              : SocketIP;
	LocalPort            : SocketPort;
}

struct SocketPostRecvFrom {
	SocketObject         : ULONGLONG;
	IP                   : SocketIP;
	Port                 : SocketPort;
	LocalIP              : SocketIP;
	LocalPort            : SocketPort;
	DataLength           : ULONG;
	Data                 : Binary;
}

//网络套接字监听本地端口
struct SocketListen {
	SocketObject         : ULONGLONG;
	IP                   : SocketIP;
	Port                 : SocketPort;
}

struct SocketPostListen {
	SocketObject         : ULONGLONG;
	IP                   : SocketIP;
	Port                 : SocketPort;
}

//网络套接字接受远程连接
struct SocketAccept {
	SocketObject         : ULONGLONG;
	IP                   : SocketIP;
	Port                 : SocketPort;
	LocalIP              : SocketIP;
	LocalPort            : SocketPort;
}

struct SocketPostAccept {
	SocketObject         : ULONGLONG;
	IP                   : SocketIP;
	Port                 : SocketPort;
	LocalIP              : SocketIP;
	LocalPort            : SocketPort;
}

// WFP网络框架：建立TCP连接，可以用于拦截网络、做网络重定向
struct WFPTcpConnect {
	IP                   : SocketIP;
	Port                 : SocketPort;
	LocalIP              : SocketIP;
	LocalPort            : SocketPort;
}

// WFP网络框架：建立UDP连接，可以用于拦截网络、做网络重定向
struct WFPUdpConnect {
	IP                   : SocketIP;
	Port                 : SocketPort;
	LocalIP              : SocketIP;
	LocalPort            : SocketPort;
}

// WFP网络框架：建立ICMP连接，可以用于拦截Ping
struct WFPICMPConnect {
	IP                   : SocketIP;
	Port                 : SocketPort;
	LocalIP              : SocketIP;
	LocalPort            : SocketPort;
}

// WFP网络框架：接受远程TCP连接，可以用于做端口防火墙
struct WFPTcpAccept {
	IP                   : SocketIP;
	Port                 : SocketPort;
	LocalIP              : SocketIP;
	LocalPort            : SocketPort;
}

// WFP网络框架：接受远程UDP连接，可以用于做端口防火墙
struct WFPUdpAccept {
	IP                   : SocketIP;
	Port                 : SocketPort;
	LocalIP              : SocketIP;
	LocalPort            : SocketPort;
}

// WFP网络框架：接受远程ICMP包，可以用于关闭Ping功能
struct WFPICMPAccept {
	IP                   : SocketIP;
	Port                 : SocketPort;
	LocalIP              : SocketIP;
	LocalPort            : SocketPort;
}

// 基于中间人挟持实现HTTP请求监控
struct HTTPRequest {
	Path                 : String;
	IP                   : SocketIP;
	Port                 : SocketPort;
	Method               : String;
	Host                 : String;
	Uri                  : String;
	Url                  : String;
	Header               : String;
	Data                 : Binary;
	Status               : ULONG;
	ResponseHeader       : String;
	ResponseData         : Binary;
}

```

