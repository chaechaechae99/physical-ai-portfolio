"""L01: 전선 속 전자들 — 제자리에서 꼼지락 → 전지를 연결하면 한 방향으로 흐르고 전구가 켜진다."""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common.manim_style import C, T  # noqa: E402
from manim import *  # noqa: E402,F403

W, H = 5.4, 2.3            # 회로 사각형 반폭·반높이
N_ELECTRONS = 34


def loop_path() -> VMobject:
    # 전지 − 극(왼쪽 아래)에서 출발 → 아래 → 오른쪽(전구) → 위 → 전지 + 극으로 돌아옴
    p = VMobject()
    p.set_points_as_corners([[-W, -H, 0], [W, -H, 0], [W, H, 0], [-W, H, 0], [-W, -H, 0]])
    return p


def battery() -> VGroup:
    body_top = RoundedRectangle(width=0.9, height=0.85, corner_radius=0.12,
                                fill_color=C("positive"), fill_opacity=1, stroke_width=0)
    body_bot = RoundedRectangle(width=0.9, height=0.85, corner_radius=0.12,
                                fill_color=C("negative"), fill_opacity=1, stroke_width=0)
    body_top.shift(UP * 0.4)
    body_bot.shift(DOWN * 0.4)
    cap = RoundedRectangle(width=0.4, height=0.18, corner_radius=0.05,
                           fill_color=C("muted"), fill_opacity=1, stroke_width=0).next_to(body_top, UP, buff=0)
    plus = T("+", 40, "bg").move_to(body_top)
    minus = T("−", 40, "bg").move_to(body_bot)
    return VGroup(body_top, body_bot, cap, plus, minus).scale(1.35).move_to([-W, 0, 0])


def bulb():
    glass = Circle(radius=0.6, stroke_color=C("wire"), stroke_width=5,
                   fill_color=C("accent"), fill_opacity=0)
    base = RoundedRectangle(width=0.5, height=0.35, corner_radius=0.06,
                            fill_color=C("muted"), fill_opacity=1, stroke_width=0).next_to(glass, DOWN, buff=-0.08)
    rays = VGroup(*[
        Line(0.8 * np.array([np.cos(a), np.sin(a), 0]), 1.1 * np.array([np.cos(a), np.sin(a), 0]),
             stroke_color=C("accent"), stroke_width=6)
        for a in np.linspace(-PI / 3, 4 * PI / 3, 7)
    ])
    g = VGroup(glass, base, rays).scale(1.3).move_to([W, 0.1, 0])
    rays.set_opacity(0)
    return g, glass, rays


class Main(Scene):
    def construct(self):
        path = loop_path()
        wire = path.copy().set_stroke(C("wire"), width=30)
        core = path.copy().set_stroke("#E8A87C", width=20)          # 구리색 심선

        rng = np.random.default_rng(1)
        base = np.linspace(0, 1, N_ELECTRONS, endpoint=False)
        phase = rng.uniform(0, TAU, (N_ELECTRONS, 2))

        # 시간·이동량은 dt 업데이터로 누적 → 다른 애니메이션과 독립적으로 계속 움직임
        state = {"t": 0.0, "shift": 0.0}
        speed = ValueTracker(0)      # 1초에 회로 몇 바퀴
        jitter = ValueTracker(0.07)  # 꼼지락 크기
        clock = Mobject()

        def tick(_, dt):
            state["t"] += dt
            state["shift"] += speed.get_value() * dt
        clock.add_updater(tick)

        def make_electrons():
            g = VGroup()
            tt, j = state["t"], jitter.get_value()
            for i in range(N_ELECTRONS):
                pos = path.point_from_proportion((base[i] + state["shift"]) % 1)
                pos = pos + j * np.array([np.sin(7 * tt + phase[i, 0]), np.sin(9 * tt + phase[i, 1]), 0])
                g.add(Circle(radius=0.16, fill_color=C("negative"), fill_opacity=1,
                             stroke_color=WHITE, stroke_width=2).move_to(pos))
            return g

        electrons = always_redraw(make_electrons)
        self.add(clock)

        title = T("전선 속에는 전자가 가득해요", 46).to_edge(UP, buff=0.4)
        self.play(Create(wire), Create(core), run_time=1.2)
        self.play(FadeIn(electrons), Write(title))
        self.wait(2.5)                                   # 1) 제자리에서 꼼지락

        bat = battery().set_z_index(5)                   # 2) 전지·전구 연결
        bulb_g, glass, rays = bulb()
        bulb_g.set_z_index(5)
        self.play(FadeIn(bat, shift=RIGHT * 0.3), FadeIn(bulb_g),
                  Transform(title, T("전지를 연결하면…", 46).to_edge(UP, buff=0.4)))

        arrow = Arrow([-1.2, -H - 0.65, 0], [1.2, -H - 0.65, 0], color=C("negative"),
                      stroke_width=6, buff=0)
        self.play(speed.animate.set_value(0.12), jitter.animate.set_value(0.02),   # 3) 흐름 시작
                  glass.animate.set_fill(opacity=0.9), rays.animate.set_opacity(1),
                  GrowArrow(arrow), run_time=1.5)
        self.play(Transform(title, T("전자가 한 방향으로 줄지어 흐르면 = 전기!", 46).to_edge(UP, buff=0.4)))
        self.wait(4)
