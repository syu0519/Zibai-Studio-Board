# 茲白虛擬棚本機伺服器：會即時掃描 scenes/ 產生場景清單。用法：python serve.py [port]
import http.server, json, os, sys, webbrowser, threading
ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

def scan():
    out, base = [], os.path.join(ROOT, 'scenes')
    for name in sorted(os.listdir(base)) if os.path.isdir(base) else []:
        mf = os.path.join(base, name, 'SCENE_MANIFEST.json')
        if not os.path.isfile(mf): continue
        try:
            with open(mf, encoding='utf-8-sig') as f: m = json.load(f)
            if m.get('schema') != 'pocketvp.scene/1': continue
            out.append({'id': m.get('id') or name, 'name': m.get('name') or name, 'version': m.get('version', ''), 'path': f'scenes/{name}/'})
        except Exception as e:
            print('略過', name, e)
    return out

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()
    def do_GET(self):
        if self.path.split('?')[0] == '/scenes/index.json':
            body = json.dumps(scan(), ensure_ascii=False).encode('utf-8')
            self.send_response(200); self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body); return
        super().do_GET()

H.extensions_map.update({'.js': 'text/javascript', '.mjs': 'text/javascript', '.vrm': 'application/octet-stream', '.vrma': 'application/octet-stream'})
if __name__ == '__main__':
    print(f'茲白虛擬棚：http://localhost:{PORT}/zibai-board.html')
    print(f'導演台：    http://localhost:{PORT}/zibai-director.html')
    print('找到的場景：', ', '.join(s['name'] for s in scan()) or '（沒有）')
    threading.Timer(1, lambda: webbrowser.open(f'http://localhost:{PORT}/zibai-director.html')).start()
    http.server.ThreadingHTTPServer(('', PORT), H).serve_forever()
