"""L02: 전압 = 물의 높이 차. 물탱크 수위가 높아질수록 파이프 속 물(전류)이 빨리 흐른다."""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common.manim_style import C, T  # noqa: E402
from manim import *  # noqa: E402,F403

TANK_L, TANK_R, TANK_B, TANK_T = -6.0, -3.2, -2.9, 2.2
PIPE_Y, PIPE_R, PIPE_END = -2.3, 0.32, 6.2
N_DROPS = 36


def headline(s):
    return T(s, 42).to_edge(UP, buff=0.35)


class Main(Scene):
    def construct(self):
        level = ValueTracker(-1.3)          # 수면 높이 (y)
        state = {"shift": 0.0, "t": 0.0}

        def speed():                         # 높이 차에 비례
            return 0.06 * (level.get_value() - PIPE_Y)

        clock = Mobject()

        def tick(_, dt):
            state["t"] += dt
            state["shift"] += speed() * dt
        clock.add_updater(tick)

        tank = VGroup(
            Line([TANK_L, TANK_T, 0], [TANK_L, TANK_B, 0]),
            Line([TANK_L, TANK_B, 0], [TANK_R, TANK_B, 0]),
            Line([TANK_R, TANK_B, 0], [TANK_R, PIPE_Y - PIPE_R, 0]),
            Line([TANK_R, PIPE_Y + PIPE_R, 0], [TANK_R, TANK_T, 0]),
        ).set_stroke(C("wire"), 8)
        pipe = VGroup(
            Line([TANK_R, PIPE_Y + PIPE_R, 0], [PIPE_END, PIPE_Y + PIPE_R, 0]),
            Line([TANK_R, PIPE_Y - PIPE_R, 0], [PIPE_END, PIPE_Y - PIPE_R, 0]),
        ).set_stroke(C("wire"), 8)
        pipe_water = Rectangle(width=PIPE_END - TANK_R, height=2 * PIPE_R, stroke_width=0,
                               fill_color=C("water"), fill_opacity=0.35).move_to([(TANK_R + PIPE_END) / 2, PIPE_Y, 0])

        water = always_redraw(lambda: Rectangle(
            width=TANK_R - TANK_L - 0.08, height=level.get_value() - TANK_B, stroke_width=0,
            fill_color=C("water"), fill_opacity=0.7,
        ).move_to([(TANK_L + TANK_R) / 2, (level.get_value() + TANK_B) / 2, 0]))

        rng = np.random.default_rng(2)
        base = np.linspace(0, 1, N_DROPS, endpoint=False)
        ys = rng.uniform(-0.6, 0.6, N_DROPS) * PIPE_R

        def make_drops():
            g = VGroup()
            for i in range(N_DROPS):
                x = TANK_R + ((base[i] + state["shift"]) % 1) * (PIPE_END - TANK_R)
                g.add(Circle(radius=0.11, stroke_width=0, fill_color=C("primary"), fill_opacity=1)
                      .move_to([x, PIPE_Y + ys[i], 0]))
            return g
        drops = always_redraw(make_drops)

        ARX = TANK_R + 0.7
        height_arrow = always_redraw(lambda: DoubleArrow(
            [ARX, PIPE_Y + PIPE_R + 0.05, 0], [ARX, level.get_value(), 0], buff=0,
            color=C("accent"), stroke_width=7, tip_length=0.25, max_tip_length_to_length_ratio=0.3))
        surface = always_redraw(lambda: DashedLine(
            [TANK_R, level.get_value(), 0], [ARX + 0.2, level.get_value(), 0],
            color=C("accent"), stroke_width=4))
        height_label = always_redraw(lambda: T("높이 차 = 전압", 34, "accent").next_to(
            [ARX, (PIPE_Y + PIPE_R + level.get_value()) / 2, 0], RIGHT, buff=0.3))

        flow_arrow = always_redraw(lambda: Arrow(
            [1.0, PIPE_Y - 0.85, 0], [1.0 + 22 * speed(), PIPE_Y - 0.85, 0], buff=0,
            color=C("primary"), stroke_width=9, max_tip_length_to_length_ratio=0.25))
        flow_label = T("흐르는 물의 양 = 전류", 30, "primary").move_to([-0.6, PIPE_Y - 0.85, 0], aligned_edge=RIGHT)
        flow_label.next_to([0.85, PIPE_Y - 0.85, 0], LEFT, buff=0.15)

        self.add(clock)
        title = headline("물탱크와 파이프로 생각해 봐요")
        self.play(Write(title), Create(tank), Create(pipe), run_time=1.2)
        self.play(FadeIn(water), FadeIn(pipe_water), FadeIn(drops))
        self.play(Create(surface), GrowFromCenter(height_arrow), FadeIn(height_label),
                  FadeIn(flow_label), GrowArrow(flow_arrow))
        self.play(Transform(title, headline("높이 차가 작으면 → 물이 천천히 흘러요")))
        self.wait(3)
        self.play(Transform(title, headline("물을 더 높이 채우면…")))
        self.play(level.animate.set_value(1.8), run_time=3, rate_func=smooth)
        self.play(Transform(title, headline("높이 차가 클수록 → 물이 세게 흘러요!")))
        self.wait(3)
        self.play(Transform(title, headline("전압이 클수록 → 전류가 많이 흘러요")))
        self.wait(3)
