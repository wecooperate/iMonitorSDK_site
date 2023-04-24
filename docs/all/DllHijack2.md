---
title: DLL挟持模块的生成
group:
  title: 技术文章
---

## 背景

上次介绍了DLL挟持原理、分析、应用（https://imonitorsdk.com/all/dll-hijack）很多网友反馈说希望提供快速生成挟持模块的工具，这里详细介绍一些挟持模块的生成过程。

## 原理

程序对一个模块有静态依赖和动态依赖两种。

#### 静态依赖 

编译的时候，会把依赖的模块信息写入到PE结构的导入表中。加载的时候，会根据导入表，加载对应的模块，然后从该模块的导出表检索函数，修复PE映像的导入函数调用地址，这样调用函数的时候就会跳转模块里面执行。

#### 动态依赖

程序对模块不会有直接依赖的关系，而是执行过程中，通过LoadLibrary + GetProcAddress的方式加载模块，然后获取需要调用的函数去执行。

#### 挟持模块

无论是哪种依赖关系，制作一个挟持模块去替换原始的模块，如果要保证程序运行正常，挟持模块需要提供程序所依赖的全部函数，通常挟持模块会导出被挟持模块的全部导出函数。

怎么查看一个模块的导出函数呢？可以通过dumpbin查看，也可以通过其他的PE工具。

下面的通过dumpbin查看version.dll的导入函数的命令。

```
dumpbin /exports C:\windows\system32\version.dll

Dump of file C:\windows\system32\version.dll

File Type: DLL

  Section contains the following exports for VERSION.dll

    00000000 characteristics
    90A1B58A time date stamp
        0.00 version
           1 ordinal base
          17 number of functions
          17 number of names

    ordinal hint RVA      name

          1    0 00001EE0 GetFileVersionInfoA
          2    1 000023E0 GetFileVersionInfoByHandle
          3    2 00001F00 GetFileVersionInfoExA
          4    3 00001070 GetFileVersionInfoExW
          5    4 00001010 GetFileVersionInfoSizeA
          6    5 00001F20 GetFileVersionInfoSizeExA
          7    6 00001090 GetFileVersionInfoSizeExW
          8    7 000010B0 GetFileVersionInfoSizeW
          9    8 000010D0 GetFileVersionInfoW
         10    9 00001F40 VerFindFileA
         11    A 000025A0 VerFindFileW
         12    B 00001F60 VerInstallFileA
         13    C 00003390 VerInstallFileW
         14    D          VerLanguageNameA (forwarded to KERNEL32.VerLanguageNameA)
         15    E          VerLanguageNameW (forwarded to KERNEL32.VerLanguageNameW)
         16    F 00001030 VerQueryValueA
         17   10 00001050 VerQueryValueW
```

知道所有的导出函数了，那么下一步就是实现这些函数。大部分场景，我们并不关心这些函数具体的功能，也没有必要完整实现这些函数，只需要把这些函数映射到原来模块的函数就好了。

方式一：使用导出表重定向的方式（比如上面的：VerLanguageNameA (forwarded to KERNEL32.VerLanguageNameA) ）

VC提供#pragma的编译指令，可以手动导出一个指向其他模块的函数。

比如：导出GetFileVersionInfoA实际是指定到original_version.dll里面的GetFileVersionInfoA

```
#pragma comment(linker,"/export:GetFileVersionInfoA=original_version.GetFileVersionInfoA")
```

这种方式在替换模块的时候，存在一个问题，就是引入了一个新的模块依赖（原始模块），需要从原始模块拷贝一份重命名后放在一起才能正常加载。这种方式操作会比较麻烦，因为没法提前把原始模块打包在一起（每个系统可能不一样），而是需要在目标机器上手动拷贝一份。

方式二：通过动态依赖原始模块，然后GetProcAddress + JMP的方式。

```
// 初始化的时候，获取到全部需要的原始函数
// original_GetFileVersionInfoA = GetProcAddress(original_version, "GetFileVersionInfoA");

__declspec(naked) GetFileVersionInfoA
{
	__asm jmp original_GetFileVersionInfoA;
}
```

但是在x64编译器上，不支持直接内联汇编的方式。

为了通用，直接去掉了手动编写函数，而是使用编辑字节码的方式。

```C++
#ifdef _M_IX86

struct JMPStub
{
    //
    // jmp address
    //
	BYTE JMP;
	ULONG Address;
};

#else

struct JMPStub
{
    //
    // mov rax, address
    // jmp rax
    //
	USHORT MOVRax;
	ULONGLONG Address;
	USHORT JMPRax;
};

#endif
```

## 完整代码

```C++
#pragma pack(push, 1)
//******************************************************************************
#ifdef _M_IX86
//******************************************************************************
struct JMPStub
{
	BYTE JMP;
	ULONG Address;

	bool Hook(HMODULE module, const char* Name)
	{
		PVOID addr = GetProcAddress(module, Name);

		if (addr == NULL)
			return false;

		JMP = 0xE9;
		Address = (ULONG)addr - (ULONG)this - 5;

		return true;
	}
};
//******************************************************************************
#else
//******************************************************************************
struct JMPStub
{
	USHORT MOVRax;
	ULONGLONG Address;
	USHORT JMPRax;

	bool Hook(HMODULE module, const char* Name)
	{
		PVOID addr = GetProcAddress(module, Name);

		if (addr == NULL)
			return false;

		MOVRax = 0xB848;
		Address = (ULONGLONG)addr;
		JMPRax = 0xE0FF;

		return true;
	}
};
//******************************************************************************
#endif
//******************************************************************************
#pragma pack(pop)
//******************************************************************************
#pragma data_seg(".jmp")
__declspec(selectany) HMODULE g_jmp_module = NULL;
#pragma data_seg()
#pragma comment(linker, "/SECTION:.jmp,RWE")
//******************************************************************************
class JMPSetModule
{
public:
	JMPSetModule(LPCTSTR Name)
	{
        //
        // 默认替换系统的镜像，如果需要其他的可以自行修改
        //
		TCHAR path[MAX_PATH] = {};
		GetWindowsDirectory(path, MAX_PATH);
		PathAppend(path, Name);
		g_jmp_module = LoadLibrary(path);
	}
};
//******************************************************************************
class JMPSetHook
{
public:
	JMPSetHook(JMPStub& stub, const char* Name)
	{
		stub.Hook(g_jmp_module, Name);
	}
};
//******************************************************************************
#define CONCAT_RAW_(a, b) a##b
#define CONCAT_(a, b)	  CONCAT_RAW_(a, b)
//******************************************************************************
#define BEGIN_EXPORT_MAP(module) JMPSetModule CONCAT_(module_, __COUNTER__)(_T(module));
#define EXPORT_MAP(name)                                                                 \
	namespace JMPStubPrivate                                                             \
	{                                                                                    \
		extern "C" __declspec(dllexport) __declspec(allocate(".jmp")) JMPStub name = {}; \
		JMPSetHook sethook_##name(name, #name);                                          \
	};
#define END_EXPORT_MAP()
//******************************************************************************
```

### 最终使用效果

添加下面的代码，编译后就可以自动生成一个替换version.dll的挟持模块。

```C++
BEGIN_EXPORT_MAP("system32\\version.dll")
	EXPORT_MAP(GetFileVersionInfoA)
	EXPORT_MAP(GetFileVersionInfoW)
	EXPORT_MAP(GetFileVersionInfoByHandle)
	EXPORT_MAP(GetFileVersionInfoExA)
	EXPORT_MAP(GetFileVersionInfoExW)
	EXPORT_MAP(GetFileVersionInfoSizeA)
	EXPORT_MAP(GetFileVersionInfoSizeW)
	EXPORT_MAP(GetFileVersionInfoSizeExA)
	EXPORT_MAP(GetFileVersionInfoSizeExW)
	EXPORT_MAP(VerFindFileA)
	EXPORT_MAP(VerFindFileW)
	EXPORT_MAP(VerInstallFileA)
	EXPORT_MAP(VerInstallFileW)
	EXPORT_MAP(VerLanguageNameA)
	EXPORT_MAP(VerLanguageNameW)
	EXPORT_MAP(VerQueryValueA)
	EXPORT_MAP(VerQueryValueW)
END_EXPORT_MAP()
```

