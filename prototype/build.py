"""Build seven portable, dependency-free HTML prototype documents."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
groups = [
    ('index', 'index.html', 'AI 闯关学习 · 原型总览'),
    ('A', '01-start-and-sources.html', '学习发起与资料来源'),
    ('B', '02-quiz-and-feedback.html', '闯关与即时反馈'),
    ('C', '03-review-and-sharing.html', '复盘与分享'),
    ('D', '04-learning-center.html', '学习中心与阶段报告'),
    ('E', '05-account-and-data.html', '账户与数据管理'),
    ('F', '06-empty-and-recovery.html', '空态、异常与恢复'),
]
css = (ROOT / 'assets/styles.css').read_text(encoding='utf-8')
js = '\n'.join((ROOT / ('assets/' + name)).read_text(encoding='utf-8') for name in ['data.js', 'app.js'])
for key, name, title in groups:
    page = f'''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#3258da">
<meta name="description" content="AI 闯关学习小程序：完整页面画板与轻交互原型，使用本地示例数据。">
<title>{title} · AI 闯关学习</title>
<style>{css}</style>
</head>
<body data-group="{key}">
<noscript>请启用 JavaScript 查看交互原型。所有脚本已经内嵌，无需联网。</noscript>
<script>{js.replace('</script', '<\\/script')}</script>
</body>
</html>
'''
    (ROOT / name).write_text(page, encoding='utf-8')
print(json.dumps({'built': [x[1] for x in groups], 'count': len(groups)}, ensure_ascii=False))
