# ACU-TO 静态站点（GitHub Pages）

本目录由 WordPress 插件 **ACU-TO Core** 自动生成，包含全部页面、静态资源、
SEO 文件与客户端搜索索引。部署后不需要 PHP 或数据库。

## 文件说明

| 文件 / 目录 | 作用 |
| --- | --- |
| `index.html` | 首页 |
| `404.html` | GitHub Pages 自动使用的 404 页面 |
| `.nojekyll` | 关闭 Jekyll，确保所有静态文件按原样发布 |
| `sitemap.xml` | 全站 URL 与封面图片清单 |
| `robots.txt` | 搜索引擎与 AI 检索爬虫策略 |
| `feed.xml` | RSS 2.0 订阅 |
| `search-index.json` | 静态站内搜索索引 |
| `CNAME` | 自定义域名（如已设置） |
| `wp-content/` `wp-includes/` | 主题与 WordPress 静态资源 |

## 手动部署

1. 在 GitHub 创建仓库（如果还没有）。
2. 把本目录推送到 `gh-pages` 分支：

```bash
npx gh-pages -d . -b gh-pages
```

或使用 Git：

```bash
git init
git checkout -b gh-pages
git add -A
git commit -m "Publish ACU-TO static site"
git remote add origin https://github.com/OWNER/REPO.git
git push -f origin gh-pages
```

3. 打开仓库 **Settings → Pages**，把 Source 设为 **Deploy from a branch**，
   分支选择 `gh-pages`，目录选择 `/ (root)`，保存。
4. 如果使用自定义域名，在 Pages 设置中填写域名，并启用 HTTPS。

> 当前配置仓库：`DoublePigeon/Acuto`

> 当前导出的目标地址：`https://doublepigeon.github.io/Acuto`

## 部署后建议

1. 把 `sitemap.xml` 提交到 Google Search Console 与 Bing Webmaster Tools。
2. 在 Pages 设置中确认 HTTPS 已启用。
3. 内容更新后重新导出并推送；静态站没有服务端评论或表单。
