---
title: iMonitor插件开发指南（C++篇）
group:
  title: 技术文章
---

# iMonitor插件开发指南（C++篇）

## 简介

iMonitor（冰镜 - 终端行为分析系统）是一款基于iMonitorSDK的终端行为监控分析软件。

提供了对进程、文件、注册表、网络等系统行为的监控。支持扩展和脚本，可以轻易定制和添加更多功能。可以用于病毒分析、软件逆向、入侵检测，EDR等。

## iMonitor核心概念介绍

### IMessage

表示一个事件，通过IMessage可以获取该事件的各个基本字段的内容。

```C++
interface IMessage
{
	virtual ULONG			GetType				(void) = 0;
	virtual ULONG			GetIndex			(void) = 0;
	virtual ULONG			GetSeqId			(void) = 0;
	virtual ULONG			GetStatus			(void) = 0;
	virtual ULONG			GetCurrentProcessId	(void) = 0;
	virtual ULONG			GetCurrentThreadId	(void) = 0;
	virtual ULONGLONG		GetTime				(void) = 0;

	virtual String			GetTypeName			(void) = 0;
	virtual ULONG			GetFieldCount		(void) = 0;
	virtual DataType		GetFieldType		(ULONG Index) = 0;
	virtual String			GetFieldName		(ULONG Index) = 0;
	virtual ULONG			GetFieldIndex		(ConstString Name) = 0;

	virtual ULONG			GetULONG			(ULONG Index) = 0;
	virtual ULONGLONG		GetULONGLONG		(ULONG Index) = 0;
	virtual String			GetString			(ULONG Index) = 0;
	virtual Binary			GetBinary			(ULONG Index) = 0;

	virtual IMessageProcess* GetProcess			(void) = 0;
	virtual IMessageCallstack* GetCallstack		(void) = 0;

	inline ULONG			GetGroupType		(void)							{ return MSG_GET_GROUP(GetType()); }
	inline String			GetPath				(void)							{ return GetString(emMSGFieldPath); }
};
```

### IMessageColumn

表示事件的一个可以显示的列，通过注册一个新的列，可以自定义需要显示的内容。

```c++
interface IMessageColumn
{
	virtual String			GetName				(void) = 0;
	virtual String			GetDescription		(void) = 0;
	virtual ULONG			GetWidth			(void)							{ return 100; }
	virtual ULONG			GetAlign			(void)							{ return emAlignDefault; }
	virtual ULONG			GetMessageType		(void)							{ return 0; }

	virtual DataType		GetDataType			(IMessage* Message) = 0;
	virtual ULONG			GetULONG			(IMessage* Message) = 0;
	virtual ULONGLONG		GetULONGLONG		(IMessage* Message) = 0;
	virtual String			GetString			(IMessage* Message) = 0;
	virtual Binary			GetBinary			(IMessage* Message) = 0;

	virtual	Color			GetBackgroundColor	(IMessage* Message)				{ return IMONITOR_DEFAULT_COLOR; }
	virtual Color			GetTextColor		(IMessage* Message)				{ return IMONITOR_DEFAULT_COLOR; }
	virtual String			GetToolTips			(IMessage* Message)				{ return String(); }
	virtual Icon			GetIcon				(IMessage* Message)				{ return Icon(); }
};
```

### IMessageMatcher

自定义的匹配器，在简单的规则无法满足过滤需求的时候，可以通过注册自定义的匹配器来实现复杂条件的过滤。

```c++
interface IMessageMatcher
{
	virtual String			GetName				(void) = 0;
	virtual String			GetDescription		(void) = 0;

	virtual bool			IsMatch				(IMessage* Message) = 0;
};
```

## iMonitor插件开发

iMonitor提供简单的方式方便使用者可以自己开发插件来扩展能力，从而可以满足不同的使用需要。

其中核心的能力是添加新的显示列、添加自定义的匹配规则。同时也支持添加右键菜单、其他界面交互等（需要引入Qt的依赖）。

对于高级开发者，还支持推送其他监控到的消息，然后通过iMonitor来显示。

### 插件接口说明

开发者只要实现IPlugin接口，就可以完成插件开发。

```C++
struct PluginContext
{
	IMessageColumnManager*	ColumnManager		= nullptr;
	IMessageFilterManager*	FilterManager		= nullptr;
	IMessageProcessManager*	ProcessManager		= nullptr;
	IMessageSymbolManager*	SymbolManager		= nullptr;
	IConfigManager*			ConfigManager		= nullptr;
	IResourceManager*		ResourceManager		= nullptr;
	IPluginManager*			PluginManager		= nullptr;

	IUIManager*				UIManager			= nullptr;
};

interface IPlugin
{
	enum emPluginEvent {
		emEventLanguageChange = 1,
	};

	typedef LANGID EventContextLanguageChange;

	virtual String			GetName				(void) = 0;
	virtual	String			GetDescription		(void) = 0;
	virtual String			GetAuthor			(void) = 0;

	virtual void			Initialize			(PluginContext* Context) = 0;
	virtual void			Release				(void) = 0;

	virtual void			OnEvent				(emPluginEvent Event, PVOID Context)	{}
	virtual IConfigurable*	GetConfigurable		(void)							{ return nullptr; }

	virtual ULONG			GetColumnCount		(void)							{ return 0; }
	virtual IMessageColumn*	GetColumn			(ULONG Index)					{ return nullptr; }
	virtual ULONG			GetMatcherCount		(void)							{ return 0; }
	virtual IMessageMatcher* GetMatcher			(ULONG Index)					{ return nullptr; }
	virtual ULONG			GetRequireEventCount(void)							{ return 0; }
	virtual ULONG			GetRequireEvent		(ULONG Index)					{ return 0; }

	virtual IUIExtension*	GetUIExtension		(void)							{ return nullptr; }
};
```

接口说明

| 函数                 | 说明                                                         |
| -------------------- | :----------------------------------------------------------- |
| Initialize           | 插件的初始化，可以获取并保存PluginContext，用于后续获取各种能力 |
| OnEvent              | 事件通知：目前只有一个语言切换的事件，后续根据需要会添加更多的事件通知。 |
| GetColumnCount       | 提供扩展列的个数                                             |
| GetColumn            | 获取提供扩展列的接口                                         |
| GetMatcherCount      | 提供自定义匹配规则的个数                                     |
| GetMatcher           | 获取提供自定义匹配规则的接口                                 |
| GetRequireEventCount | 需要订阅的事件个数（为了优化性能，按需订阅）                 |
| GetRequireEvent      | 获取需要订阅的事件                                           |
| GetUIExtension       | 获取提供UI扩展接口                                           |

### 插件示例一（添加IP地址归属地信息）

```C++
cxMessageColumnRemoteIPRegion::cxMessageColumnRemoteIPRegion(void)
	: cxMessageColumnBase(_T("RemoteIPRegion"), _T("Parse socket remote ip address region"), 200)
{
}

String cxMessageColumnRemoteIPRegion::GetString(IMessage* Message)
{
	switch (Message->GetType()) {
	case emMSGSocketPostConnect:
	case emMSGSocketSend:
	case emMSGSocketSendTo:
	case emMSGSocketPostRecv:
	case emMSGSocketPostRecvFrom:
	case emMSGSocketPostAccept:
		return g_IPRegion->GetIPRegion(Message->GetULONG(proto::SocketSend::emFieldIP));

	case emMSGHTTPRequest:
		return g_IPRegion->GetIPRegion(Message->GetULONG(proto::HTTPRequest::emFieldIP));

	default:
		break;
	}

	return String();
}
```

### 插件示例二（添加判断是否文档路径的匹配器）

```c++
bool cxMessageFileInfoDocumentMatcher::IsMatch(IMessage* Message)
{
	auto path = Message->GetPath();
	CString ext = PathFindExtension(path);
	ext.MakeLower();

	static LPCTSTR document_exts[] = {
		_T(".txt"),
		_T(".doc"),
		_T(".docx"),
		_T(".ppt"),
		_T(".pptx"),
		_T(".xls"),
		_T(".xlsx"),
		_T(".json"),
		_T(".xml"),
		_T(".db"),
	};

	for (auto& it : document_exts) {
		if (ext == it)
			return true;
	}

	return false;
}
```

### 插件示例三（添加右键菜单）

```C++
void UIExtension::OnMessageMenu(QMenu* Menu, IMessage* Message, IMessageColumn* Column)
{
	if (!Message)
		return;

	Menu->addSeparator();

	Menu->addAction(tr("New PathInfo Rule"), [Message]() {
		UIPathInfoEditView::Show(QStringFrom(Message->GetPath()));
	});
}
```

上面示例的全部代码可以通过 https://github.com/wecooperate/iMonitor/tree/main/src/plugins 获取。

## iMonitor脚本支持

用C++开发插件成本会比较大，使用JavaScript来扩展会更加方便，功能正在内测中，后续上线后会添加完整的使用说明。

```typescript
使用TypeScript来添加一个列的使用效果：

@MessageColumn("TestScript")
class TestColumn implements IMessageColumn {
    GetString(msg: IMessage): string {
        if (msg.Type == MessageType.ProcessCreate) {
            let msgProcessCreate = msg as Message.ProcessCreate;
            return msgProcessCreate.Commandline;
        }

        return msg.Process.Commandline;
    }
}
```

