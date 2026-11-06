# 离散之间 · 离散数学笔记学习站

把 272 页手写离散数学笔记逐页转写成的静态学习网站：章节正文、MathJax 公式、SVG 重绘的图、每节练习题、错题回顾和全文搜索，并可对照查看每一页手写原图。

教材参考：耿素云、屈婉玲等编著《离散数学》第七版。

## 内容

17 章 / 73 个小节 / 575 道练习题，覆盖：

| 部分 | 章节 |
| --- | --- |
| 逻辑与集合 | 命题与集合、二元关系、函数、自然数、基数 |
| 图论 | 图、欧拉图与哈密顿图、树、图的矩阵表示、平面图、图的着色、支配集·覆盖集·独立集 |
| 代数结构 | 代数系统、群、环与域、格与布尔代数 |
| 数论 | 初等数论 |

转写中发现的笔误用「校订说明」标出（保留原式），看不清的地方用「待核对」标出，不做猜测。

## 本地运行

纯静态页面，无需安装依赖：

```bash
python3 scripts/build.py          # 由 source-transcripts/sections 生成 dist/content.js
python3 -m http.server -d dist    # 打开 http://localhost:8000
```

`build.py` 会校验每个小节的文件是否齐全、272 页是否都有处理记录、练习题格式是否正确，有问题时报错退出；加 `--partial` 可跳过报错先生成。

## 目录结构

```
dist/                     网站（直接部署这个目录）
  index.html app.js style.css
  data.js                 章信息
  sections.js             小节与页码范围
  content.js              由 build.py 生成的正文 / 练习 / 页码记录
  pages/NNN.jpg           手写原图（001–272）
  vendor/                 MathJax（Apache-2.0）
source-transcripts/
  SPEC.txt                转写规范
  sections/<key>.html     小节正文
  sections/<key>.quiz.json  练习题
  sections/<key>.pages.json 每页处理记录
scripts/build.py          构建与校验脚本
```

## 部署

仓库自带 GitHub Actions（`.github/workflows/pages.yml`）。推送到 GitHub 后，在 Settings → Pages 把 Source 设为 GitHub Actions，每次推送 `main` 都会自动构建并发布 `dist/`。

## 参与校订

欢迎通过 Issue / PR 指出转写错误或补全「待核对」内容。修改 `source-transcripts/sections/` 下对应文件，格式见 `source-transcripts/SPEC.txt`，提交前运行 `python3 scripts/build.py` 确认通过。

## 许可

MathJax 依据 Apache License 2.0 分发（见 `dist/vendor/MathJax-LICENSE`）。
