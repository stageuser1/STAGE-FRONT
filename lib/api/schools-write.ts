// 相对路径,不走 `@/`:本文件的值导入必须能被 `node --test
// --experimental-strip-types` 解析,而那个 loader 不认 bundler 别名
// (与 lib/program-v3/json-ld.ts 同一约束)。
import { isAuthorized } from "./auth.ts";
import {
  validateContractPackage,
  type ContractPackage,
  type ContractViolation,
} from "../contract/validate.ts";
import { findReservedSlugs } from "../program-v3/reserved-slugs.ts";

/**
 * 写入 API 的逻辑核心。**没有 `server-only`**,所有 I/O 经 `deps` 注入 ——
 * 这是硬约束 D 的一次有记录的正当豁免(裁决 5,2026-08-09):`server-only`
 * 让任何 OSS 模块无法被 `node --test` import,而写入闸门的八条分支
 * (401/422/draft 强制/保留字/覆盖降级……)正是最需要被回归钉住的行为。
 *
 * **豁免边界**:deps 模式仅限写入路由,不得扩散到读取侧或其他模块。
 */

export interface WriteDeps {
  readPackage(slug: string): Promise<ContractPackage | null>;
  writePackage(slug: string, pkg: ContractPackage): Promise<void>;
  rebuildIndex(): Promise<void>;
  /**
   * 失效目标必须带上**具体 slug**,不能只失效动态路由模式。
   * 2026-08-09 实测:`revalidatePath("/schools/[slug]", "page")` 清不掉
   * 具体路径已缓存的页面 —— unpublish 之后页面仍返回 200,撤回通道失效。
   * 覆盖写时要传**新旧专业 slug 的并集**:改名或删掉的专业,其旧页面同样
   * 必须失效,否则会留下一个指向已不存在专业的 200 页面。
   */
  revalidate(target: { slug: string; programSlugs: string[] }): void;
  writeToken: string | undefined;
}

function json(body: unknown, status: number): Response {
  return Response.json(body as Record<string, unknown>, { status });
}

function unauthorized(): Response {
  // 响应体不区分「没带 token」与「token 错」,也不透露 token 是否已配置。
  return json({ error: "unauthorized" }, 401);
}

function unprocessable(violations: ContractViolation[]): Response {
  return json(
    {
      error: "contract_violation",
      message: "包未通过契约校验,整体拒绝,未写入任何内容",
      violations,
    },
    422,
  );
}

/** 保留字命中包装成与契约违规同构的形状,调用方只需处理一种错误结构。 */
function reservedSlugViolations(pkg: ContractPackage): ContractViolation[] {
  const slugs = pkg.publishing.programs.map((p) => p.slug);
  return findReservedSlugs(slugs).map((slug) => ({
    instancePath: `/publishing/programs/${slugs.indexOf(slug)}/slug`,
    message: `slug "${slug}" 命中保留字,会与同名路由段撞车(T3b-R1);slug 一旦生成即冻结,必须在生成端避免`,
  }));
}

/**
 * `POST /api/schools` —— 整包写入。
 *
 * 语义要点:
 * - **整体拒绝**:任何字段不合规都不写入任何内容,422 列出全部违规位置;
 * - **强制 draft**:请求里写什么 status 都覆盖为 draft,发布是独立的人工动作;
 * - 同 slug 重复 POST = 整包覆盖(draft 迭代的正常路径);若线上原为
 *   published,覆盖后降回 draft,并在响应里显式提示 `previous_status`。
 */
export async function handleSchoolWrite(
  request: Request,
  deps: WriteDeps,
): Promise<Response> {
  if (!isAuthorized(request.headers.get("authorization"), deps.writeToken)) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json", message: "请求体不是合法 JSON" }, 400);
  }

  const result = validateContractPackage(body);
  if (!result.ok) return unprocessable(result.violations);

  const reserved = reservedSlugViolations(result.pkg);
  if (reserved.length > 0) return unprocessable(reserved);

  const slug = result.pkg.schools[0].school_ref;
  const previous = await deps.readPackage(slug);

  // status 在校验之后才强制覆盖:契约照常要求请求里带合法的 status,
  // 但它的值不作数 —— 发布只能经 publish 端点。
  const stored: ContractPackage = { ...result.pkg, status: "draft" };
  await deps.writePackage(slug, stored);
  await deps.rebuildIndex();
  deps.revalidate({
    slug,
    programSlugs: [
      ...new Set([
        ...(previous?.publishing.programs ?? []).map((p) => p.slug),
        ...stored.publishing.programs.map((p) => p.slug),
      ]),
    ],
  });

  return json(
    {
      slug,
      status: "draft",
      programs: stored.publishing.programs.length,
      last_checked: stored.last_checked,
      ...(previous
        ? {
            previous_status: previous.status,
            ...(previous.status === "published"
              ? {
                  notice:
                    "该院校原为 published,本次覆盖已将其降回 draft,公开面立即不可见;确认后需重新调用 publish",
                }
              : {}),
          }
        : {}),
    },
    200,
  );
}

/**
 * `POST /api/schools/{slug}/publish` 与 `.../unpublish` 的共用实现。
 *
 * `revalidate()` 对 unpublish 是**阻塞级要求**(阶段一实测:只改 OSS 状态
 * 不失效缓存,已渲染的页面最长仍公开一小时,撤回通道形同虚设)。
 */
export async function handleStatusFlip(
  slug: string,
  target: "published" | "draft",
  request: Request,
  deps: WriteDeps,
): Promise<Response> {
  if (!isAuthorized(request.headers.get("authorization"), deps.writeToken)) {
    return unauthorized();
  }

  const pkg = await deps.readPackage(slug);
  if (!pkg) {
    return json({ error: "not_found", slug }, 404);
  }

  const changed = pkg.status !== target;
  if (changed) {
    await deps.writePackage(slug, { ...pkg, status: target });
    await deps.rebuildIndex();
  }
  // 即使 status 没变也失效一次:包内容可能已被覆盖写更新过,
  // 而调用者的意图就是"让线上与 OSS 一致"。
  deps.revalidate({
    slug,
    programSlugs: pkg.publishing.programs.map((p) => p.slug),
  });

  return json({ slug, status: target, changed }, 200);
}
