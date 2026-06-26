# AI 升学规划与学情分析系统（妙搭）

本项目用于飞书妙搭应用 `app_4ke0jqzqjy118` 的本地与沙箱开发。

## 常用命令

```bash
npm install
npm run dev
npm run type:check
npm run build
```

## 编辑后台（妙搭）稳定恢复 SOP

当编辑后台预览出现“服务启动失败 / 502 / 页面空白”时，优先按以下步骤恢复。

1. 在妙搭任务终端执行：

```bash
git fetch origin sprint/default
git reset --hard origin/sprint/default
SANDBOX_SKIP_SERVER=1 npm run dev:sandbox-restart
```

2. 等日志出现 `VITE v7.x ready`。
3. 另开终端验证：

```bash
curl -s http://127.0.0.1:8001/dev/health
curl -s -o /tmp/page.html -w "GET_APP=%{http_code}\n" "http://127.0.0.1:8001/app/app_4ke0jqzqjy118/"
wc -c /tmp/page.html
```

期望结果：

- `{"ready":true}`
- `GET_APP=200`
- `/tmp/page.html` 字节数大于 0

4. 回妙搭编辑页按 `Cmd+Shift+R` 强制刷新整页，再打开“预览应用”。

## 说明

- `SANDBOX_SKIP_SERVER=1` 为沙箱轻量模式：优先保证编辑预览可打开，减少 OOM（137）风险。
- 轻量模式下，部分依赖后端 API 的功能可能不可用；如需完整后端联调，再切回带 server 模式。
