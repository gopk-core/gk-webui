# GK WebUI

GK Agent 的 HTML/CSS/JavaScript 预览插件，使用宿主 WebView 的 Chromium 引擎，不捆绑另一份浏览器二进制。

## 0.1.0 预览版

- `chat.afterResponse` 自动识别 html/css/js 围栏代码块，把最近一份源码保存到本插件 `latest.json`，原回复不改写。
- 插件 WebUI 工作台提供 HTML/CSS/JavaScript 编辑、渲染、停止、清空和宽度切换。
- 预览使用独立 `iframe srcdoc`；默认关闭脚本，用户勾选并点击渲染才执行。不授予 same-origin、弹窗、顶层导航、表单提交或网络能力。
- 页面只读取显式检测到的 `gk.fs`。SDK 未承诺视图具备此桥接，因此不把跨执行域自动读取宣称为已验收；缺失时显示提示，使用复制粘贴。
- 聊天输入区保留原组件，增加捕获状态入口；不替换主页面或底部导航。

## 已知限制与验收边界

当前官方 SDK 未公布消息内 WebView 节点。本版是浏览器预览工作台，**不是气泡内嵌 HTML 的完整实现**。不能用原生 text/markdown 组件冒充浏览器。插件视图由 `contributions.views` 声明，宿主是否展示任意 target、视图桥接、srcdoc 和 CSP 最终行为仍需 GK Agent 真机验收。宿主 CSP 可能进一步限制脚本，插件不绕过它。

无外部图片、CDN 或联网；内联 CSS、内联脚本和 base64 图片用于本地预览。脚本可能耗尽渲染进程资源，停止按钮不能保证终止同步死循环；需要时用宿主原版恢复/停用入口。捕获仅保留最新一份，不保证会话级隔离，打开工作台前请留意当前捕获来源。清空编辑器不删除捕获文件；原生状态页“清除捕获”删除其内容。

## 构建与测试

```
npm ci --ignore-scripts
npm run build
npm test
python3 tools/plugins/package_v2.py . releases/0.1.0/plugin-0.1.0.tar.gz
```

TypeScript 源码编译为全局 `main(input,gk)`。`tools/plugins/package_v2.py` 为 DevHub 官方示例所附打包器。运行包不包含 Node 依赖或未编译 TS。

已通过 TypeScript 编译、JavaScript 语法检查、Node 桥接替身与 DOM 测试、官方 USTAR 打包器校验。尚未完成 GK Agent 真机安装、生命周期/视图桥接、实际 Chromium 视觉及正式审批端到端测试。测试替身不等于真机结果。

权限：code/app/ui/storage。无需 network、shell 或 tools。停用插件由宿主撤销自身界面帧。收录申请是审核申请，不代表批准或安装。

许可证沿用仓库 AGPL-3.0-only。
