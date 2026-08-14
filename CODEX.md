# Codex 使用说明（升学规划 / 妙搭）

本仓库给 Cursor / Codex 共用。**不是文件坏了导致 Codex 发不了版**，而是执行环境与检查策略差异。按下面做即可。

## 1. 正确工作目录

只用：

`/Users/yangcong/Projects/AI升学规划系统/code`

不要用桌面/iCloud 旧副本，不要用仓库内的 `.release-worktree-*`（那是临时目录，易乱）。

## 2. 发布闭环（与 Cursor 相同）

```bash
# 凭证
lark-cli apps +git-credential-init --app-id app_4ke0jqzqjy118 --as user

# 检查（够用即可，不必强跑完整 npm run build）
npm run type:check

# 提交（若 pre-commit/eslint 过慢）
SKIP_GIT_HOOKS=1 git add -A
SKIP_GIT_HOOKS=1 git commit -m "feat/fix: …"

# 推送 + 发布
git push origin sprint/default
RID=$(lark-cli apps +release-create --app-id app_4ke0jqzqjy118 --as user --format json | python3 -c 'import sys,json;print((json.load(sys.stdin).get("data") or {}).get("release_id") or "")')
lark-cli apps +release-get --app-id app_4ke0jqzqjy118 --release-id "$RID" --as user --format json
# 等到 status=finished
```

app_id：`app_4ke0jqzqjy118`  
分支：`sprint/default`  
远程：`miaoda-git.feishu.cn`（必须能出网）

## 3. 禁止把这些当「不能发布」的硬阻断

| 现象 | 正确处理 |
|---|---|
| `npm run build` / `build:client` 缺 `@rollup/rollup-darwin-arm64` 等 | 先 `npm run ensure:native`；仍失败也不要拦发布，妙搭云端会再构建 |
| `registry.npmmirror.com` / DNS 解析失败 | 属 Codex 联网审批/沙箱问题；换本机终端或 Cursor 执行 push/release |
| 审批超时、看不到弹窗 | 退出 Codex → 新建任务；旧任务权限无法中途升级 |
| `eslint` / pre-commit 卡住很久 | `SKIP_GIT_HOOKS=1` 提交 |

## 4. 推荐分工（最稳）

- Codex：改业务代码 + `npm run type:check`
- 发布：本机终端或 Cursor 跑 push + `lark-cli … +release-create`

若 Codex 已是 `approval_policy=never` + `sandbox_mode=danger-full-access` 且**新开任务**后网络正常，也可自行全流程发布。

## 5. 与「文件能不能用」无关的结论

本仓库可被正常识别：`package.json` 脚本、`AGENTS.md`（UI）、`lark-cli`、Git 远程均有效。  
Codex 失败高频原因是：**联网审批超时 / 可选原生依赖残缺 / 把本地 build 失败误判为不可发布**。
