// 키워드 기반 꿈 해몽 — 꿈 이야기(자유 문장)에서 상징·행동·감정을 찾아 해석을 조합한다.
// 모든 문장은 자체 작성. AI 해몽이 붙기 전까지의 규칙 기반 버전.

import { DREAMS, type Dream, type Luck, dreamKey, matchDreams } from "@/lib/dream";
import { clamp, eun, iga, seedOf, pickR, yeyo } from "@/lib/util";

type Theme = "재물" | "인연" | "성취" | "변화" | "건강" | "감정" | "불안" | "관계";

type Sym = {
  label: string;
  re: RegExp;
  /** "○○은/는" 뒤에 이어지는 서술 */
  meaning: string;
  theme: Theme;
  /** -2 ~ +2 */
  w: number;
};

const S = (label: string, re: RegExp, theme: Theme, w: number, meaning: string): Sym => ({ label, re, theme, w, meaning });

// ---------- 상징 사전 ----------
const SYMBOLS: Sym[] = [
  // 동물
  S("돼지", /돼지|멧돼지/, "재물", 2, "뜻밖의 수입이나 복이 들어온다는 대표적인 재물 신호예요."),
  S("뱀", /뱀|구렁이|이무기/, "인연", 1, "귀한 인연이나 재물이 가까이 다가온다는 뜻으로 많이 풀어요."),
  S("용", /용(?!기|돈|서|도|지|품|어|건|량|감)|청룡|황룡/, "성취", 2, "크게 이름을 알리거나 오래 준비한 일이 결실을 맺는다는 의미예요."),
  S("호랑이", /호랑이|범(?!인|죄|위)/, "성취", 1, "든든한 힘이나 윗사람의 도움이 따른다는 상징이에요."),
  S("개", /강아지|개(?!미|구리|울|나리|인|월|선|발|학|업|시|그|성|미|념|최|방|별|천)|댕댕/, "관계", 1, "믿을 수 있는 친구나 동료를 가리키는 경우가 많아요."),
  S("고양이", /고양이|냥이/, "관계", 0, "애매한 관계나 속을 알 수 없는 사람을 떠올리게 하는 상징이에요."),
  S("쥐", /쥐(?!다|고|어|었|는|면)/, "불안", -1, "작은 손실이나 뒷말을 조심하라는 신호로 읽어요."),
  S("소", /황소|젖소|송아지|(^|\s)소(가|를|와|랑|의|\s)/, "재물", 1, "꾸준히 쌓아온 노력이 보상받는다는 뜻이에요."),
  S("말", /(^|\s)말(을|이|에|과|와|을\s?타)|백마|조랑말/, "변화", 1, "이동이나 새 출발이 순조롭게 진행된다는 의미예요."),
  S("물고기", /물고기|잉어|붕어|금붕어|고래|생선/, "재물", 2, "재물이나 좋은 소식, 때로는 태몽을 뜻해요."),
  S("새", /(^|\s)새(가|를|들|떼|\s)|참새|까치|비둘기|독수리|학(?!교|생|원)/, "변화", 1, "소식이나 기회가 날아든다는 상징이에요."),
  S("벌레", /벌레|바퀴벌레|구더기|지네/, "불안", -1, "자잘한 걱정거리가 쌓여 있다는 신호예요."),
  S("거미", /거미/, "관계", 0, "얽힌 관계나 차근차근 짜여 가는 계획을 뜻해요."),
  S("곰", /곰(?!곰)/, "인연", 1, "듬직한 사람을 만나거나 태몽인 경우가 많아요."),
  S("닭", /닭|병아리|달걀|계란/, "변화", 1, "새로운 시작이나 작은 이득을 알리는 상징이에요."),
  S("나비", /나비/, "인연", 1, "설레는 만남이나 기분 좋은 변화를 뜻해요."),
  // 사람
  S("조상", /조상|할머니|할아버지|돌아가신/, "관계", 1, "집안의 보살핌이나 위험을 피하게 해 주는 도움을 뜻해요."),
  S("아기", /아기|아이를\s?안|갓난/, "변화", 1, "새로 시작하는 일이나 자라나는 계획을 상징해요."),
  S("임신", /임신|태몽|출산|아이를\s?낳/, "성취", 2, "준비해 온 일이 열매를 맺는다는 길한 신호예요."),
  S("결혼", /결혼|웨딩|신부|신랑|청혼|프러포즈/, "변화", 0, "계약이나 새 출발처럼 생활이 바뀌는 시점을 뜻해요."),
  S("전 애인", /전\s?애인|전\s?남친|전\s?여친|헤어진/, "감정", -1, "지난 관계보다 지금 마음에 남은 미련이나 정리되지 않은 감정을 보여줘요."),
  S("연예인", /연예인|아이돌|배우|가수/, "성취", 1, "주목받을 일이 생기거나 인기운이 오른다는 뜻이에요."),
  S("대통령", /대통령|왕(?!따|복)|임금|회장님/, "성취", 2, "윗사람의 인정이나 큰 도움을 받는다는 의미예요."),
  S("귀신", /귀신|유령|도깨비|악마/, "불안", -2, "몸과 마음이 지쳐 불안이 커졌다는 신호예요."),
  S("도둑", /도둑|강도|괴한/, "불안", -1, "무언가를 빼앗길까 걱정하는 마음이나 실제 손실 가능성을 뜻해요."),
  S("가족", /엄마|아빠|어머니|아버지|부모|가족|형제|언니|오빠|누나|동생/, "관계", 0, "가까운 사람과의 관계나 집안일에 마음이 쓰이고 있다는 뜻이에요."),
  // 자연
  S("물", /맑은\s?물|흙탕물|(^|[^동선건괴보])물(에|이|을|속|가|\s|$)|강물|냇물|우물/, "감정", 1, "감정의 흐름이나 재물의 흐름을 뜻해요. 맑을수록 좋고 탁할수록 조심해야 해요."),
  S("바다", /바다|파도|해변|해수욕/, "변화", 1, "넓은 가능성과 큰 흐름을 상징해요."),
  S("홍수", /홍수|물난리|쓰나미|해일/, "재물", 1, "감당하기 벅찰 만큼 큰 변화나 재물이 몰려온다는 뜻이에요."),
  S("불", /불(?!안|편|만|행|법|러|가능|쌍|교|구|어|면|빛)|화재|불길|불꽃|타오르/, "재물", 2, "일이 활활 번창한다는 길한 상징이에요."),
  S("비", /(^|\s)비(가|를|에|\s)|소나기|빗물|폭우|장마/, "감정", 0, "쌓인 감정이 씻겨 나가거나 크게 흔들리는 시기를 뜻해요."),
  S("눈", /눈(이|을)?\s?(내리|오|쌓|덮)|함박눈|눈사람|눈밭/, "변화", 1, "깨끗한 새 출발과 소원 성취를 뜻해요."),
  S("해", /해(가|를)?\s?(뜨|떠|솟)|태양|햇빛|일출/, "성취", 2, "이름을 알리거나 크게 밝은 일이 생긴다는 상징이에요."),
  S("달", /(^|\s)달(이|을|빛|\s)|보름달|초승달/, "인연", 1, "소원과 인연, 조용히 차오르는 기운을 뜻해요."),
  S("별", /(^|\s)별(이|을|빛|똥|\s)|유성/, "성취", 1, "희망과 바라는 일이 이뤄질 가능성을 보여줘요."),
  S("하늘", /하늘/, "성취", 1, "목표가 높아지고 시야가 넓어진다는 의미예요."),
  S("산", /(^|\s)산(에|을|이|꼭대기|정상|\s)|등산/, "성취", 1, "목표와 도전, 올라서야 할 단계를 뜻해요."),
  S("꽃", /꽃(?!게)/, "인연", 1, "연애운과 인기운이 피어난다는 상징이에요."),
  S("나무", /나무|숲/, "성취", 1, "성장과 뿌리내림, 꾸준히 자라는 일을 뜻해요."),
  S("지진", /지진|땅이\s?(갈라|흔들)/, "변화", -1, "생활의 큰 흔들림이 다가온다는 경고예요."),
  // 몸
  S("이빨", /이빨|치아|이가\s?(빠|흔들|부러)|어금니|앞니/, "관계", -2, "가까운 사람과의 이별이나 건강 걱정을 상징해요."),
  S("머리카락", /머리카락|머리를\s?(자르|깎)|탈모|머리가\s?빠/, "변화", 0, "관계나 습관을 정리하고 새로 시작하려는 마음을 보여줘요."),
  S("피", /(^|\s)피(가|를|투성|\s)|출혈|코피/, "재물", 1, "재물이 들어오거나 막혔던 기운이 빠져나간다는 뜻이에요."),
  S("다침", /다쳤|다치|상처|부러졌/, "건강", -1, "몸과 마음에 무리가 가고 있다는 신호예요."),
  S("똥", /똥|대변|변기|배설/, "재물", 2, "묻을수록 큰 재물이 들어온다는 대표 길몽이에요."),
  S("벗은 몸", /알몸|나체|벌거/, "불안", -1, "드러나는 게 부끄럽거나 준비가 덜 됐다는 불안을 보여줘요."),
  // 사물·장소
  S("돈", /(^|[^반])돈(?!가스|까스)|지폐|동전|현금|돈다발|월급/, "재물", 1, "금전 문제나 가치에 대한 고민을 보여주는 상징이에요."),
  S("금", /(^|\s)금(을|이|덩이|반지|목걸이|괴|\s)|황금/, "재물", 2, "귀한 사람이나 큰 재물이 들어온다는 뜻이에요."),
  S("반지", /반지/, "인연", 1, "약속이나 인연이 맺어진다는 의미예요."),
  S("신발", /신발|구두|운동화/, "변화", 0, "자리 이동이나 새 출발, 때로는 이별을 뜻해요."),
  S("집", /(^|\s)집(에|이|을|안|\s)|새집|아파트|저택/, "재물", 1, "생활의 안정과 재산 상태를 보여줘요."),
  S("자동차", /자동차|(^|\s)차(를|가|에|\s)|버스|택시|운전/, "변화", 0, "인생의 방향과 속도, 내가 주도권을 쥐고 있는지를 상징해요."),
  S("기차·비행기", /기차|지하철|비행기|공항/, "변화", 1, "새로운 단계로 넘어가는 이동을 뜻해요."),
  S("시험", /시험|수능|면접|문제를\s?풀/, "불안", -1, "평가받는 상황에 대한 긴장이 드러난 꿈이에요."),
  S("학교", /학교|교실|선생님/, "성취", 0, "배움이나 아직 끝내지 못한 과제를 떠올리게 해요."),
  S("화장실", /화장실/, "변화", 0, "쌓인 것을 비워내고 정리하고 싶은 마음이에요."),
  S("거울", /거울/, "감정", 0, "나 자신을 돌아보는 시기라는 신호예요."),
  S("열쇠·문", /열쇠|(^|\s)문(을|이|\s)|대문/, "변화", 1, "새로운 기회의 문이 열린다는 상징이에요."),
  S("음식", /(^|\s)밥|음식|(?<!물)고기|과일|(^|\s)떡|케이크|먹었/, "재물", 1, "풍요와 만족, 작은 복이 채워진다는 뜻이에요."),
  S("휴대폰", /휴대폰|핸드폰|폰을|전화/, "관계", 0, "연락이나 소식을 기다리는 마음을 보여줘요."),
  S("절벽", /절벽|낭떠러지|벼랑|높은\s?곳|옥상/, "불안", -1, "발밑이 불안하다는 느낌, 지금 상황에 확신이 없다는 마음을 보여줘요."),
  S("낯선 사람", /모르는\s?사람|낯선\s?사람|모르는\s?남자|모르는\s?여자/, "불안", -1, "아직 정체를 모르는 걱정이나 새로 마주할 상황을 뜻해요."),
  S("관·시체", /시체|(^|\s)관(을|에|\s)|장례|무덤/, "재물", 1, "의외로 재물이나 일이 마무리된다는 길한 뜻으로 풀어요."),
  S("복권", /복권|로또|당첨/, "재물", 0, "기대감이 커졌다는 뜻이라 작은 행운 정도로 보는 게 좋아요."),
];

type Act = { label: string; re: RegExp; effect: number; phrase: string };
const ACTIONS: Act[] = [
  { label: "얻다", re: /주웠|줍|얻었|받았|생겼|선물/, effect: 1, phrase: "무언가를 얻는 장면은 기회를 손에 쥔다는 뜻이라 좋은 흐름이에요." },
  { label: "잃다", re: /잃어|잃었|놓쳤|도둑맞|없어졌|사라졌/, effect: -1, phrase: "무언가를 잃는 장면은 놓치고 싶지 않은 것에 대한 걱정을 보여줘요. 실제 손실보다는 마음의 부담에 가까워요." },
  { label: "쫓기다", re: /쫓기|쫓아|도망/, effect: -1, phrase: "쫓기거나 도망치는 장면은 미뤄둔 일이 마음을 누르고 있다는 신호예요." },
  { label: "날다", re: /날았|날아|날고|하늘을\s?나/, effect: 1, phrase: "하늘을 나는 장면은 답답했던 일이 풀리고 자유로워진다는 뜻이에요." },
  { label: "떨어지다", re: /떨어졌|떨어지|추락|미끄러/, effect: -1, phrase: "떨어지는 장면은 통제력을 잃을까 하는 불안이 드러난 거예요." },
  { label: "죽다", re: /죽었|죽는|죽이|죽어/, effect: 1, phrase: "죽음이 나오는 꿈은 오히려 낡은 것이 끝나고 새로 시작한다는 길한 뜻으로 많이 풀어요." },
  { label: "울다", re: /울었|울고|눈물|펑펑/, effect: 1, phrase: "꿈에서 우는 건 쌓인 감정이 풀린다는 뜻이라 깨고 나면 오히려 개운해져요." },
  { label: "싸우다", re: /싸웠|싸우|다퉜|때렸|맞았/, effect: 0, phrase: "싸우는 장면은 경쟁이나 갈등을 뜻하는데, 이겼다면 앞서고 졌다면 무리한 승부를 피하라는 메시지예요." },
  { label: "잡다", re: /잡았|붙잡|낚았/, effect: 1, phrase: "무언가를 잡는 장면은 원하는 걸 내 것으로 만든다는 뜻이에요." },
  { label: "물리다", re: /물렸|물리|깨물/, effect: 1, phrase: "물리는 장면은 기운이 강하게 들어온다는 뜻으로, 재물이나 인연이 붙는 꿈이 많아요." },
  { label: "빠지다", re: /(에|으로|속에)\s?빠졌|(에|으로)\s?빠지|빠져\s?(허우|들어)|잠겼|가라앉/, effect: -1, phrase: "어딘가에 빠지는 장면은 감정적으로 지쳐 있다는 신호예요." },
  { label: "헤매다", re: /헤맸|길을\s?잃|못\s?찾/, effect: -1, phrase: "헤매는 장면은 방향을 고민하고 있다는 뜻이에요." },
  { label: "이사", re: /이사|짐을\s?(싸|옮)/, effect: 1, phrase: "이사하는 장면은 환경이 바뀌며 새 기회가 열린다는 의미예요." },
];

type Emo = { label: string; re: RegExp; effect: number };
const EMOTIONS: Emo[] = [
  { label: "무서움", re: /무서|무섭|공포|소름|섬뜩|겁/, effect: -1 },
  { label: "불안", re: /불안|초조|답답|긴장|조마/, effect: -1 },
  { label: "슬픔", re: /슬펐|슬프|서러|우울|허전/, effect: -1 },
  { label: "기쁨", re: /기뻤|기쁘|행복|좋았|신났|설레|뿌듯|웃었/, effect: 1 },
  { label: "편안함", re: /편안|평화|따뜻|포근|귀여|아름다/, effect: 1 },
  { label: "놀람", re: /놀랐|깜짝/, effect: 0 },
];

/** "무섭지 않고", "안 무서웠어요"처럼 부정된 감정은 건너뛴다 */
function findEmotion(t: string): Emo | null {
  let best: { e: Emo; at: number } | null = null;
  for (const e of EMOTIONS) {
    const re = new RegExp(e.re.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      const before = t.slice(Math.max(0, m.index - 3), m.index);
      const after = t.slice(m.index, m.index + m[0].length + 5);
      const negated = /안\s?$|못\s?$/.test(before) || /지\s?(않|않았|못)/.test(after);
      if (!negated && (!best || m.index < best.at)) best = { e, at: m.index };
      if (!negated) break;
    }
  }
  return best?.e ?? null;
}

const THEME_LINE: Record<Theme, string> = {
  재물: "돈과 관련된 기회나 결정이 가까이 와 있을 가능성이 커요.",
  인연: "새로운 사람과의 만남이나 관계의 진전이 기대되는 흐름이에요.",
  성취: "노력해 온 일이 인정받거나 한 단계 올라설 시기가 다가오고 있어요.",
  변화: "생활이나 마음가짐에 변화가 찾아오는 시기예요.",
  건강: "몸과 마음의 컨디션을 먼저 챙겨야 할 때라는 신호예요.",
  감정: "요즘 마음속 감정이 크게 움직이고 있다는 뜻이에요.",
  불안: "해결되지 않은 걱정이 마음 한쪽에 남아 있다는 신호예요.",
  관계: "가까운 사람과의 관계에 마음이 많이 쓰이고 있다는 뜻이에요.",
};

const ADVICE: Record<Luck, Partial<Record<Theme, string>> & { _: string }> = {
  good: {
    재물: "들어오는 기회는 잡되, 큰돈은 하루 더 생각하고 움직여요.",
    인연: "오늘 만나는 사람에게 먼저 한마디 건네 보세요.",
    성취: "미뤄둔 지원서나 제안, 오늘 보내기 좋아요.",
    _: "좋은 기운이 들어오는 날이에요. 망설이던 일을 한 걸음 시작해 보세요.",
  },
  mid: {
    변화: "작은 것 하나만 바꿔 보세요. 책상 정리도 충분해요.",
    관계: "오랜만에 안부 메시지 하나 보내 보세요.",
    _: "흐름은 무난해요. 계획대로 차근차근 가면 충분해요.",
  },
  bad: {
    불안: "걱정되는 일을 종이에 적어 보세요. 생각보다 작아 보일 거예요.",
    건강: "오늘은 일찍 자고 물을 자주 마셔 주세요.",
    관계: "말은 한 번 더 고르고, 서운한 마음은 직접 짧게 전해요.",
    _: "꿈은 경고일 뿐 예언이 아니에요. 무리한 결정만 하루 미뤄요.",
  },
};

export type Interpretation = {
  score: number;
  luck: Luck;
  luckLabel: string;
  symbols: { label: string; theme: Theme; w: number }[];
  actions: string[];
  emotion: string | null;
  sentences: string[];
  advice: string;
  similar: Dream[];
  matched: boolean;
};

const gwa = (w: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00;
  return c >= 0 && c < 11172 && c % 28 ? "과" : "와";
};
const q = (w: string) => `'${w}'`;

/** 상징 라벨이 마지막 글자(따옴표 안)의 받침을 따르도록 */
const tail = (w: string) => w.replace(/[·\s].*$/, "") || w;

export function interpretDream(text: string): Interpretation {
  const t = text.replace(/\s+/g, " ").trim();
  const syms: (Sym & { at: number })[] = [];
  for (const s of SYMBOLS) {
    const m = s.re.exec(t);
    if (m) syms.push({ ...s, at: m.index });
  }
  syms.sort((a, b) => a.at - b.at);
  const top = syms.slice(0, 4);
  const acts = ACTIONS.filter((a) => a.re.test(t)).slice(0, 2);
  const emo = findEmotion(t);

  const symSum = top.reduce((s, x) => s + x.w, 0);
  const actSum = acts.reduce((s, x) => s + x.effect, 0);
  const raw = 52 + symSum * 8 + actSum * 6 + (emo ? emo.effect * 5 : 0);
  const score = Math.round(clamp(raw, 8, 96));
  const luck: Luck = score >= 63 ? "good" : score <= 40 ? "bad" : "mid";
  const luckLabel = luck === "good" ? "길몽" : luck === "bad" ? "주의" : "보통";

  // 비슷한 꿈: 상징 단어가 제목에 들어간 꿈 + 기존 매칭
  const scored = new Map<number, number>();
  // 제목 전체가 문장에 들어 있으면 강하게, 첫 단어만 겹치면("커다란" 등) 약하게
  for (const d of matchDreams(t)) scored.set(d.id, t.includes(dreamKey(d).core) ? 4 : 0.5);
  for (const x of acts) for (const d of DREAMS) if (x.re.test(d.title)) scored.set(d.id, (scored.get(d.id) ?? 0) + 1);
  for (const s of top) {
    for (const d of DREAMS) if (s.re.test(d.title)) scored.set(d.id, (scored.get(d.id) ?? 0) + 1 + (acts.some((a) => a.re.test(d.title)) ? 1 : 0));
  }
  const similar = [...scored.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 3)
    .map(([id]) => DREAMS.find((d) => d.id === id)!)
    .filter(Boolean);

  const r = seedOf(t);
  const sentences: string[] = [];

  if (!top.length) {
    if (acts.length) {
      sentences.push("이 꿈은 등장한 대상보다 장면 자체가 메시지인 꿈이에요.");
      acts.forEach((x) => sentences.push(x.phrase));
    } else {
      sentences.push("꿈 이야기에서 사전에 있는 상징을 찾지 못했어요.");
    }
    if (emo) sentences.push(emo.effect < 0 ? `꿈속에서 느낀 ${emo.label}${iga(emo.label)} 지금 마음 상태를 비춰 주는 것일 수 있어요.` : `꿈속의 ${emo.label}${eun(emo.label)} 요즘 마음에 여유가 생겼다는 뜻으로 볼 수 있어요.`);
    sentences.push("동물, 장소, 사람처럼 꿈에 나온 대상을 한두 개 더 적어 주면 더 자세히 풀 수 있어요.");
    const advice = acts.length ? ADVICE[luck].불안 ?? ADVICE[luck]._ : ADVICE[luck]._;
    return { score, luck, luckLabel, symbols: [], actions: acts.map((a) => a.label), emotion: emo?.label ?? null, sentences: sentences.slice(0, 5), advice, similar, matched: acts.length > 0 };
  }

  const [a, b, c] = top;
  sentences.push(`이 꿈의 중심 상징은 ${q(a.label)}${yeyo(tail(a.label))}. ${a.meaning}`);
  if (b) {
    const lead = pickR(r, ["함께 나온", "여기에 등장한", "같이 보인"]);
    sentences.push(`${lead} ${q(b.label)}${eun(tail(b.label))} ${b.meaning}`);
  }
  if (c) sentences.push(`${q(c.label)}까지 겹쳐서 꿈의 메시지가 더 또렷해졌어요.`);

  // 주된 주제: 가중치 절댓값이 큰 쪽
  const themeScore: Partial<Record<Theme, number>> = {};
  top.forEach((s, i) => { themeScore[s.theme] = (themeScore[s.theme] ?? 0) + Math.abs(s.w) + 1 + (i === 0 ? 1 : 0); });
  const theme = (Object.entries(themeScore).sort((x, y) => (y[1] ?? 0) - (x[1] ?? 0))[0][0]) as Theme;
  if (b && b.theme !== a.theme) {
    sentences.push(`${a.theme}${gwa(a.theme)} ${b.theme}의 기운이 함께 움직이는 꿈이라, ${THEME_LINE[theme]}`);
  } else {
    sentences.push(THEME_LINE[theme]);
  }

  if (acts.length) sentences.push(acts[0].phrase);

  if (emo) {
    const symGood = symSum + actSum > 0;
    if (emo.effect < 0 && symGood) sentences.push(`꿈속에서 ${emo.label}${iga(emo.label)} 컸더라도 상징 자체는 좋은 쪽이라 크게 걱정하지 않아도 돼요.`);
    else if (emo.effect < 0) sentences.push(`꿈속의 ${emo.label}${eun(emo.label)} 지금 쌓인 긴장을 그대로 보여주는 거예요. 쉬어 가라는 신호로 받아들여 주세요.`);
    else if (emo.effect > 0 && !symGood) sentences.push(`그래도 꿈에서 ${emo.label}${iga(emo.label)} 느껴졌다면 걱정했던 일이 생각보다 순하게 지나갈 가능성이 커요.`);
    else if (emo.effect > 0) sentences.push(`꿈에서 느낀 ${emo.label}까지 더해져서 기운이 한층 밝아요.`);
  }

  const advice = ADVICE[luck][theme] ?? ADVICE[luck]._;
  return {
    score, luck, luckLabel,
    symbols: top.map((s) => ({ label: s.label, theme: s.theme, w: s.w })),
    actions: acts.map((x) => x.label),
    emotion: emo?.label ?? null,
    sentences: sentences.slice(0, 5),
    advice,
    similar,
    matched: true,
  };
}

export const SYMBOL_COUNT = SYMBOLS.length;
