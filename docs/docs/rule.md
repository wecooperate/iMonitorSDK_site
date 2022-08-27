---
title: 规则引擎
order: 3
---

## 规则引擎

> iMonitorSDK内置基于jsonlogic的规则引擎，可以基于配置快速实现强大的功能。一般用于主动防御、审计管控、EDR等业务。

### 接口说明

```cpp
interface IMonitorRuleCallback
{
	enum emMatchStatus {
		emMatchStatusBreak,
		emMatchStatusContinue,
	};

	struct MatchResult {
		ULONG				Action;
		const char*			ActionParam;
		const char*			GroupName;
		const char*			RuleName;
	};

	virtual void			OnBeginMatch		(IMonitorMessage* Message) {}
	virtual void			OnFinishMatch		(IMonitorMessage* Message) {}
	virtual emMatchStatus	OnMatch				(IMonitorMessage* Message, const MatchResult& Result) = 0;
};

interface IMonitorRuleEngine : public IUnknown
{
	virtual void			Match				(IMonitorMessage* Message, IMonitorRuleCallback* Callback) = 0;
    virtual void			EnumAffectedMessage	(void(*Callback)(ULONG Type, void* Context), void* Context) = 0;
};
```

| 函数                | 说明                                                         |
| ------------------- | ------------------------------------------------------------ |
| Match               | 在IMonitorCallback回调里匹配规则，匹配结果通过IMonitorRuleCallback通知 |
| EnumAffectedMessage | 查询当前规则影响了哪些事件，方便设置需要监控的事件           |
|                     |                                                              |
| OnBeginMatch        | 开始匹配，可以初始化一些状态                                 |
| OnFinishMatch       | 匹配结束，可以做反初始化                                     |
| OnMatch             | 匹配到规则，这里可以返回是否继续匹配下一条规则，还是终止匹配 |

### 使用说明

```cpp
class MonitorCallback
	: public IMonitorCallback
	, public IMonitorRuleCallback
{
public:
	void OnCallback(IMonitorMessage* Message) override
	{
		m_RuleEngine->Match(Message, this);
	}

	emMatchStatus OnMatch(IMonitorMessage* Message, const MatchResult& Result) override
	{
		if (Result.Action & emMSGActionBlock) {
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
| event        | 数组或者字符串，表示当前规则针对哪些消息类型有效；如果是字符串并且是 * 表示全部的事件 |
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

| operator | value类型 | 说明                                           |
| -------- | --------- | ---------------------------------------------- |
| child    | struct    | 子节点匹配，支持 CurrentProcess、Process、File |
| or       | array     | 表示数组下任意规则匹配                         |
| and      | array     | 表示数组下全部规则匹配                         |
| bool     | bool      | 直接返回value的值                              |
| equal    | string    | 字符串相等                                     |
| !equal   | string    | 字符串不相等                                   |
| match    | string    | 表示通配符的字符串匹配，忽略大小写             |
| !match   | string    | match的相反                                    |
| ==       | number    | 等于                                           |
| !=       | number    | 不等于                                         |
| >        | number    | 大于                                           |
| <        | number    | 小于                                           |
| >=       | number    | 大于等于                                       |
| <=       | number    | 小于等于                                       |
| &        | number    | 包含                                           |
| !&       | number    | 不包含                                         |
