# E3 验证与切真 —— 验证报告

**日期：** 2026-08-02 · **性质：** 只读验证，两侧仓库均未改动一行代码，未执行任何迁移/清库/推送
**上位文档：** `STAGE_LAB_STAFF_INTEGRATION_BLUEPRINT.md`（E 轨蓝图）§8 阶段表、§9 风险表

## 结论

**BLOCKED.**

E3 的前置条件是蓝图 §8 明写的 **「E1+E2 上线」**。两者都**没有上线**——两个仓库的相关提交至今停留在本地 `main`，从未推送到 `origin`，因此 Vercel 从未构建过任何包含它们的部署。E3 的四项任务全部依赖生产环境中已存在的埋点与 Lab 管道，在此状态下无一可执行，且**没有任何一项是可以"先做一半"的**：

- 任务 1（配置检查）—— 无法进行：没有 Vercel 访问凭据，且被检查的部署尚不存在（见缺陷 D3）。
- 任务 2（生产冒烟）—— 无法进行：生产客户站运行的是 E2 之前的代码，**不发出任何事件**，冒烟必然全空。这会是一次假阴性，比不做更糟。
- 任务 3（`db:unseed` 切真）—— **必须不执行**：生产库尚未跑过 E1 迁移，且步骤 2 没有产生任何真实行。此时清 fixture 只会把看板清成全空，且蓝图 §9 风险 2 要求 unseed 发生在第一份真实周报之前、而非之后——顺序前提不成立。
- 任务 4（第一份真实周报）—— 无法进行：无真实数据可填；另有文档缺口（见缺陷 D4）。

因此本报告的实质内容是**放行前必须清掉的缺陷清单**，而非验证结果表。

---

## 证据

两侧仓库均已 `git fetch origin` 后复核，以下为当时的真实状态。

### 客户站 STAGE FRONT（`D:\STAGE FRONT`）

```
## main...origin/main [ahead 1]
3794820 feat(growth): anonymous Lab telemetry and the community guidance card
```

`3794820` 即 E2 的全部交付（`lib/growth/emit.ts` 发射器 + 四科 UI 层发射点 + B1 社群引导卡）。它**领先 origin 1 个提交**，即生产站上不存在 `lib/growth/`，不存在访客 ID，不发出任何 beacon。

### Staff 平台 stage-staff（`D:\stage-staff\stage-staff`）

```
## main...origin/main [ahead 2]
6e8ba5b docs(e1): canonical event contract for E2, Lab page rules, migration notes
775ba57 feat(e1): IELTS Lab analytics — vocabulary v2, kind migration, Lab views and page
```

E1 的两个提交均**未推送**。生产 Staff 部署因此缺少：词表 v2、`event_kind` 枚举迁移、Lab 视图、`/lab` 页面、总览 Lab 卡与周报 Lab 段落。

进一步地，**生产 Neon 库尚未执行 E1 迁移**（此为跨会话已记录的既有状态，本次未连库因而未再实测，标为待复核）。这意味着即便现在推送代码，生产库的 `event_kind` 枚举仍不认识 v2 新增的事件种类——蓝图 §9 风险 1 正是针对这一步。

### 配置项检查（任务 1）

未能执行。本机不存在 `vercel` CLI，也不存在任何 Vercel token；两个仓库的文档、README、配置文件中**均未记录任一项目的生产 URL**（对 `*.vercel.app` 与自有域名的全仓检索无命中）。因此 `INGEST_ALLOWED_ORIGINS`、`STAFF_DATABASE_URL`、访问保护、以及客户站的 `NEXT_PUBLIC_GROWTH_INGEST_URL` 四项**一项都未能观测**，本报告不对它们的状态作任何断言。

可确认的一件相关事实：客户站本地 `.env.local` 中**没有** `NEXT_PUBLIC_GROWTH_INGEST_URL`（仅存在于 `.env.example`）。这在本地是**正确且预期**的状态——E2 的发射器在该变量缺失时硬 no-op，本地 checkout 本就该如此。此事实**不能**推断生产环境的配置。

---

## 缺陷清单（供后续会话修复，本会话未做任何修改）

| # | 缺陷 | 复现 | 阻断了 |
|---|---|---|---|
| **D1** | E1 的两个提交未推送，Staff 生产部署无 Lab 管道 | `cd D:\stage-staff\stage-staff && git fetch && git status -sb` → `ahead 2` | 全部 E3 |
| **D2** | E2 的提交未推送，客户站生产不发任何事件 | `cd "D:\STAGE FRONT" && git fetch && git status -sb` → `ahead 1` | 全部 E3 |
| **D3** | 两个项目的生产 URL 无处可查，无 Vercel/DB 访问凭据 | 全仓检索生产域名 0 命中；`which vercel`、`which psql` 均无 | 任务 1、2、3 |
| **D4** | 任务 4 引用的 `docs/ops/WECHAT_PRIVATE_DOMAIN_PLAYBOOK.md` **不存在**于任一仓库，因此"§6 的周报存放位置"无定义 | `find` 两仓 `docs/` 无 `*WECHAT*`/`*PLAYBOOK*`；`STAGE FRONT/docs/ops/` 仅有 `release.md`，`stage-staff/docs/ops/` 仅有 `WEEKLY_REPORT_TEMPLATE.md` | 任务 4 的存档步骤 |
| **D5** | 生产 Neon 库未跑 E1 迁移（待连库复核）；蓝图 §9 风险 1 明示枚举扩展需事务外的独立幂等步骤 | 推送 D1 后连生产库查 `event_kind` 枚举值 | 任务 2、3 |

D4 的额外说明：`stage-staff/docs/ops/WEEKLY_REPORT_TEMPLATE.md` 可能是该 playbook 的替代落点，但这是猜测，**不应由验证会话替业主裁定周报归档位置**。

---

## 放行 E3 所需的前置动作（按序）

1. 推送 E2（客户站）与 E1（Staff），确认两侧 Vercel 构建成功。
2. 对生产 Neon 库执行 E1 迁移，按蓝图 §9 风险 1 的要求把枚举扩展放在事务外的幂等步骤，迁移后核对 `event_kind` 的枚举值覆盖词表 v2 全部种类。
3. 在 Staff 项目配置 `INGEST_ALLOWED_ORIGINS` 为客户站**真实生产 origin**（§9 风险 6：漏配的表现是"埋点全无数据"的假故障，会被误诊为 E2 有 bug）；在客户站项目配置 `NEXT_PUBLIC_GROWTH_INGEST_URL` 指向 Staff 部署。
4. 把两个生产 URL 写进文档，并为验证会话准备只读的库访问方式（D3）。
5. 补齐或改指 D4 的周报归档位置。

上述五项完成后，E3 可原样重跑：任务 1→2→3→4 的顺序与蓝图 §9 风险 2 的"unseed 必须早于第一份真实周报"一致，无需改动。

---

## 未执行事项声明

本会话**没有**推送任何提交、**没有**执行 `db:migrate` 或 `db:unseed`、**没有**改动两个仓库的任何代码或配置、**没有**生成周报。生产数据库与两个 Vercel 项目均未被本会话触碰。
