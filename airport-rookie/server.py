# 웹 버전 실행: python server.py → 브라우저에서 http://localhost:8000
# 게임 계산은 tkinter 버전과 똑같은 game_state.py를 서버에서 돌리고,
# 브라우저(web/index.html)는 화면 그리기와 입력만 담당한다.
# 회차 기록은 각자 브라우저에 저장되고, 요청할 때마다 서버로 보내준다.
# 배포할 때는 호스팅 서비스가 정해주는 HOST/PORT 환경변수로 실행된다.
import json
import os
import threading
import time
import uuid
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

import config
import save_data
import sprites
from game_state import GameState, record_result

HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", 8000))
WEB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")
IDLE_LIMIT = 30 * 60      # 30분 동안 아무 요청이 없는 게임은 정리
MAX_GAMES = 200           # 동시에 진행 가능한 게임 수

games = {}               # 게임 id → {"state", "save", "seen"}
lock = threading.Lock()  # 여러 요청이 동시에 게임을 건드리지 않게
SPRITES_JSON = json.dumps(sprites.as_dict(), ensure_ascii=False).encode("utf-8")


def save_info(data):
    nxt = None
    if data["clears"] < len(config.UNLOCK_ORDER):
        nxt = config.ZONES[config.UNLOCK_ORDER[data["clears"]]]["name"]
    return {
        "runs": data["runs"],
        "clears": data["clears"],
        "best_rank": config.RANKS[data["best_rank"]][0],
        "unlocked": [config.ZONES[z]["name"] for z in save_data.unlocked_zones(data)],
        "next_unlock": nxt,
        "difficulties": list(config.DIFFICULTY),
        "notices": config.EVENT_NOTICE,
    }


def snapshot(game_id):
    """현재 상태 + 쌓인 로그/팝업을 꺼내서 돌려준다. 판이 끝났으면 갱신된 기록도 함께."""
    g = games[game_id]
    s = g["state"]
    result = s.to_dict()
    result["messages"] = s.messages[:]
    result["popups"] = [{"title": t, "text": x} for t, x in s.popups]
    s.messages.clear()
    s.popups.clear()
    if s.finished:
        result["new_unlock"] = record_result(g["save"], s)
        result["save"] = g["save"]
        del games[game_id]
    return result


def cleanup():
    now = time.time()
    for gid in [gid for gid, g in games.items() if now - g["seen"] > IDLE_LIMIT]:
        del games[gid]


def handle_api(path, body):
    cleanup()
    if path == "/api/save":
        return save_info(save_data.clean(body.get("save")))

    if path == "/api/new":
        if body.get("difficulty") not in config.DIFFICULTY:
            return {"error": "난이도를 선택해 주세요."}
        if len(games) >= MAX_GAMES:
            return {"error": "지금 접속자가 너무 많아요. 잠시 후 다시 시도해 주세요."}
        data = save_data.clean(body.get("save"))
        data["runs"] += 1
        game_id = uuid.uuid4().hex
        games[game_id] = {"state": GameState(body["difficulty"], data), "save": data, "seen": time.time()}
        res = snapshot(game_id)
        res.update(id=game_id, save=data, speed_ok=save_data.speed_unlocked(data),
                   tick_ms=config.TICK_MS, grid_size=config.GRID_SIZE, tile_px=config.TILE_PX,
                   intro={"title": config.INTRO_TITLE, "text": config.INTRO_TEXT},
                   notice=config.EVENT_NOTICE[body["difficulty"]] + "\n\n" + config.TOWER_NOTICE)
        return res

    game_id = body.get("id")
    if game_id not in games:
        return {"error": "게임을 찾을 수 없습니다. 새로 시작해 주세요."}
    games[game_id]["seen"] = time.time()
    s = games[game_id]["state"]

    if path == "/api/tick":
        s.tick()
    elif path == "/api/action":
        kind = body.get("type")
        r, c = body.get("r"), body.get("c")
        if kind in ("land", "demolish", "build") and not (
                isinstance(r, int) and isinstance(c, int) and 0 <= r < config.GRID_SIZE and 0 <= c < config.GRID_SIZE):
            return {"error": "잘못된 위치입니다."}
        if kind == "land":
            ok, msg = s.buy_land(r, c)
        elif kind == "demolish":
            ok, msg = s.demolish(r, c)
        elif kind == "build":
            ok, msg = s.build(r, c, body.get("zone"))
        elif kind == "plane":
            ok, msg = s.buy_plane(body.get("plane", "mid"))
        else:
            ok, msg = False, "알 수 없는 행동"
        if not ok and msg and not body.get("quiet"):
            s.log(msg)
    else:
        return {"error": "없는 주소입니다."}
    return snapshot(game_id)


class Handler(BaseHTTPRequestHandler):
    def send_raw(self, raw, ctype, status=200):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def send_json(self, obj, status=200):
        self.send_raw(json.dumps(obj, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8", status)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/sprites":
            self.send_raw(SPRITES_JSON, "application/json; charset=utf-8")
            return
        if path in ("/", "/index.html"):
            with open(os.path.join(WEB_DIR, "index.html"), "rb") as f:
                self.send_raw(f.read(), "text/html; charset=utf-8")
            return
        self.send_json({"error": "not found"}, 404)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        if length > 20000:
            self.send_json({"error": "요청이 너무 큽니다."}, 413)
            return
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
            if not isinstance(body, dict):
                raise ValueError
        except ValueError:   # JSON 형식 오류, 인코딩 오류
            self.send_json({"error": "잘못된 요청"}, 400)
            return
        with lock:
            self.send_json(handle_api(urlparse(self.path).path, body))

    def log_message(self, *args):
        pass   # 매초 들어오는 tick 요청 로그는 끈다


def main():
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    url = f"http://localhost:{PORT}"
    print(f"서버 실행 중: {url}  (종료: Ctrl+C)", flush=True)
    if "PORT" not in os.environ:       # 내 컴퓨터에서 실행할 때만 브라우저 자동 열기
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("서버 종료")


if __name__ == "__main__":
    main()
