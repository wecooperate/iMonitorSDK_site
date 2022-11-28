---
title: 规则引擎
order: 3
---

## 规则引擎

> iMonitorSDK内置基于jsonlogic的规则引擎，可以基于配置快速实现强大的功能。一般用于主动防御、审计管控、EDR等业务。

### 接口说明

```cpp
interface IMonitorRule
{
	virtual	const char*		GetId				(void) = 0;
	virtual const char*		GetName				(void) = 0;
	virtual const char*		GetDescription		(void) = 0;
	virtual const char*		GetGroupName		(void) = 0;
	virtual ULONG			GetAction			(void) = 0;
	virtual const char*		GetActionParam		(void) = 0;
	virtual	ULONG			GetMessageTypeCount	(void) = 0;
	virtual ULONG			GetMessageType		(ULONG Index) = 0;
};

interface IMonitorMessageField
{
	using RuleString = CStringW;
	using RuleNumber = ULONGLONG;

	virtual	bool			GetString			(IMonitorMessage* Object, RuleString& Value) = 0;
	virtual bool			GetNumber			(IMonitorMessage* Object, RuleNumber& Value) = 0;
};

interface IMonitorRuleContext
{
	virtual IMonitorMessageField* GetCustomField(const char* Field) = 0;
};

interface IMonitorMatchCallback
{
	enum emMatchStatus {
		emMatchStatusBreak,
		emMatchStatusContinue,
	};

	virtual void			OnBeginMatch		(IMonitorMessage* Message) {}
	virtual void			OnFinishMatch		(IMonitorMessage* Message) {}
	virtual emMatchStatus	OnMatch				(IMonitorMessage* Message, IMonitorRule* Rule) = 0;
};

interface __declspec(uuid("51237525-2811-4BE2-A6A3-D8889E0D0CA1")) IMonitorRuleEngine : public IUnknown
{
	virtual void			Match				(IMonitorMessage* Message, IMonitorMatchCallback* Callback) = 0;
	virtual void			EnumRule			(void(*Callback)(IMonitorRule* Rule, void* Context), void* Context) = 0;
};
```

| 函数          | 说明                                                         |
| ------------- | ------------------------------------------------------------ |
| Match         | 在IMonitorCallback回调里匹配规则，匹配结果通过IMonitorMatchCallback通知 |
| EnumRule      | 遍历全部规则                                                 |
|               |                                                              |
| OnBeginMatch  | 开始匹配，可以初始化一些状态                                 |
| OnFinishMatch | 匹配结束，可以做反初始化                                     |
| OnMatch       | 匹配到规则，这里可以返回是否继续匹配下一条规则，还是终止匹配 |

### 使用说明

```cpp
class MonitorCallback
	: public IMonitorCallback
	, public IMonitorMatchCallback
{
public:
	void OnCallback(IMonitorMessage* Message) override
	{
		m_RuleEngine->Match(Message, this);
	}

	emMatchStatus OnMatch(IMonitorMessage* Message, IMonitorRule* Rule) override
	{
		if (Rule->GetAction() & emMSGActionBlock) {
			Message->SetBlock();
			printf("match block rule %s.%s\n", Result.GroupName, Result.RuleName);
			return emMatchStatusBreak;
		}

		return emMatchStatusContinue;
	}

public:
	CComPtr<IMonitorRuleEngine> m_RuleEngine;
};
```

### 规则文件说明

> 通过CreateRuleEngine传递规则文件路径创建规则引擎接口，路径格式支持全路径、带通配符的模糊匹配。
>
> 比如： C:\\1.json、C:\\rules\\\*.json

规则文件分为规则组、规则、匹配条件

```json
{
    "name" : "default",
    "description" : "default rule group",
    "rules" : [
		{
			"name" : "block notepad",
			"action" : 1,
			"action_param" : "",
			"event" : ["ProcessCreate", "ProcessOpen"],
			"matcher" : {
				"or" : [
					{"match" : ["Path", "*notepad.exe"]  }
				]
			}
		}
    ]
}
```

#### 规则组

| 字段        | 说明     |
| ----------- | -------- |
| name        | 规则组名 |
| description | 描述     |
| rules       | 规则列表 |

#### 规则

| 字段         | 说明                                                         |
| ------------ | ------------------------------------------------------------ |
| name         | 规则名                                                       |
| action       | 匹配后的动作，在OnMatch里面使用，可以根据emMSGActionBlock来拦截操作，也可以自定义类型做其他业务相关的操作 |
| action_param | 匹配后的动作参数，在OnMatch里面使用                          |
| event        | 数组或者字符串，表示当前规则针对哪些消息类型有效             |
| matcher      | 匹配条件                                                     |

#### 规则匹配条件

> 匹配条件的格式统一为  { operator:  [field, value] } 的格式
>
> 比如 { "==" { "CurrentProcessName", "cmd.exe"}} 表示 CurrentProcessName == "cmd.exe"
>
> operator表示匹配类型，见下面列表。
>
> field表示匹配的字段，详细参考协议字段。
>
> value表示匹配的值，具体类型参考operator

| operator   | value类型 | 说明                                                         |
| ---------- | --------- | ------------------------------------------------------------ |
| or         | array     | 表示数组下任意规则匹配                                       |
| and        | array     | 表示数组下全部规则匹配                                       |
| bool       | bool      | 直接返回value的值                                            |
|            |           |                                                              |
| equal      | string    | 字符串相等                                                   |
| !equal     | string    | 字符串不相等                                                 |
| match      | string    | 表示通配符的字符串匹配                                       |
| !match     | string    | match的相反                                                  |
| include    | string    | 包含                                                         |
| !include   | string    | 不包含                                                       |
| regex      | string    | 正则匹配                                                     |
| !regex     | string    | 正则匹配失败                                                 |
|            |           |                                                              |
| 注意！！！ |           | 上面字符串默认都是不区分大小写，如果需要区分大小写则使用大写的方式，比如： |
|            |           | EQUAL 表示字符串相等，并且大小写敏感                         |
|            |           |                                                              |
| ==         | number    | 等于                                                         |
| !=         | number    | 不等于                                                       |
| >          | number    | 大于                                                         |
| <          | number    | 小于                                                         |
| >=         | number    | 大于等于                                                     |
| <=         | number    | 小于等于                                                     |
| &          | number    | 包含                                                         |
| !&         | number    | 不包含                                                       |

### 匹配扩展字段

除了基本的字段，规则引擎内部也内置了一些常见的扩展

| 字段                    | 含义                                                         |
| ----------------------- | ------------------------------------------------------------ |
| AccessModifiable        | 表示CreateFile、OpenProcess等存在Access的操作，是否具备写、删除等权限 |
| Address                 | 网络操作时的地址远程地址，比如：127.0.0.1:8080               |
|                         |                                                              |
| Path.Ext                | 文件后缀名： .dll                                            |
| Path.FileName           | 文件名                                                       |
|                         |                                                              |
| Process.ProcessPath     | 进程路径                                                     |
| Process.ProcessName     | 进程名称                                                     |
| Process.Commandline     | 进程命令行                                                   |
| Process.CompanyName     | 进程文件对应的公司名称                                       |
| Process.ProductName     | 进程文件对应的产品名                                         |
| Process.FileDescription | 进程文件对应的描述信息                                       |
|                         |                                                              |
| CurrentProcess.Xxxx     | Xxxx同Process的字段，表现操作进程的字段                      |

#### 开发扩展字段

```C++
interface IMonitorRuleContext
{
	virtual IMonitorMessageField* GetCustomField(const char* Field) = 0;
};
```

可以通过Context返回对应的接口提供
