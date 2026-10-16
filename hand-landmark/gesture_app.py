"""나만의 제스처 학습 GUI (수집 -> 학습 -> 실시간 추론)

실행: python gesture_app.py
"""
import csv
import os
import queue
import threading
import time
import tkinter as tk
from collections import Counter
from tkinter import messagebox, ttk

import cv2
import joblib
import mediapipe as mp
from PIL import Image, ImageTk

from gesture_common import (CLASSIFIER_PATH, DATA_PATH, create_landmarker,
                            draw_hand, landmarks_to_features, open_camera,
                            put_text)
from train_gesture import train_model

FONT = ("Malgun Gothic", 10)
FONT_BOLD = ("Malgun Gothic", 10, "bold")
FONT_BIG = ("Malgun Gothic", 22, "bold")
COUNTDOWN_SEC = 3


class GestureApp:
    def __init__(self, root):
        self.root = root
        root.title("나만의 제스처 학습기")
        root.protocol("WM_DELETE_WINDOW", self.on_close)

        self.cap = None
        self.landmarker = create_landmarker(num_hands=2)
        self.start_time = time.monotonic()

        # 수집 상태
        self.recording = False
        self.countdown_end = None
        self.saved = 0
        self.target = 0
        self.rec_label = ""
        self.csv_file = None
        self.csv_writer = None

        # 학습/추론 상태
        self.clf = None
        self.training = False
        self.log_queue = queue.Queue()

        self.build_ui()
        self.refresh_counts()
        self.load_classifier()
        self.connect_camera()
        self.update_frame()

    # ---------------- UI ----------------
    def build_ui(self):
        style = ttk.Style()
        style.configure("TLabelframe.Label", font=FONT_BOLD)
        style.configure("TButton", font=FONT)
        style.configure("Rec.TButton", font=FONT_BOLD, foreground="red")

        main = ttk.Frame(self.root, padding=8)
        main.pack(fill="both", expand=True)

        # 왼쪽: 영상
        left = ttk.Frame(main)
        left.pack(side="left", fill="both", expand=True)
        self.video = tk.Label(left, bg="black")
        self.video.pack()
        self.status_var = tk.StringVar(value="")
        ttk.Label(left, textvariable=self.status_var, font=FONT).pack(anchor="w", pady=(4, 0))

        # 오른쪽: 컨트롤
        right = ttk.Frame(main, width=330)
        right.pack(side="right", fill="y", padx=(10, 0))

        # 카메라
        cam = ttk.LabelFrame(right, text=" 카메라 ", padding=6)
        cam.pack(fill="x")
        ttk.Label(cam, text="번호", font=FONT).pack(side="left")
        self.cam_var = tk.StringVar(value="0")
        ttk.Combobox(cam, textvariable=self.cam_var, values=["0", "1", "2"],
                     width=4, state="readonly").pack(side="left", padx=4)
        ttk.Button(cam, text="연결", command=self.connect_camera).pack(side="left")

        # 1. 수집
        col = ttk.LabelFrame(right, text=" ① 데이터 수집 ", padding=6)
        col.pack(fill="x", pady=(8, 0))

        row = ttk.Frame(col)
        row.pack(fill="x")
        ttk.Label(row, text="제스처 이름", font=FONT).pack(side="left")
        self.label_var = tk.StringVar()
        self.label_entry = ttk.Entry(row, textvariable=self.label_var, width=16, font=FONT)
        self.label_entry.pack(side="left", padx=4)

        row = ttk.Frame(col)
        row.pack(fill="x", pady=4)
        ttk.Label(row, text="수집 개수", font=FONT).pack(side="left")
        self.count_var = tk.IntVar(value=300)
        ttk.Spinbox(row, from_=50, to=2000, increment=50, textvariable=self.count_var,
                    width=7).pack(side="left", padx=(15, 4))

        self.rec_btn = ttk.Button(col, text="● 녹화 시작 (Space)", style="Rec.TButton",
                                  command=self.toggle_record)
        self.rec_btn.pack(fill="x")
        self.progress = ttk.Progressbar(col, maximum=100)
        self.progress.pack(fill="x", pady=4)
        ttk.Label(col, text="※ 손 모양 유지한 채 거리·각도를 조금씩 바꿔주세요",
                  font=("Malgun Gothic", 8), foreground="gray").pack(anchor="w")

        self.tree = ttk.Treeview(col, columns=("count",), height=6)
        self.tree.heading("#0", text="제스처")
        self.tree.heading("count", text="샘플 수")
        self.tree.column("#0", width=170)
        self.tree.column("count", width=80, anchor="e")
        self.tree.pack(fill="x", pady=(6, 4))
        self.tree.bind("<<TreeviewSelect>>", self.on_tree_select)
        ttk.Button(col, text="선택한 제스처 삭제", command=self.delete_label).pack(fill="x")

        # 2. 학습
        tr = ttk.LabelFrame(right, text=" ② 학습 ", padding=6)
        tr.pack(fill="x", pady=(8, 0))
        self.train_btn = ttk.Button(tr, text="학습 시작", command=self.start_training)
        self.train_btn.pack(fill="x")
        self.train_bar = ttk.Progressbar(tr, mode="indeterminate")
        self.train_bar.pack(fill="x", pady=4)
        self.log = tk.Text(tr, height=9, width=40, font=("Consolas", 8), wrap="none")
        self.log.pack(fill="x")

        # 3. 추론
        inf = ttk.LabelFrame(right, text=" ③ 실시간 추론 ", padding=6)
        inf.pack(fill="x", pady=(8, 0))
        self.infer_var = tk.BooleanVar(value=False)
        self.infer_chk = ttk.Checkbutton(inf, text="추론 켜기", variable=self.infer_var)
        self.infer_chk.pack(anchor="w")
        row = ttk.Frame(inf)
        row.pack(fill="x")
        ttk.Label(row, text="최소 신뢰도", font=FONT).pack(side="left")
        self.thr_var = tk.DoubleVar(value=0.7)
        self.thr_text = tk.StringVar(value="0.70")
        ttk.Scale(row, from_=0.3, to=0.99, variable=self.thr_var,
                  command=lambda v: self.thr_text.set(f"{float(v):.2f}")).pack(
            side="left", fill="x", expand=True, padx=4)
        ttk.Label(row, textvariable=self.thr_text, font=FONT, width=4).pack(side="left")
        self.pred_var = tk.StringVar(value="-")
        ttk.Label(inf, textvariable=self.pred_var, font=FONT_BIG,
                  foreground="#1a73e8", anchor="center").pack(fill="x", pady=4)

        self.root.bind("<space>", self.on_space)

    # ---------------- 카메라 ----------------
    def connect_camera(self):
        if self.recording:
            self.stop_record()
        if self.cap is not None:
            self.cap.release()
            self.cap = None
        idx = int(self.cam_var.get())
        try:
            self.cap = open_camera(idx)
            self.status_var.set(f"카메라 {idx}번 연결됨")
        except RuntimeError as e:
            self.status_var.set(str(e))

    def update_frame(self):
        if self.cap is not None:
            ok, frame = self.cap.read()
            if ok:
                self.process(cv2.flip(frame, 1))
            else:
                self.status_var.set("카메라 프레임을 읽지 못했습니다. (Zoom 등 다른 프로그램이 사용 중인지 확인)")
        self.drain_log()
        self.root.after(10, self.update_frame)

    def process(self, frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        ts = int((time.monotonic() - self.start_time) * 1000)
        result = self.landmarker.detect_for_video(mp_image, ts)

        infer_on = self.infer_var.get() and self.clf is not None and not self.recording
        preds = []
        for i, (landmarks, handedness) in enumerate(zip(result.hand_landmarks, result.handedness)):
            handed = handedness[0].category_name
            pts = draw_hand(frame, landmarks)
            feats = landmarks_to_features(landmarks, handed)

            # 수집은 첫 번째 손만
            if i == 0 and self.recording and self.countdown_end is None:
                self.csv_writer.writerow([self.rec_label] + [f"{v:.6f}" for v in feats])
                self.saved += 1

            if infer_on:
                proba = self.clf.predict_proba([feats])[0]
                best = proba.argmax()
                name = str(self.clf.classes_[best]) if proba[best] >= self.thr_var.get() else "?"
                preds.append(f"{name} ({proba[best]:.2f})")
                x0 = min(p[0] for p in pts)
                y0 = max(min(p[1] for p in pts) - 10, 25)
                put_text(frame, f"{name} {proba[best]:.2f}", (x0, y0), (0, 255, 255), 0.9)

        if infer_on:
            self.pred_var.set("  /  ".join(preds) if preds else "손 없음")
        elif not self.infer_var.get():
            self.pred_var.set("-")

        self.update_record_state(frame, has_hand=bool(result.hand_landmarks))

        img = ImageTk.PhotoImage(Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)))
        self.video.configure(image=img)
        self.video.image = img

    # ---------------- 수집 ----------------
    def on_space(self, event):
        if self.root.focus_get() is self.label_entry:
            return
        self.toggle_record()

    def toggle_record(self):
        if self.recording:
            self.stop_record()
        else:
            self.start_record()

    def start_record(self):
        label = self.label_var.get().strip()
        if not label:
            messagebox.showwarning("알림", "제스처 이름을 입력하세요.")
            return
        if not label.isascii() or "," in label:
            messagebox.showwarning("알림", "제스처 이름은 영어/숫자/_ 로 입력하세요.\n(영상에 한글 표시가 안 됩니다)")
            return
        if self.cap is None:
            messagebox.showwarning("알림", "카메라가 연결되지 않았습니다.")
            return
        try:
            self.target = int(self.count_var.get())
        except (tk.TclError, ValueError):
            self.target = 300
        os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
        self.csv_file = open(DATA_PATH, "a", newline="", encoding="utf-8")
        self.csv_writer = csv.writer(self.csv_file)
        self.rec_label = label
        self.saved = 0
        self.recording = True
        self.countdown_end = time.monotonic() + COUNTDOWN_SEC
        self.progress["value"] = 0
        self.rec_btn.configure(text="■ 녹화 중지 (Space)")
        self.root.focus_set()

    def stop_record(self):
        self.recording = False
        self.countdown_end = None
        if self.csv_file:
            self.csv_file.close()
            self.csv_file = None
        self.rec_btn.configure(text="● 녹화 시작 (Space)")
        self.status_var.set(f"[{self.rec_label}] {self.saved}개 저장됨")
        self.refresh_counts()

    def update_record_state(self, frame, has_hand):
        if not self.recording:
            return
        if self.countdown_end is not None:
            left = self.countdown_end - time.monotonic()
            if left > 0:
                h, w = frame.shape[:2]
                put_text(frame, str(int(left) + 1), (w // 2 - 20, h // 2 + 20), (0, 0, 255), 3)
                put_text(frame, f"Get ready: {self.rec_label}", (10, 30), (0, 200, 255))
                return
            self.countdown_end = None
        put_text(frame, f"REC {self.rec_label}: {self.saved}/{self.target}", (10, 30), (0, 0, 255))
        if not has_hand:
            put_text(frame, "no hand", (10, 60), (0, 165, 255))
        cv2.circle(frame, (620, 20), 10, (0, 0, 255), -1)
        self.progress["value"] = self.saved / self.target * 100
        if self.saved >= self.target:
            self.stop_record()

    def read_rows(self):
        if not os.path.exists(DATA_PATH):
            return []
        with open(DATA_PATH, newline="", encoding="utf-8") as f:
            return [row for row in csv.reader(f) if row]

    def refresh_counts(self):
        counts = Counter(row[0] for row in self.read_rows())
        self.tree.delete(*self.tree.get_children())
        for label, n in sorted(counts.items()):
            self.tree.insert("", "end", text=label, values=(n,))

    def on_tree_select(self, event):
        sel = self.tree.selection()
        if sel and not self.recording:
            self.label_var.set(self.tree.item(sel[0], "text"))

    def delete_label(self):
        sel = self.tree.selection()
        if not sel or self.recording:
            return
        label = self.tree.item(sel[0], "text")
        if not messagebox.askyesno("삭제 확인", f"'{label}' 데이터를 모두 삭제할까요?"):
            return
        rows = [row for row in self.read_rows() if row[0] != label]
        with open(DATA_PATH, "w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerows(rows)
        self.refresh_counts()
        self.status_var.set(f"'{label}' 삭제됨 (다시 학습하세요)")

    # ---------------- 학습 ----------------
    def start_training(self):
        if self.training or self.recording:
            return
        self.training = True
        self.train_btn.configure(state="disabled")
        self.train_bar.start(10)
        self.log.delete("1.0", "end")
        threading.Thread(target=self.train_worker, daemon=True).start()

    def train_worker(self):
        try:
            clf = train_model(log=self.log_queue.put)
            self.log_queue.put(("done", clf))
        except Exception as e:  # 학습 실패도 UI에 표시
            self.log_queue.put(("error", str(e)))

    def drain_log(self):
        while not self.log_queue.empty():
            item = self.log_queue.get()
            if isinstance(item, tuple):
                kind, payload = item
                self.training = False
                self.train_bar.stop()
                self.train_btn.configure(state="normal")
                if kind == "done":
                    self.clf = payload
                    self.infer_var.set(True)
                    self.status_var.set("학습 완료! 실시간 추론을 켰습니다.")
                else:
                    self.log.insert("end", f"\n[오류] {payload}\n")
                    messagebox.showerror("학습 실패", payload)
            else:
                self.log.insert("end", item + "\n")
            self.log.see("end")

    def load_classifier(self):
        if os.path.exists(CLASSIFIER_PATH):
            try:
                self.clf = joblib.load(CLASSIFIER_PATH)
                names = ", ".join(str(c) for c in self.clf.classes_)
                self.log.insert("end", f"저장된 모델 불러옴: {names}\n")
            except Exception as e:
                self.log.insert("end", f"모델 불러오기 실패: {e}\n")

    # ---------------- 종료 ----------------
    def on_close(self):
        if self.recording:
            self.stop_record()
        if self.cap is not None:
            self.cap.release()
        self.landmarker.close()
        self.root.destroy()


def main():
    root = tk.Tk()
    GestureApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
