"""L02: 저항 = 좁은 통로. 파이프 가운데가 좁아지면 흐르는 물(전류)이 줄어든다."""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common.manim_style import C, T  # noqa: E402
from manim import *  # noqa: E402,F403

X0, X1 = -6.4, 6.4
R = 0.75                 # 파이프 반지름
NECK = 2.0               # 좁아지는 구간 반폭
N_DROPS = 70


def headline(s):
    return T(s, 42).to_edge(UP, buff=0.35)


class Main(Scene):
    def construct(self):
        neck = ValueTracker(R)               # 가운데 반지름
        state = {"shift": 0.0}

        def half(x):
            bump = np.where(np.abs(x) < NECK, 0.5 * (1 + np.cos(PI * x / NECK)), 0.0)
            return R - (R - neck.get_value()) * bump

        def speed():                          # 통로가 좁을수록 느려짐
            return 0.07 * (neck.get_value() / R) ** 1.5

        clock = Mobject()
        clock.add_updater(lambda _, dt: state.__setitem__("shift", state["shift"] + speed() * dt))

        xs = np.linspace(X0, X1, 200)

        def walls():
            top = VMobject().set_points_smoothly([[x, half(x), 0] for x in xs])
            bot = VMobject().set_points_smoothly([[x, -half(x), 0] for x in xs])
            fill = Polygon(*[[x, half(x), 0] for x in xs], *[[x, -half(x), 0] for x in xs[::-1]],
                           stroke_width=0, fill_color=C("water"), fill_opacity=0.35)
            return VGroup(fill, top.set_stroke(C("wire"), 8), bot.set_stroke(C("wire"), 8))
        pipe = always_redraw(walls)

        rng = np.random.default_rng(3)
        base = rng.permutation(np.linspace(0, 1, N_DROPS, endpoint=False))
        yf = rng.uniform(-0.8, 0.8, N_DROPS)

        def make_drops():
            g = VGroup()
            for i in range(N_DROPS):
                x = X0 + ((base[i] + state["shift"]) % 1) * (X1 - X0)
                g.add(Circle(radius=0.1, stroke_width=0, fill_color=C("primary"), fill_opacity=1)
                      .move_to([x, yf[i] * half(x), 0]))
            return g
        drops = always_redraw(make_drops)

        flow_arrow = always_redraw(lambda: Arrow(
            [-1.6, -2.3, 0], [-1.6 + 46 * speed(), -2.3, 0], buff=0,
            color=C("primary"), stroke_width=9, max_tip_length_to_length_ratio=0.25))
        flow_label = T("전류", 32, "primary").next_to([-1.75, -2.3, 0], LEFT, buff=0.15)
        neck_label = T("좁은 통로 = 저항", 34, "positive").move_to([0, 1.75, 0])

        self.add(clock)
        title = headline("넓은 파이프: 물이 술술 흘러요")
        self.play(Write(title), FadeIn(pipe))
        self.play(FadeIn(drops), FadeIn(flow_label), GrowArrow(flow_arrow))
        self.wait(3)
        self.play(Transform(title, headline("가운데가 좁아지면…")), FadeIn(neck_label))
        self.play(neck.animate.set_value(0.22), run_time=3, rate_func=smooth)
        self.play(Transform(title, headline("통로가 좁을수록 → 흐름이 줄어요")))
        self.wait(3)
        self.play(Transform(title, headline("저항이 클수록 → 전류가 적게 흘러요")))
        self.wait(3)
