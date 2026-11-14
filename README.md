# 离散之间

耿素云、屈婉玲等《离散数学》第七版学习网站。19章、83小节、635道选择与填空练习。

课程覆盖逻辑与集合、图论、代数结构、初等数论、组合分析、形式语言与自动机。

运行：
```sh
python3 scripts/build.py
python3 -m http.server 8766 --directory dist
```

正文位于source-transcripts/sections，生成结果为dist/content.js。内部页码处理记录仅用于维护，不在课程界面展示。
