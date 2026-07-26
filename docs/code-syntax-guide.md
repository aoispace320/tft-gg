# tft-gg 코드 문법 해설

> `backend/app/services/riot_live.py`, `main.py`, `dataset.py`, `cli.py` 에 실제로 쓰인
> 파이썬 구문을 **문법 / 동작 원리 / 왜 이걸 골랐는지** 관점에서 정리한 문서.

## 목차

1. [`next(genexp, default)` — 지연 평가 + 조기 종료](#1-nextgenexp-default--지연-평가--조기-종료)
2. [데코레이터 — `@app.get`, `@lru_cache`](#2-데코레이터--appget-lru_cache)
3. [`or` / `and` 의 단축 평가](#3-or--and-의-단축-평가--불리언이-아니라-피연산자를-반환한다)
4. [`str.partition()` vs `str.split()`](#4-strpartition-vs-strsplit--반환-아리티arity의-안정성)
5. [키워드 전용 인자 `*`](#5-키워드-전용-인자--하나가-하는-일)
6. [가변 기본값 함정과 `dict | None`](#6-가변-기본값-함정--paramsdict--none--none-을-쓴-이유)
7. [클로저 — 셀 객체와 늦은 바인딩](#7-클로저--중첩-함수가-바깥-변수를-잡는-방식)
8. [`with` 문 — 컨텍스트 매니저 프로토콜](#8-with-문--컨텍스트-매니저-프로토콜)
9. [스레드 풀과 GIL](#9-스레드-풀과-gil--왜-여기선-스레드가-효과가-있나)
10. [예외 — 커스텀 클래스와 계층 변환](#10-예외--커스텀-예외-클래스와-계층-변환)
11. [`global` — 이름 바인딩의 스코프 규칙](#11-global--이름-바인딩의-스코프-규칙)
12. [`_cached()` 동시성 분석](#12-_cached--직접-만든-ttl-캐시의-동시성-분석)
13. [컴프리헨션 — 문법, 스코프, 성능](#13-컴프리헨션--문법-스코프-성능)
14. [`sorted()` — key, 안정성, reverse](#14-sorted--key-안정성-reverse)
15. [딕셔너리 디스패치](#15-딕셔너리-디스패치--ifelif-체인을-자료구조로)
16. [딕셔너리 언패킹 `{**e, ...}`](#16-딕셔너리-언패킹-e-_tier-)
17. [조건 표현식과 튜플 리터럴의 함정](#17-조건-표현식삼항-연산자와-튜플-리터럴의-함정)
18. [`re.sub()` — 정규식 폴백](#18-resub--정규식-폴백)
19. [`enumerate()`](#19-enumerate--인덱스와-값을-함께)
20. [문자열 메서드와 f-string](#20-문자열-메서드와-f-string)
21. [모듈 임포트와 순환 참조 회피](#21-모듈-임포트와-순환-참조-회피)
22. [종합 — `summoner_profile()` 전체 읽기](#22-종합--summoner_profile-전체를-문법-관점에서-다시-읽기)
23. [개선 여지](#23-개선-여지-정직하게)

---

## 1. `next(genexp, default)` — 지연 평가 + 조기 종료

### 실제 쓴 코드

```python
me = next((p for p in info.get("participants", []) if p.get("puuid") == puuid), None)
```

### 문법 분해

#### ① 안쪽: 제너레이터 표현식 (generator expression)

```python
(p for p in participants if p.get("puuid") == puuid)
```

이건 **리스트가 아니다.** `generator` 객체다. 실행 시점에 원소를 만들지 않고, **요청받을 때마다 하나씩** 만든다.

```python
>>> g = (x*2 for x in range(1000000))
>>> g
<generator object <genexpr> at 0x...>   # 아직 아무것도 계산 안 됨
>>> next(g)
0                                        # 이제서야 첫 개 계산
```

제너레이터는 **이터레이터 프로토콜**을 구현한다:

- `__iter__()` → 자기 자신 반환
- `__next__()` → 다음 값 반환, 없으면 `StopIteration` 예외 발생

#### ② 바깥: `next(iterator, default)`

`next()`의 시그니처는 두 가지다.

```python
next(iterator)            # 소진 시 StopIteration 예외
next(iterator, default)   # 소진 시 default 반환 (예외 삼킴)
```

두 번째 인자를 주면 내부적으로 이렇게 동작한다.

```python
# next(it, default) 의 개념적 구현
try:
    return it.__next__()
except StopIteration:
    return default
```

#### ③ 괄호가 필요한 이유

```python
next(p for p in xs if cond)          # OK — 제너레이터가 유일한 인자면 괄호 생략 가능
next((p for p in xs if cond), None)  # 필수 — 인자가 2개면 괄호로 감싸야 함
```

인자가 둘 이상이면 파서가 `,`를 **인자 구분자**로 해석하기 때문에 제너레이터를 괄호로 명시해야 한다. 안 그러면 `SyntaxError`.

### 왜 이 흐름에서 이걸 썼나

TFT 한 매치의 `participants`는 **8명**이다. 그중 나를 찾아야 한다.

#### 대안 비교

```python
# (A) for + break — 원본 f48fe45 방식
my_placement = None
for player in participants:
    if player.get("puuid") == puuid:
        my_placement = player.get("placement")
        break

# (B) 리스트 컴프리헨션
me = [p for p in participants if p.get("puuid") == puuid][0]

# (C) filter + next
me = next(filter(lambda p: p.get("puuid") == puuid, participants), None)

# (D) 내가 쓴 것
me = next((p for p in participants if p.get("puuid") == puuid), None)
```

| | 전체 순회? | 못 찾으면 | 임시 변수 | 평가 |
|---|---|---|---|---|
| (A) | 아니오 (조기 종료) | `None` 유지 | 2개 필요 | 안전하지만 장황 |
| (B) | **예 (전부 순회)** | **`IndexError`** | 리스트 전체 생성 | **최악** |
| (C) | 아니오 | `None` | 없음 | `lambda` 오버헤드 |
| (D) | 아니오 | `None` | 없음 | 채택 |

**(B)가 나쁜 이유**: 8명 전부 검사해서 리스트를 만들고, 못 찾으면 빈 리스트에 `[0]` → `IndexError`. 시간복잡도도 항상 O(n)이고, 공간도 O(k) 추가로 쓴다.

**(D)** 는 첫 매치에서 즉시 반환되므로 **평균 O(n/2), 최선 O(1)**, 추가 공간 O(1).

### 설계 의도

`None`을 기본값으로 준 건 **"내가 없을 수도 있다"** 는 도메인 지식 때문이다. Riot API가 리메이크/데이터 이상으로 참가자 목록에 내가 없는 경우가 실제로 있다. 그래서 바로 뒤에:

```python
if not me:
    return None      # 이 매치는 건너뛴다
```

`next()`가 예외를 던졌다면 `try/except StopIteration`으로 감싸야 했을 텐데, **정상 흐름을 예외로 처리하는 건 안티패턴**이다. 기본값 인자가 이걸 우아하게 해결한다.

### 같은 패턴을 한 번 더 쓴 곳

```python
solo = next((e for e in entries if e.get("queueType") == "RANKED_TFT"), None)
chosen = solo or (entries[0] if entries else {})
```

솔로랭크 항목을 찾되, 없으면 `None` → 다음 줄에서 폴백. **`or`의 단축 평가**와 조합했다 (3번 참조).

---

## 2. 데코레이터 — `@app.get`, `@lru_cache`

### 문법의 실체

```python
@decorator
def f(): ...
```

는 **정확히** 아래와 동치다.

```python
def f(): ...
f = decorator(f)
```

즉 데코레이터는 **함수를 인자로 받아 함수를 반환하는 고차 함수**다.

### `@lru_cache(maxsize=1)` — 인자를 받는 데코레이터

```python
@lru_cache(maxsize=1)
def _df() -> pd.DataFrame:
    return pd.read_csv(_CSV)
```

`@` 뒤에 **호출**이 붙었다는 게 포인트다. 2단계로 풀린다.

```python
deco = lru_cache(maxsize=1)   # ① 데코레이터 팩토리 호출 → 데코레이터 반환
_df  = deco(_df)              # ② 실제 데코레이팅
```

#### 내부 동작

`lru_cache`는 인자 튜플을 **딕셔너리 키**로 쓴다.

```python
key = args + tuple(sorted(kwargs.items()))
if key in cache: return cache[key]
result = func(*args, **kwargs); cache[key] = result
```

**→ 중요한 제약**: 인자가 **해시 가능(hashable)** 해야 한다. `list`, `dict`, `set`을 인자로 받는 함수엔 `lru_cache`를 못 쓴다 (`TypeError: unhashable type`).

이 프로젝트의 `_df()`, `_compute_comps()`는 **인자가 0개**다. 인자 0개면 키가 항상 빈 튜플 `()` 하나뿐이라 → **사실상 "한 번만 실행하고 영구 메모이제이션"** 이 된다. `maxsize=1`이 딱 맞는 이유.

### 실제로 부딪힌 함정

원래 코드는 이랬다.

```python
@lru_cache(maxsize=1)
def compute_statistics() -> dict:
    df = _df()          # CSV 없으면 예외
    ...
```

"데이터 없으면 빈 값 반환"으로 바꾸면 이렇게 된다.

```python
@lru_cache(maxsize=1)
def compute_statistics() -> dict:
    if not has_data():
        return {...빈 값...}    # ← 이게 캐시에 박제됨
    ...
```

**부작용(side effect)에 의존하는 함수를 메모이제이션하면 안 되는** 전형적 사례다. `has_data()`는 **파일시스템 상태**를 읽는다 — 순수 함수(pure function)가 아니다. 같은 입력(없음)에 대해 시점에 따라 다른 답이 나와야 하는데, `lru_cache`는 **참조 투명성(referential transparency)** 을 가정한다.

#### 해결: 순수한 부분만 캐싱

```python
def compute_statistics() -> dict:        # 캐시 없음 — 매번 파일 확인 (부수효과 계층)
    if not has_data():
        return {...빈 값...}
    return _compute_statistics()

@lru_cache(maxsize=1)
def _compute_statistics() -> dict:       # 캐시 있음 — 순수 계산 (순수 계층)
    df = _df()
    ...
```

**부수효과가 있는 얇은 껍데기 / 순수한 무거운 코어**로 분리한 것. 함수형 프로그래밍의 *functional core, imperative shell* 패턴과 같은 구조다.

이 덕분에 CSV가 나중에 생기면 **서버 재시작 없이** 자동 전환된다 (실험으로 확인함).

### `@app.get("/api/...")` — 등록형 데코레이터

```python
@app.get("/api/summoner/{region}/{name}")
def summoner(region: str, name: str): ...
```

이건 함수를 **감싸지 않는다.** FastAPI 내부 라우팅 테이블에 `("GET", "/api/summoner/{region}/{name}") → summoner` 를 **등록만** 하고 원본 함수를 그대로 반환한다.

#### 여기서 타입 힌트가 진짜로 동작한다

```python
def leaderboard(region: str = "kr", tier: str = "all", page: int = 1):
```

보통 파이썬 타입 힌트는 **런타임에 아무 강제력이 없다.** 그런데 FastAPI는 `inspect.signature()`로 시그니처를 읽고 `typing.get_type_hints()`로 어노테이션을 뽑아 **Pydantic 검증기를 동적 생성**한다.

그래서 `?page=abc` 로 요청하면:

```json
{"detail":[{"type":"int_parsing","loc":["query","page"],...}]}   // 422
```

**어노테이션이 메타데이터로 소비되는** 사례다. 파이썬의 어노테이션은 `__annotations__` 딕셔너리에 저장될 뿐이고, **누가 읽어서 뭘 하느냐**가 전부다.

#### 경로 파라미터 vs 쿼리 파라미터 구분 규칙

```python
@app.get("/api/summoner/{region}/{name}")
def summoner(region: str, name: str):        # 경로에 {}가 있음 → path param

@app.get("/api/leaderboard")
def leaderboard(region: str = "kr", ...):    # 경로에 없음 → query param
```

FastAPI는 **경로 문자열에 `{이름}`이 있으면 경로 변수, 없으면 쿼리 변수**로 자동 판별한다.

---

## 3. `or` / `and` 의 단축 평가 — 불리언이 아니라 피연산자를 반환한다

### 파이썬의 핵심 특성

C나 Java와 **결정적으로 다르다.**

```c
// C: 결과는 int 0 or 1
int r = a || b;
```

```python
# Python: 결과는 a 또는 b 그 자체
r = a or b
```

정확한 의미론:

```python
a or b    ≡   a if bool(a) else b       # a가 truthy면 a를 그대로 반환
a and b   ≡   b if bool(a) else a
```

### 실제 쓴 곳 ①

```python
return game_name, (tag_line or DEFAULT_TAGS.get(region, "KR1"))
```

`tag_line`이 `""`(빈 문자열, falsy)이면 → `"KR1"` 반환.
`tag_line`이 `"0213"`이면 → `"0213"` 그대로 반환.

`"페이커#"` 처럼 `#`만 치고 태그를 안 쓴 경우를 한 줄로 처리한다.

### 실제 쓴 곳 ②

```python
queue_id = info.get("queue_id") or info.get("queueId")
```

Riot API는 **버전에 따라 필드명이 다르다** (snake_case ↔ camelCase). 앞이 `None`이면 뒤를 본다.

### 숨은 버그 가능성

`or`는 **falsy 전체**를 걸러낸다. 파이썬의 falsy 값:

```
None, False, 0, 0.0, "", [], {}, set(), ()
```

즉 `queue_id`가 **정수 `0`** 이면 `or` 뒤로 넘어간다. 다행히 TFT queue_id는 1090~1220이라 0이 없다. 하지만 일반화하면 위험하다.

**엄밀히 하려면** "None인지"만 봐야 한다.

```python
queue_id = info.get("queue_id")
if queue_id is None:
    queue_id = info.get("queueId")
```

같은 이유로 이 줄도 마찬가지다.

```python
played_ms = info.get("game_datetime") or 0
```

`game_datetime`이 0이면 어차피 0이라 결과는 같다. 의도한 폴백과 우연히 일치하는 케이스.

### `dict.get(key, default)` 와의 차이

```python
d.get("k", "기본값")     # 키가 없을 때만 기본값
d.get("k") or "기본값"   # 키가 없거나 값이 falsy일 때 기본값
```

`{"k": ""}` 에 대해 전자는 `""`, 후자는 `"기본값"`. **의미가 다르다.** "값이 비어도 폴백"을 원한 곳에 `or`를 썼다.

---

## 4. `str.partition()` vs `str.split()` — 반환 아리티(arity)의 안정성

### 원본 f48fe45 코드의 버그

```python
parts = riot_id.split('#')
gameName = parts[0]
tagLine  = parts[1]      # IndexError
```

`split()`은 **가변 길이 리스트**를 반환한다.

| 입력 | `split('#')` 결과 | 길이 |
|---|---|---|
| `"a#b"` | `['a', 'b']` | 2 |
| `"a"` | `['a']` | **1** ← `parts[1]` 폭발 |
| `"a#b#c"` | `['a','b','c']` | 3 |

**언패킹 아리티가 입력에 의존**하는 게 근본 문제다.

### `partition()` 은 항상 3-튜플

```python
game_name, _, tag_line = text.partition("#")
```

| 입력 | `partition('#')` |
|---|---|
| `"a#b"` | `('a', '#', 'b')` |
| `"a"` | `('a', '', '')` ← **구분자 없어도 3개** |
| `"a#b#c"` | `('a', '#', 'b#c')` ← 첫 번째만 분리 |

**항상 정확히 3개**를 반환하므로 튜플 언패킹이 **절대 실패하지 않는다.** 아리티가 타입에 고정된 것.

세 번째 케이스도 의미가 있다 — 이름에 `#`이 들어가도 **첫 `#`만** 구분자로 쓰고 나머지는 태그에 붙는다.

### `_` 언더스코어 변수

```python
game_name, _, tag_line = text.partition("#")
```

`_`는 **문법적으로 특별하지 않다.** 평범한 변수명이다. "이 값 안 쓴다"는 **관례(convention)** 일 뿐.

(REPL에서 `_`가 마지막 결과를 담는 건 인터프리터 기능이지 언어 문법이 아니다.)

### 아리티가 고정된 형제들

```python
"a#b".rpartition("#")   # 오른쪽부터 — ('a', '#', 'b')
"a#b#c".split("#", 1)   # maxsplit — ['a', 'b#c'] (하지만 여전히 가변)
```

---

## 5. 키워드 전용 인자 — `*` 하나가 하는 일

```python
def _get(url: str, params: dict | None = None, *, retries: int = 3):
```

### `*` 의 의미

이 위치의 벌거벗은 `*`는 **"여기부터는 위치 인자로 못 준다"** 는 경계선이다 (PEP 3102).

```python
_get(url, params, 5)          # TypeError: takes 2 positional arguments but 3 were given
_get(url, params, retries=5)  # OK
```

### 왜 이렇게 했나

`retries=3`은 **튜닝 파라미터**다. 호출부에서 `_get(url, p, 5)` 라고 쓰면 **5가 뭔지 읽는 사람이 모른다.** 강제로 `retries=5`라고 쓰게 만들면 호출부가 자기설명적(self-documenting)이 된다.

또한 **시그니처 진화에 안전**하다. 나중에 `_get(url, params, *, timeout=10, retries=3)` 처럼 앞에 인자를 끼워넣어도 기존 호출부가 안 깨진다. 위치 인자였다면 전부 깨진다.

### 가변 인자 3형제 정리

```python
def f(a, /, b, *, c):
    #    ↑     ↑
    #    │     └─ c는 키워드 전용
    #    └─ a는 위치 전용 (PEP 570, 3.8+)
```

| 구문 | 의미 |
|---|---|
| `def f(a, /, b)` | `a`는 **위치 전용** (`f(a=1)` 불가) |
| `def f(a, *, b)` | `b`는 **키워드 전용** |
| `def f(*args)` | 남는 위치 인자를 튜플로 |
| `def f(**kwargs)` | 남는 키워드 인자를 딕셔너리로 |

---

## 6. 가변 기본값 함정 — `params: dict | None = None` 을 쓴 이유

```python
def _get(url, params: dict | None = None, ...):
```

`params={}` 라고 쓰지 않은 건 **의도적**이다.

### 함정의 원리

**기본값은 함수 정의 시점에 딱 한 번 평가되어 함수 객체에 붙는다.**

```python
def bad(items=[]):        # 리스트 객체가 '하나' 생성됨
    items.append(1)
    return items

>>> bad()
[1]
>>> bad()
[1, 1]      # 같은 리스트를 계속 재사용
>>> bad.__defaults__
([1, 1],)   # 함수 객체에 박혀 있음
```

기본값은 `func.__defaults__` 튜플에 저장된다. 호출할 때마다 새로 만들어지지 않는다.

`None`을 센티넬(sentinel)로 쓰고 함수 본문에서 분기하는 게 표준 관용구다.

```python
def good(items=None):
    if items is None:
        items = []      # 호출마다 새 객체
```

`_get`은 `params`를 **읽기만** 하고 변경하지 않아서 실제 버그는 안 나지만, **관용구를 지키는 게** 나중에 누가 `params["x"]=1` 을 추가해도 안전하다.

### `dict | None` 문법

PEP 604 (Python 3.10+). `typing.Optional[dict]` = `typing.Union[dict, None]` 과 동일하다.

```python
dict | None          # 3.10+
Optional[dict]       # 구버전
```

런타임에 `|`는 `types.UnionType` 객체를 만든다. `isinstance(x, dict | None)` 도 실제로 동작한다 (3.10+).

### `from __future__ import annotations`

파일 맨 위에 넣은 이 줄은 PEP 563이다. **모든 어노테이션을 문자열로 지연 평가**한다.

```python
# 이 import 없이 Python 3.9에서
def f() -> dict | None: ...    # TypeError: unsupported operand type(s) for |

# 이 import 가 있으면
def f() -> dict | None: ...    # 어노테이션이 "dict | None" 문자열로만 저장됨
```

효과:

- 신문법을 구버전 인터프리터에서 쓸 수 있음
- 어노테이션 평가 비용 제거 (임포트 속도)
- 전방 참조(forward reference)에 따옴표 불필요

대신 런타임에 어노테이션을 실제로 쓰려면 `typing.get_type_hints()`로 해석해야 한다.

---

## 7. 클로저 — 중첩 함수가 바깥 변수를 잡는 방식

### 실제 쓴 코드

```python
def summoner_profile(region, raw_name, match_count=10):
    game_name, tag_line = split_riot_id(raw_name, region)

    def build() -> dict:                      # ← 클로저 1
        account = account_by_riot_id(game_name, tag_line, region)
        puuid = account.get("puuid")

        def one(mid: str) -> dict | None:     # ← 클로저 2 (중첩의 중첩)
            detail = match_detail(mid, region)
            me = next((p for p in ... if p.get("puuid") == puuid), None)
            ...

        with ThreadPoolExecutor(max_workers=5) as pool:
            matches = [m for m in pool.map(one, ids) if m]

    return _cached(f"summoner:...", 60.0, build)   # 함수 '객체'를 넘김
```

### 동작 원리 — 셀(cell) 객체

`one`은 `puuid`, `region`을 **값으로 복사하지 않는다.** 파이썬은 `cell` 객체를 만들어 **참조**를 공유한다.

```python
>>> one.__closure__
(<cell at 0x...: str object at 0x...>, <cell at 0x...: str object>)
>>> one.__code__.co_freevars
('puuid', 'region')      # 자유 변수 목록
```

- `co_freevars`: 이 함수가 바깥에서 잡아온 변수 이름
- `__closure__`: 그 변수들을 담은 셀 튜플

**바깥 함수가 반환된 뒤에도** 셀이 살아있어서 값에 접근할 수 있다. 이게 클로저의 본질이다.

### 왜 클로저를 썼나 — 대안 비교

```python
# (A) 클로저 — 채택
def one(mid): ...            # puuid, region 자동 캡처
pool.map(one, ids)

# (B) functools.partial
def one(mid, puuid, region): ...
pool.map(partial(one, puuid=puuid, region=region), ids)

# (C) 튜플로 묶어 전달
pool.map(one, [(mid, puuid, region) for mid in ids])   # 언패킹 필요
```

`pool.map(fn, iterable)`은 **인자 1개짜리 함수**만 받는다. 추가 컨텍스트(`puuid`, `region`)를 넘기려면 셋 중 하나가 필요하다. (A)가 가장 간결하고, 캡처 변수가 읽기 전용이라 안전하다.

### 늦은 바인딩(late binding) 함정

클로저는 **값이 아니라 이름**을 잡는다. 반복문에서 클로저를 만들면 유명한 버그가 난다.

```python
fns = [lambda: i for i in range(3)]
[f() for f in fns]      # [2, 2, 2]   (0,1,2 아님)
```

셋 다 **같은 셀**을 보고 있고, 루프가 끝난 시점의 `i=2`를 읽는다.

이 코드에서 밟을 뻔한 곳:

```python
account = _cached(f"account:{region}:{puuid}", 3600.0,
                  lambda: account_by_puuid(puuid, region))
```

이 `lambda`는 `puuid`를 캡처한다. **하지만 안전하다** — `puuid`가 `resolve()` 함수의 **지역 변수**이고, `resolve`는 각 항목마다 **독립된 프레임**으로 호출되기 때문이다. 각 호출이 자기만의 셀을 가진다.

만약 저걸 루프 안에서 만들었다면 전부 마지막 `puuid`를 봤을 것이다. 회피법은 기본 인자로 즉시 바인딩:

```python
lambda p=puuid: account_by_puuid(p, region)   # 정의 시점에 값 고정
```

### `build`를 호출하지 않고 넘긴 이유

```python
return _cached(key, 60.0, build)     # build() 가 아니라 build
```

괄호가 없으면 **함수 객체 자체**다. `_cached` 안에서:

```python
if hit and now - hit[0] < ttl:
    return hit[1]        # 캐시 히트 → producer 호출 안 함
value = producer()       # 캐시 미스일 때만 호출
```

**지연 실행(lazy evaluation)** 을 구현한 것. `build()`로 넘겼다면 캐시 히트든 미스든 **항상 Riot API를 때렸을** 것이다. 캐시의 존재 의미가 사라진다.

이게 **thunk** 패턴이다 — 계산을 값이 아닌 "계산 자체"로 전달.

---

## 8. `with` 문 — 컨텍스트 매니저 프로토콜

### 문법의 의미론

```python
with expr as var:
    body
```

는 아래로 **정확히** 디슈가링(desugaring)된다.

```python
mgr = expr
var = type(mgr).__enter__(mgr)
try:
    body
finally:
    type(mgr).__exit__(mgr, *sys.exc_info())
```

핵심은 **`finally`** 다. body에서 예외가 나든, `return`하든, `break`하든 `__exit__`이 **반드시** 실행된다.

### 쓴 곳 ① — `threading.Lock`

```python
with _cache_lock:
    hit = _cache.get(key)
    if hit and now - hit[0] < ttl:
        return hit[1]        # ← 여기서 return 해도 락은 풀린다
```

`Lock.__enter__` = `acquire()`, `Lock.__exit__` = `release()`.

**`return`으로 탈출해도 `finally`가 `release()`를 호출**한다. `with` 없이 수동으로 짰다면:

```python
_cache_lock.acquire()
hit = _cache.get(key)
if hit:
    return hit[1]            # 데드락 — release 영원히 안 됨
_cache_lock.release()
```

### 쓴 곳 ② — `ThreadPoolExecutor`

```python
with ThreadPoolExecutor(max_workers=5) as pool:
    matches = [m for m in pool.map(one, ids) if m]
```

`Executor.__exit__`은 **`shutdown(wait=True)`** 를 호출한다. 즉 **블록을 나갈 때 모든 워커가 끝날 때까지 대기**한다.

이게 없으면 스레드가 아직 일하는 중인데 다음 코드로 넘어가서 **불완전한 결과**를 쓰게 된다. `with`가 **동기화 장벽(barrier)** 역할을 한다.

---

## 9. 스레드 풀과 GIL — 왜 여기선 스레드가 효과가 있나

```python
with ThreadPoolExecutor(max_workers=5) as pool:
    matches = [m for m in pool.map(one, ids) if m]
```

### GIL의 정확한 의미

CPython은 **GIL(Global Interpreter Lock)** 때문에 **한 순간에 하나의 스레드만 바이트코드를 실행**한다. 그래서 "파이썬 스레드는 소용없다"는 말이 돈다.

**하지만 그건 CPU 바운드 작업 얘기다.**

GIL은 다음 상황에서 **해제**된다.

- I/O 시스템 콜 진입 시 (`socket.recv`, `read`, `write` …)
- `time.sleep()`
- 일부 C 확장이 명시적으로 놓을 때

```
스레드1: [GIL] 요청전송 → [GIL 해제] ...네트워크 대기... → [GIL] 응답파싱
스레드2:              [GIL] 요청전송 → [GIL 해제] ...대기...
스레드3:                        [GIL] 요청전송 → [GIL 해제] ...
```

HTTP 요청은 **99% 이상이 네트워크 대기 시간**이다. 대기 중엔 GIL을 놓고 있으므로 다른 스레드가 자유롭게 요청을 쏜다. **I/O 바운드에선 스레드가 거의 선형으로 스케일한다.**

### 실제 효과 계산

- 요청 1건 왕복 지연 ≈ 200ms (한국↔Riot 아시아 서버)
- 매치 10건 순차: `10 × 200ms = 2000ms`
- 5개 동시: `⌈10/5⌉ × 200ms = 400ms`

**여기가 결정적**: 프론트엔드 `api/client.ts`에 `timeout: 10_000` (10초)이 걸려 있다. 계정 조회 + 소환사 조회 + 매치 목록 + 매치 10건 + 리그 조회 = **14회 요청**. 순차 처리에 레이트리밋 대기까지 겹치면 10초를 넘겨 **클라이언트가 먼저 끊는다.**

### `pool.map` 의 세 가지 성질

```python
matches = [m for m in pool.map(one, ids) if m]
```

**① 지연 이터레이터를 반환한다.** `list()`나 컴프리헨션으로 소비해야 실제로 결과를 회수한다. (작업 제출 자체는 즉시 일어난다.)

**② 입력 순서를 보존한다.** `as_completed()`는 완료 순서지만 `map`은 제출 순서다. → **매치가 최신순으로 유지**되므로 별도 정렬이 필요 없다.

**③ 예외를 소비 시점에 재발생시킨다.** 워커에서 난 예외는 `Future`에 저장됐다가 이터레이션할 때 터진다. 그래서 `one()` **안에서** 잡았다.

```python
def one(mid):
    try:
        detail = match_detail(mid, region)
    except RiotError:
        return None          # 매치 1건 실패가 전체를 죽이지 않게
```

이게 없으면 매치 하나가 404여도 **전체 검색이 실패**한다. **오류 격리 경계(error boundary)** 를 워커 단위로 설정한 것.

그리고 컴프리헨션의 `if m` 필터가 `None`들을 걸러낸다.

### `max_workers=5` 의 근거

레이트리밋(초당 20회)과 지연시간의 트레이드오프다. 더 늘리면 빨라지지만 429를 유발한다. 리틀의 법칙(`L = λW`)으로 보면 동시성 5, 지연 0.2초 → 처리율 25 req/s인데, 실제론 요청 간 간격이 있어 20 req/s 아래로 유지된다.

---

## 10. 예외 — 커스텀 예외 클래스와 계층 변환

### 정의

```python
class RiotError(RuntimeError):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message
```

#### 왜 `RuntimeError`를 상속했나

`Exception`을 직접 상속해도 되지만, `RuntimeError`는 "실행 중 발생한 일반 오류"라는 의미론을 갖는다. **`BaseException`을 상속하면 절대 안 된다** — `KeyboardInterrupt`, `SystemExit`과 같은 층이 되어 `except Exception`에 안 잡힌다.

#### `super().__init__(message)` 의 역할

`BaseException.__init__`이 인자를 `self.args` 튜플에 저장한다. 이게 `str(e)`와 `repr(e)`의 출력을 결정한다.

```python
>>> e = RiotError(401, "키 만료")
>>> str(e)
'키 만료'
>>> e.args
('키 만료',)
```

이걸 빼먹으면 `str(e)`가 빈 문자열이 되어 로그가 쓸모없어진다.

#### 커스텀 속성을 단 이유

```python
self.status = status
```

예외를 **데이터 운반체**로 쓴다. HTTP 상태 코드를 예외에 실어 보내면, 잡는 쪽에서 문자열 파싱 없이 그대로 쓴다.

```python
except RiotError as e:
    raise HTTPException(status_code=e.status, detail=e.message)
```

### 계층 간 예외 변환 (exception translation)

```
riot_live.py  →  RiotError(401, "키 만료")      # 도메인 예외
     ↓
main.py       →  HTTPException(401, "키 만료")   # 프로토콜 예외
     ↓
FastAPI       →  HTTP 401 + JSON body
```

**서비스 계층이 HTTP를 몰라도 되게** 하는 설계다. `riot_live.py`는 `fastapi`를 import하지 않는다 — 그래서 CLI(`cli.py`)에서도 그대로 재사용된다. **의존성 역전**의 실용적 적용.

### `except`의 예외 매칭 규칙

```python
except RiotError as e:
```

`isinstance(exc, RiotError)` 로 매칭된다. 서브클래스도 잡힌다. 여러 개는 튜플로:

```python
except (requests.RequestException, IndexError, ValueError):
```

실제로 `ddragon_version()`에서 이렇게 썼다. **각각 다른 실패 모드**다.

- `RequestException` — 네트워크 실패
- `ValueError` — JSON 파싱 실패 (`json.JSONDecodeError`가 서브클래스)
- `IndexError` — `versions[0]` 인데 빈 배열

셋 다 "폴백 버전 쓰자"로 귀결되므로 한 블록에 묶었다. **`except Exception`으로 뭉뚱그리지 않은 이유**는, 예상 못 한 버그(예: `AttributeError`)까지 삼켜서 디버깅을 방해하기 때문이다.

### `raise ... from` (참고)

이 코드엔 안 썼지만 알아두면 좋다.

```python
except ValueError as e:
    raise RiotError(500, "...") from e     # __cause__ 설정, 트레이스백 연결
    raise RiotError(500, "...") from None  # 원본 체인 숨김
```

---

## 11. `global` — 이름 바인딩의 스코프 규칙

```python
_ddragon_version: str | None = None

def ddragon_version() -> str:
    global _ddragon_version
    if _ddragon_version is None:
        _ddragon_version = versions[0]
    return _ddragon_version
```

### 왜 `global`이 필요한가

파이썬의 스코프 결정은 **런타임이 아니라 컴파일 타임**에 이뤄진다. 컴파일러가 함수 본문을 스캔해서:

> **함수 안에서 어떤 이름에 대입(`=`)이 한 번이라도 있으면, 그 이름은 그 함수의 지역 변수다.**

`global` 없이 쓰면:

```python
def f():
    if _ddragon_version is None:   # UnboundLocalError
        _ddragon_version = "..."   # ← 이 대입 때문에 지역 변수로 확정됨
```

**읽는 줄이 대입보다 위에 있어도** 에러다. 스코프는 정적으로 결정되기 때문. 바이트코드로 보면 명확하다.

```
LOAD_FAST   _ddragon_version     # 지역 슬롯 조회 → 비어있음 → UnboundLocalError
```

`global`을 선언하면:

```
LOAD_GLOBAL / STORE_GLOBAL       # 모듈 전역 딕셔너리 접근
```

**읽기만 한다면 `global`이 필요 없다.** 대입할 때만 필요하다.

### 관련: `nonlocal`

중첩 함수에서 **바깥 함수의** 지역 변수에 대입하려면 `nonlocal`을 쓴다.

```python
def outer():
    count = 0
    def inner():
        nonlocal count      # global이 아니라 nonlocal
        count += 1
```

### 이 패턴의 이름

```python
if _ddragon_version is None:
    _ddragon_version = 계산()
return _ddragon_version
```

**지연 초기화(lazy initialization)** 다. 모듈 임포트 시점에 네트워크를 때리면 서버 기동이 느려지고, 인터넷이 없으면 임포트 자체가 실패한다. **첫 사용 시점까지 미루는** 게 목적이다.

`_trait_name_map()`도 같은 패턴이다 (319개 특성 사전을 첫 조회 때만 다운로드).

> 이 패턴은 **스레드 안전하지 않다.** 두 스레드가 동시에 `None`을 보면 둘 다 계산한다. 여기선 결과가 같고 부작용이 없어서(idempotent) 무해하다 — 중복 계산만 낭비될 뿐.

---

## 12. `_cached()` — 직접 만든 TTL 캐시의 동시성 분석

```python
_cache: dict[str, tuple[float, object]] = {}
_cache_lock = threading.Lock()

def _cached(key: str, ttl: float, producer):
    now = time.time()
    with _cache_lock:                      # ── 임계 구역 ①
        hit = _cache.get(key)
        if hit and now - hit[0] < ttl:
            return hit[1]
    value = producer()                     # ── 락 밖 (느린 I/O)
    with _cache_lock:                      # ── 임계 구역 ②
        _cache[key] = (time.time(), value)
    return value
```

### 자료구조 선택

`dict[str, tuple[float, object]]` — 키는 문자열, 값은 `(저장시각, 값)` 튜플.

**튜플을 쓴 이유**: 불변(immutable)이라 원자적으로 교체된다. `hit[0]`(시각)과 `hit[1]`(값)이 **항상 짝**이다. 리스트나 별도 딕셔너리 두 개로 나눴다면 시각만 갱신되고 값이 안 바뀐 중간 상태가 보일 수 있다.

### 락을 잡은 채로 producer를 호출하지 않은 이유

```python
# 이렇게 했다면
with _cache_lock:
    hit = _cache.get(key)
    if hit and ...: return hit[1]
    value = producer()          # 2초 걸리는 네트워크 호출
    _cache[key] = ...
```

전역 락을 2초간 붙잡으면 **다른 소환사를 검색하는 모든 요청이 블록**된다. 캐시 히트조차 대기한다. 사실상 서버가 직렬화된다.

### 그 대가 — thundering herd

락을 놓았기 때문에 **check-then-act 경쟁 조건**이 생긴다.

```
T1: 캐시 확인(미스) ──→ producer 호출 ─────→ 저장
T2:      캐시 확인(미스) ──→ producer 호출 ──→ 저장   (중복!)
```

같은 키를 동시에 요청하면 API를 두 번 때린다.

**의도적 트레이드오프**다.

- 결과는 **정확하다** (나중 것이 덮어씀, 둘 다 유효한 데이터)
- 낭비는 동시 요청 수만큼만
- 완전 차단하려면 **키별 락**이 필요한데, 락 딕셔너리 관리 + 정리 로직이 붙어 복잡도가 커진다

이 규모(개발용 키, 로컬)에선 **단순함이 이긴다.**

### `time.time()` 대신 `time.monotonic()` 이 정확하다

| | 성질 |
|---|---|
| `time.time()` | 벽시계(wall clock). **NTP 동기화나 수동 변경으로 뒤로 갈 수 있음** |
| `time.monotonic()` | 단조 증가 보장. 절대 뒤로 안 감 |

시계가 뒤로 점프하면 `now - hit[0]`가 음수가 되어 **캐시가 영구 유효**해질 수 있다. **경과 시간 측정에는 `monotonic`이 정석**이다. 실무 코드라면 바꿔야 할 부분.

### `lru_cache`를 안 쓰고 직접 만든 이유

| | `functools.lru_cache` | 직접 만든 `_cached` |
|---|---|---|
| 만료(TTL) | 없음 | 있음 |
| 키 | 인자에서 자동 생성 | 문자열로 직접 지정 |
| 인자 제약 | 해시 가능해야 함 | 자유 |

**TTL이 없다는 게 결정적**이다. 랭킹 데이터는 5분 뒤엔 갱신돼야 하는데 `lru_cache`는 영구 보존한다. 반면 `dataset.py`의 CSV 계산은 **파일이 안 바뀌면 영원히 같은 답**이라 `lru_cache`가 적합하다. **캐시 무효화 정책이 다르면 도구도 달라야 한다.**

---

## 13. 컴프리헨션 — 문법, 스코프, 성능

### 리스트 컴프리헨션

```python
traits = [t for t in participant.get("traits", []) if t.get("tier_current", 0) > 0]
```

디슈가링:

```python
traits = []
for t in participant.get("traits", []):
    if t.get("tier_current", 0) > 0:
        traits.append(t)
```

**성능 차이**: 컴프리헨션은 `LIST_APPEND` 전용 바이트코드를 쓴다. 수동 루프는 매 반복마다 `LOAD_METHOD append` → `CALL_METHOD`로 **메서드 조회 비용**이 든다. 보통 20~30% 빠르다.

### 스코프 — Python 3의 중요한 변화

```python
[x for x in range(3)]
print(x)     # NameError (Python 3)
```

컴프리헨션은 **자체 함수 스코프**를 가진다. Python 2에선 루프 변수가 밖으로 샜지만 3에서 고쳐졌다. 바이트코드를 보면 실제로 **암묵적 함수 객체**가 만들어져 호출된다.

(단, 대입 표현식 `:=`는 바깥 스코프에 쓴다.)

### 네 종류

```python
[x for x in xs]       # list
{x for x in xs}       # set
{k: v for k, v in xs} # dict
(x for x in xs)       # generator (괄호는 리스트/셋과 달리 튜플이 아님!)
```

**튜플 컴프리헨션은 없다.** `(x for x in xs)`는 제너레이터다. 튜플이 필요하면 `tuple(x for x in xs)`.

### 필터로 `None` 제거

```python
matches = [m for m in pool.map(one, ids) if m]
```

`if m`은 **truthy 검사**다. `one()`이 `None`을 반환한 것들이 걸러진다.

엄밀하게는 `if m is not None`이 안전하다. `one()`이 빈 딕셔너리 `{}`를 반환하면 `if m`은 걸러버린다. 여기선 `one()`이 `None` 아니면 항상 비어있지 않은 딕셔너리를 반환하므로 동등하다.

---

## 14. `sorted()` — key, 안정성, reverse

```python
top = sorted(traits, key=lambda t: t.get("num_units", 0), reverse=True)[:2]
```

### `key` 함수의 동작 — Schwartzian transform

`sorted`는 각 원소에 `key`를 **정확히 한 번씩** 적용해 배열을 만들고, 그걸로 정렬한다.

```python
# 개념적으로
decorated = [(key(x), i, x) for i, x in enumerate(iterable)]
decorated.sort()
result = [x for _, _, x in decorated]
```

**비교 함수(`cmp`)가 아니라 키 추출 함수**인 이유가 여기 있다. `cmp`는 O(n log n)번 호출되지만 `key`는 **n번만** 호출된다. Python 3에서 `cmp` 인자가 제거된 이유다. (필요하면 `functools.cmp_to_key`)

### 안정 정렬 (stable sort)

파이썬의 정렬은 **Timsort**이며 **안정적**이다. 같은 키를 가진 원소들의 **원래 순서가 보존**된다.

이게 중요한 곳:

```python
rows.sort(key=lambda e: e.get("leaguePoints", 0), reverse=True)
```

LP가 같은 랭커들은 **리그 응답에 담긴 원래 순서**를 유지한다. 불안정 정렬이었다면 새로고침할 때마다 동점자 순위가 뒤바뀌어 보였을 것이다.

### `reverse=True` vs `key`에 음수

```python
sorted(xs, key=f, reverse=True)   # 안정성 유지
sorted(xs, key=lambda x: -f(x))   # 동점자 순서가 뒤집힘, 숫자에만 가능
```

`reverse=True`는 **비교 방향만 뒤집고 동점자 순서는 유지**하도록 구현돼 있다. 음수 트릭은 안정성을 깨뜨리고 문자열엔 쓸 수도 없다.

### `sorted()` vs `list.sort()`

```python
sorted(traits, ...)    # 새 리스트 반환, 원본 불변 (어떤 iterable이든 가능)
rows.sort(...)         # 제자리 정렬, None 반환 (list 전용, 메모리 절약)
```

`traits`는 원본을 건드리면 안 되는 남의 데이터라 `sorted`, `rows`는 내가 만든 리스트라 `sort`를 썼다.

### 슬라이싱 `[:2]` 의 안전성

```python
[1].__getitem__(slice(0,2))   # → [1]   범위를 넘어도 예외 없음
```

인덱싱 `xs[2]`는 `IndexError`지만 **슬라이싱은 자동으로 잘린다.** 특성이 1개뿐인 참가자여도 안전하다.

같은 성질을 페이지네이션에도 활용했다.

```python
page_entries = entries[start : start + page_size]   # 마지막 페이지가 짧아도 OK
```

---

## 15. 딕셔너리 디스패치 — `if/elif` 체인을 자료구조로

### 원본 f48fe45

```python
mode_name = "기타 모드"
if queue_id == 1160 or queue_id == 1150:
    mode_name = "더블업 모드"
elif queue_id == 1100:
    mode_name = "랭크 게임"
elif queue_id == 1090:
    mode_name = "일반 게임"
elif queue_id == 1130:
    mode_name = "초고속 모드"
```

### 바꾼 것

```python
QUEUE_NAMES = {
    1160: "더블업 모드",
    1150: "더블업 모드",
    1100: "랭크 게임",
    1090: "일반 게임",
    1130: "초고속 모드",
    1220: "전략가의 시험",
}

mode_name = QUEUE_NAMES.get(queue_id, "기타 모드")
```

### 왜 더 나은가

**① 시간복잡도**: `if/elif`는 O(n) 순차 비교, 딕셔너리는 **해시 테이블 O(1)**.

**② 데이터와 로직의 분리**: 새 모드가 추가되면 **딕셔너리에 한 줄만** 추가한다. 제어 흐름은 안 건드린다. 실제로 `1220: "전략가의 시험"` 을 추가할 때 로직은 한 글자도 안 고쳤다.

**③ 재사용 가능**: 딕셔너리는 **값**이라 다른 곳에서도 쓴다. 실제로 `_comp_name()`의 폴백으로 재활용했다.

```python
if not traits:
    return QUEUE_NAMES.get(queue_id, "조합 정보 없음")
```

`if/elif`였다면 이 로직을 복붙해야 했다.

**④ 기본값이 시그니처에 들어감**: `.get(key, default)`가 `else` 절을 대체한다.

### `dict.get()` 의 정확한 의미론

```python
d[k]              # 없으면 KeyError
d.get(k)          # 없으면 None
d.get(k, default) # 없으면 default
```

**`get`은 예외를 안 던진다.** 외부 API 응답처럼 **필드 존재가 보장되지 않는** 데이터엔 전부 `.get()`을 썼다.

```python
info = detail.get("info", {})           # 없으면 빈 dict → 다음 .get()도 안전
me.get("placement", 0)
```

`{}`를 기본값으로 준 게 포인트다. `None`이었다면 `info.get(...)`에서 `AttributeError: 'NoneType' object has no attribute 'get'`가 난다. **체이닝 가능한 기본값**을 고른 것.

---

## 16. 딕셔너리 언패킹 `{**e, "_tier": ...}`

```python
rows.append({**e, "_tier": t.upper()})
```

### 문법 (PEP 448)

`**`는 딕셔너리를 **펼쳐서** 새 딕셔너리에 복사한다.

```python
{**a, **b}          # 병합 (b가 우선)
{**a, "k": v}       # a 복사 + k 추가/덮어쓰기
```

### 왜 이렇게 했나

Riot의 리그 엔트리에는 **어느 티어인지가 없다.** `/tft/league/v1/challenger`를 부르면 응답에 "이게 챌린저다"라는 필드가 없다 — URL로 이미 알고 있으니까.

세 티어를 합칠 땐 그 정보가 필요하다. 그래서 **원본을 오염시키지 않고** 필드를 덧붙였다.

```python
e["_tier"] = t.upper()      # 원본 딕셔너리 변형 (캐시된 객체일 수도)
{**e, "_tier": t.upper()}   # 얕은 복사 + 추가
```

### 얕은 복사(shallow copy)임에 주의

`{**e}`는 **1단계만** 복사한다. 중첩된 리스트/딕셔너리는 **참조를 공유**한다.

```python
a = {"x": [1,2]}
b = {**a}
b["x"].append(3)
a["x"]              # [1, 2, 3]  공유됨
```

이 경우 `e`의 값들은 전부 스칼라(str, int, bool)라 안전하다. 중첩 구조였다면 `copy.deepcopy`가 필요하다.

### `_tier` 언더스코어 접두사

**내부용 임시 필드**라는 관례다. 나중에:

```python
"tier": e.get("_tier", "").title(),
```

로 소비되고 응답에는 안 나간다. Riot의 실제 필드명과 충돌하지 않게 하는 네임스페이스 구분이기도 하다.

---

## 17. 조건 표현식(삼항 연산자)와 튜플 리터럴의 함정

```python
tiers = ("challenger", "grandmaster", "master") if tier in ("all", "", None) else (tier.lower(),)
```

### 조건 표현식 문법

파이썬은 C계열과 **어순이 다르다**.

```c
cond ? a : b        // C
```

```python
a if cond else b    # Python — 값이 앞
```

**표현식**이라 어디든 들어간다(대입 우변, 인자, 컴프리헨션 안). `if` 문(statement)과는 다르다.

### `in` 연산자의 다형성

```python
tier in ("all", "", None)
```

`in`은 `__contains__` 프로토콜이다. 튜플/리스트는 O(n) 선형 탐색, 셋/딕셔너리는 O(1) 해시 탐색.

원소 3개면 튜플이 더 빠르다 — 셋은 해시 계산 오버헤드가 있고, **튜플 리터럴은 상수 폴딩되어 코드 객체에 박힌다** (매번 생성 안 함).

```python
>>> dis.dis("x in ('a','b')")
LOAD_CONST  ('a', 'b')     # 컴파일 타임 상수
CONTAINS_OP
```

### `(tier.lower(),)` — 쉼표가 튜플을 만든다

```python
(x)     # 그냥 괄호로 감싼 x — 튜플 아님!
(x,)    # 원소 1개짜리 튜플
```

**튜플을 만드는 건 괄호가 아니라 쉼표다.** 실제로 괄호 없이도 된다.

```python
t = 1, 2, 3     # 튜플
```

쉼표를 빼먹으면 `tiers`가 **문자열**이 되고, 다음 코드에서:

```python
for t in tiers:      # 문자열을 순회 → 'c', 'h', 'a', ... 글자 단위
```

**조용히 잘못 동작**하는 무서운 버그가 된다.

### 왜 리스트가 아니라 튜플인가

```python
entries = _cached(f"league:{region}:{'+'.join(tiers)}", 300.0, collect)
```

`tiers`가 캐시 키 생성에 쓰인다. 튜플은 **불변 + 해시 가능**이라 의도가 명확하다. "이 컬렉션은 변경되지 않는다"를 타입으로 표현한 것.

### f-string 안의 중첩 따옴표

```python
f"league:{region}:{'+'.join(tiers)}"
```

f-string 표현식 안에서 **바깥과 다른 따옴표**를 써야 한다 (Python 3.11 이하). 3.12부터 PEP 701로 같은 따옴표도 허용된다.

---

## 18. `re.sub()` — 정규식 폴백

```python
labels.append(names.get(tid) or re.sub(r"^TFT\d*_", "", tid))
```

### 패턴 해부

```
r"^TFT\d*_"
 │ │   │ ││
 │ │   │ │└─ 리터럴 '_'
 │ │   │ └─ * : 앞 요소 0회 이상 (탐욕적)
 │ │   └─ \d : 숫자 [0-9]
 │ └─ 리터럴 'TFT'
 └─ ^ : 문자열 시작 앵커
```

`"TFT17_DarkStar"` → `"DarkStar"`

### `r""` raw 문자열이 필요한 이유

파이썬 문자열에서 `\d`는 **인식되지 않는 이스케이프**라 `"\\d"`로 남지만(경고 발생), `\b`, `\n` 등은 실제 제어문자로 해석된다.

```python
"\b"    # 백스페이스 문자 (0x08)
r"\b"   # 백슬래시 + b (정규식의 단어 경계)
```

**정규식엔 항상 `r""`을 쓰는 게 규칙**이다. Python 3.12부터 잘못된 이스케이프는 `SyntaxWarning`을 낸다.

### `^` 앵커를 넣은 이유

없으면 문자열 **중간**의 패턴도 치환한다. `"Old_TFT17_Thing"` 같은 입력에서 오작동한다. 앵커는 **의도를 코드로 못박는** 장치다.

### `*` vs `+`

`\d*`는 0회 이상이라 `"TFT_Foo"`(숫자 없음)도 매칭된다. `\d+`였다면 세트 번호 없는 ID를 못 잡는다. **입력 스펙의 불확실성**에 대한 방어.

### 왜 `or`로 연결했나

```python
names.get(tid) or re.sub(...)
```

**2단계 폴백**이다.

1. DDragon 사전에 있으면 한글 이름
2. 없으면 정규식으로 접두사만 제거한 영문

옛 시즌 매치는 사전에 없어서 2번으로 간다. **완벽한 답이 없을 때 열화(degrade)하되 죽지 않는** 설계.

---

## 19. `enumerate()` — 인덱스와 값을 함께

```python
with ThreadPoolExecutor(max_workers=5) as pool:
    rows = list(pool.map(resolve, enumerate(page_entries)))

def resolve(item: tuple[int, dict]) -> dict:
    idx, e = item
    ...
    return {"rank": start + idx + 1, ...}
```

### 동작

`enumerate(iterable, start=0)`는 **이터레이터**를 반환한다 (리스트 아님). `(0, 첫원소), (1, 둘째원소), …` 를 지연 생성한다.

### 여기서 쓴 이유가 특이하다

보통은 `for i, x in enumerate(xs)` 형태로 쓴다. 그런데 `pool.map`은 **인자 1개짜리 함수**만 받는다. 그래서 `(인덱스, 값)` 튜플을 통째로 넘기고 함수 안에서 언패킹했다.

```python
def resolve(item):
    idx, e = item        # 튜플 언패킹
```

**대안**: `pool.map(resolve, range(len(...)), page_entries)` — `map`은 다중 이터러블도 받는다. 하지만 `enumerate`가 더 명시적이라 골랐다.

### `start + idx + 1` 의 의미

전역 순위 계산이다. 페이지 2(0-based `start=20`)의 첫 항목(`idx=0`)은 `20 + 0 + 1 = 21`등. 실제로 검증했다.

```
[랭킹 page=2, master] HTTP 200 | 1행: 21 등
```

### `list()`로 감싼 이유

`pool.map`은 지연 이터레이터다. `list()`가 **소비 시점을 명시**한다. 안 감싸면 함수 밖으로 나간 뒤 소비되는데, 그때 executor는 이미 shutdown이라 의도가 불명확해진다.

---

## 20. 문자열 메서드와 f-string

### `.strip()` / `.title()` / `.upper()` — 전부 새 객체 반환

파이썬 문자열은 **불변(immutable)** 이다. 어떤 메서드도 원본을 안 바꾼다.

```python
s = "  a  "
s.strip()     # 새 문자열 반환
s             # '  a  ' 그대로
```

그래서 반드시 재대입해야 한다.

```python
game_name, tag_line = game_name.strip(), tag_line.strip()
```

우변이 먼저 **튜플로 평가**된 뒤 좌변에 언패킹된다. 이게 `a, b = b, a` 스왑이 동작하는 원리이기도 하다.

### `.title()` 의 함정

```python
"DIAMOND".title()      # 'Diamond'
"hide on bush".title() # 'Hide On Bush' — 단어마다 대문자
"o'brien".title()      # "O'Brien" — 아포스트로피도 경계로 인식
```

이 코드에선 **단일 단어 티어명**에만 써서 안전하다. 사람 이름엔 쓰면 안 된다.

### f-string은 컴파일 타임에 전개된다

```python
f"{tier.title()} {rank}"
```

`str.format()`처럼 런타임 파싱을 하지 않고 **바이트코드로 직접 컴파일**된다.

```
LOAD_METHOD title / CALL_METHOD / FORMAT_VALUE / BUILD_STRING
```

그래서 `%` 포매팅이나 `.format()`보다 **빠르다**.

### `requests.utils.quote()` — 퍼센트 인코딩

```python
url = f".../by-riot-id/{requests.utils.quote(game_name)}/{requests.utils.quote(tag_line)}"
```

소환사명에 **공백, 한글, `/`** 가 들어갈 수 있다. `"hide on bush"` → `"hide%20on%20bush"`.

인코딩 안 하면 공백이 URL을 깨뜨리고, `/`는 **경로 구분자로 오인**되어 완전히 다른 엔드포인트를 부른다.

#### 실제로 겪은 버그

테스트할 때 `#`을 인코딩 안 해서 태그가 날아갔다.

```
GET /api/summoner/kr/김준민#0213
                        └─ 여기부터 URL fragment → 서버로 전송조차 안 됨
```

RFC 3986에서 `#`는 **fragment 구분자**다. 브라우저/클라이언트가 서버로 안 보낸다. 그래서 서버는 `김준민`만 받았고, `split_riot_id`가 기본 태그 `KR1`을 붙여 **다른 사람**을 조회했다.

프론트엔드는 `encodeURIComponent()`로 `%23`을 만들어 보내므로 정상이다.

```ts
navigate(`/summoner/${region}/${encodeURIComponent(trimmed)}`);
```

---

## 21. 모듈 임포트와 순환 참조 회피

### `if __name__ == "__main__":`

```python
# cli.py 맨 아래
if __name__ == "__main__":
    main()
```

`__name__`은 모듈의 이름이다.

- 직접 실행하면 `"__main__"`
- import되면 `"app.cli"`

**이게 f48fe45 버그의 정확한 해법이다.** 원본은 모듈 최상위에 `input()`이 있어서 **임포트만 해도 실행**됐다. 이 가드가 "직접 실행할 때만"을 보장한다.

### `python -m app.cli` 의 의미

`-m`은 모듈을 **패키지 컨텍스트에서** 실행한다. 이게 필요한 이유:

```python
from .services import riot_live      # 상대 임포트
```

`python app/cli.py`로 직접 실행하면 `__package__`가 비어 있어 **`ImportError: attempted relative import with no known parent package`** 가 난다. `-m`은 패키지를 인식시켜 상대 임포트를 동작하게 한다.

### 계층 의존성 방향

```
main.py  ──imports──→  services/riot_live.py
cli.py   ──imports──→  services/riot_live.py

riot_live.py ──imports──→ (fastapi 없음!)
```

`riot_live.py`가 `fastapi`를 임포트하지 않는 게 핵심이다. **저수준이 고수준을 모른다.** 그래서:

- 웹(`main.py`)과 CLI(`cli.py`) 양쪽에서 재사용
- `riot_live` 단위 테스트에 FastAPI 불필요
- 순환 임포트 원천 차단

---

## 22. 종합 — `summoner_profile()` 전체를 문법 관점에서 다시 읽기

```python
def summoner_profile(region: str, raw_name: str, match_count: int = 10) -> dict:
    region = region.lower()                                    # ① 정규화
    game_name, tag_line = split_riot_id(raw_name, region)       # ② 튜플 언패킹

    def build() -> dict:                                        # ③ 클로저 (thunk)
        account = account_by_riot_id(game_name, tag_line, region)
        puuid = account.get("puuid")
        if not puuid:
            raise RiotError(404, "해당 소환사를 찾을 수 없습니다.")   # ④ 조기 반환

        try:                                                    # ⑤ 부분 실패 허용
            summoner = summoner_by_puuid(puuid, region)
        except RiotError:
            summoner = {}

        ids = match_ids(puuid, region, count=match_count)

        def one(mid: str) -> dict | None:                       # ⑥ 중첩 클로저
            try:
                detail = match_detail(mid, region)
            except RiotError:
                return None                                     # ⑦ 오류 격리
            info = detail.get("info", {})
            me = next((p for p in info.get("participants", [])
                       if p.get("puuid") == puuid), None)        # ⑧ next + 기본값
            if not me:
                return None
            queue_id = info.get("queue_id") or info.get("queueId")  # ⑨ or 폴백
            played_ms = info.get("game_datetime") or 0
            return {
                "id": mid,
                "placement": me.get("placement", 0),
                "comp": _comp_name(me, queue_id),
                "playedAt": datetime.fromtimestamp(played_ms / 1000,
                                                   tz=timezone.utc).isoformat(),
                "queue": QUEUE_CODES.get(queue_id, "other"),     # ⑩ dict 디스패치
            }

        with ThreadPoolExecutor(max_workers=5) as pool:          # ⑪ 컨텍스트 매니저
            matches = [m for m in pool.map(one, ids) if m]       # ⑫ 컴프리헨션 필터

        entries = league_by_puuid(puuid, region)
        solo = next((e for e in entries
                     if e.get("queueType") == "RANKED_TFT"), None)
        chosen = solo or (entries[0] if entries else {})         # ⑬ or + 조건표현식

        return { ... }

    return _cached(f"summoner:{region}:{game_name}#{tag_line}:{match_count}",
                   60.0, build)                                  # ⑭ 지연 실행
```

### 설계 결정 요약

| 번호 | 구문 | 결정 이유 |
|---|---|---|
| ① | `region.lower()` | 캐시 키 정규화 — `KR`/`kr`이 다른 키가 되면 캐시가 무의미 |
| ③⑭ | 클로저 + thunk | 캐시 미스일 때만 실행 |
| ④ | 조기 `raise` | 중첩 감소 (guard clause) |
| ⑤ | `try/except`로 `{}` | 소환사 정보 실패해도 매치는 보여줌 — **부분 성능 저하** |
| ⑦ | 워커 내부 `except` | 매치 1건 실패가 전체를 죽이지 않음 |
| ⑧ | `next(..., None)` | 조기 종료 + 예외 없는 미발견 처리 |
| ⑨ | `or` 체인 | API 버전 차이 흡수 |
| ⑪ | `with` | 예외가 나도 스레드 정리 보장 |
| ⑬ | `or` + 조건표현식 | 3단 폴백을 한 줄로 |

### 관통하는 원칙

**"어떤 단계가 실패해도 나머지는 살린다"** 는 오류 처리 전략이 문법 선택 전반을 지배한다.

- 예외 → 워커 내부에서 흡수 (⑦)
- 미발견 → 예외 대신 `None` (⑧)
- 필드 누락 → `.get()` 기본값
- 사전 없음 → 정규식 폴백 (18번)

원본 f48fe45는 **모든 실패가 `exit()`** 였다. 하나 실패하면 전부 잃었다. 지금은 **각 실패가 국소화**된다.

---

## 23. 개선 여지 (정직하게)

| 위치 | 문제 | 개선 |
|---|---|---|
| `_cached` | `time.time()` — 시계 역행 가능 | `time.monotonic()` |
| `_cached` | thundering herd | 키별 락 or single-flight |
| `_cached` | **무한 증가** — 만료 항목 삭제 안 함 | LRU 상한 + 주기적 정리 |
| `queue_id = a or b` | `0`도 falsy로 걸림 | `if a is None` |
| `ddragon_version()` | 지연 초기화 비원자적 | double-checked locking |
| 전역 `_session` | 커넥션 풀 기본 10개 | `HTTPAdapter(pool_maxsize=...)` |

`_cache`가 무한히 커지는 건 장기 실행 서버에선 **메모리 누수**다. 소환사 검색 키가 계속 쌓인다. 지금은 개발용이라 무해하지만, 운영이라면 `cachetools.TTLCache`(내부적으로 만료 힙 관리)로 바꾸는 게 맞다.
