"""Bundle the game into one self-contained file, sillage.html.

Inlines css/style.css, the game scripts and vendor/three.min.js (three.js r128)
so the game runs by double-clicking the file, with no server or internet.
Run from the repo root:  python3 tools/build_single.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ['catalog', 'audio', 'bottles', 'bottles-designer', 'bottles-arabia', 'bottles-margiela', 'bottles-template', 'bottles-niche', 'bottles-artisan', 'bottles-extra', 'bottles-jpg', 'boxes', 'boxes-houses', 'boxes-classic', 'boxes-designer', 'boxes-arabia', 'boxes-niche', 'showroom', 'unbox', 'maison', 'game']
THREE_TAG = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'


def inline_script(path):
    code = path.read_text(encoding='utf-8')
    if '</script' in code.lower():
        raise SystemExit(f'{path} contains a closing script tag and cannot be inlined')
    return '<script>\n' + code + '\n</script>'


def main():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    css = (ROOT / 'css/style.css').read_text(encoding='utf-8')
    html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + css + '\n</style>')
    html = html.replace(THREE_TAG, '<!-- three.js r128, MIT License, https://threejs.org -->\n' + inline_script(ROOT / 'vendor/three.min.js'))
    for name in SCRIPTS:
        html = html.replace(f'<script src="js/{name}.js"></script>', inline_script(ROOT / f'js/{name}.js'))
    if 'src="js/' in html or 'href="css/' in html or THREE_TAG in html:
        raise SystemExit('a stylesheet or script was not inlined; update tools/build_single.py')
    (ROOT / 'sillage.html').write_text(html, encoding='utf-8')
    print(f'Wrote sillage.html ({len(html.encode()) // 1024} KB)')


if __name__ == '__main__':
    main()
