"""정적 게임 데이터 도메인 조립기 — CDragon 원본을 프론트 계약 형태로 변환한다.

반환 형태는 frontend/src/types/domain.ts 의 Champion / Item 과 정확히 일치한다.
프론트는 이 계약을 이미 갖추고 있으므로(특성 필터·아이템 분류 탭·조합법 Modal 이
모두 구현되어 있다) 백엔드가 값을 채우면 코드 변경 없이 동작한다.

데이터 소스는 cdragon.py 가 전담한다. 이 모듈은 순수 변환만 한다.

[변경 이력]
    기존에는 data/TFT_DDragon/ 로컬 미러를 읽었으나, 그 데이터에는 챔피언 특성과
    아이템 조합법이 없어 traits 가 항상 빈 배열이고 모든 아이템이 'combined' 로 나왔다.
    Community Dragon 으로 교체하면서 미러 의존을 완전히 제거했다.

설계 문서: aidlc-docs/construction/U1/functional-design/business-rules.md
"""
import re
from functools import lru_cache

from . import cdragon

# ─────────────────────────────────────────────────────────────────
# lru_cache 사용에 대한 판단 근거 (BR-8)
#
# dataset.py 는 lru_cache 때문에 CSV 를 갱신해도 서버 재시작 전까지 반영되지 않는
# 문제가 있다. 여기서도 같은 데코레이터를 쓰지만 성격이 다르다:
# 정적 게임 데이터는 세트 단위로만 바뀌므로 프로세스 수명 내 불변으로 취급해도 안전하다.
# 원본 갱신은 cdragon.py 의 TTL(24시간) 캐시가 담당한다.
# → 갱신이 필요하면 서버를 재시작하거나 cdragon.reset_cache() 를 호출한다.
# ─────────────────────────────────────────────────────────────────

_VALID_COSTS = (1, 2, 3, 4, 5)
# 미번역 항목의 name 은 'tft_item_name_XXX' 형태로 들어온다 (폐기·내부 항목).
_UNTRANSLATED_PREFIX = "tft_item_name_"
# 클래식 상시 아이템 접두사. 현재 세트 전용 아이템은 TFT{SET}_ 접두사를 쓴다.
_CLASSIC_ITEM_PREFIX = "TFT_Item_"


def _is_named(raw: dict) -> bool:
    """표시 가능한 이름을 가졌는가. 미번역·폐기 항목을 걸러낸다. (BR-2.1)"""
    name = raw.get("name")
    return bool(name) and not str(name).startswith(_UNTRANSLATED_PREFIX)


# ── 설명 정제 (BR-3.2) ────────────────────────────────────────────
# CDragon 의 desc 는 게임 내부 템플릿 문자열이라 그대로 노출하면 이렇게 보인다:
#   '공격력 %i:scaleAD%+@AD*100@%'
#   '장착 시 특성 획득<br><br><ShowIf.TFT17_DRX_CapstoneActive><scaleLevel ...>'
# 사용자에게 보여줄 문장으로 다듬는다.
_RE_BR = re.compile(r"<br\s*/?>", re.IGNORECASE)
_RE_TAG = re.compile(r"<[^>]*>")
_RE_ICON = re.compile(r"%i:[^%]*%")          # %i:scaleAD% 같은 아이콘 자리표시자
_RE_TEMPLATE = re.compile(r"\{\{[^}]*\}\}|\{[0-9a-f]{6,}\}")  # {{키워드}}, {4dc0582f}
_RE_VAR = re.compile(r"@([A-Za-z0-9_]+)(\*(\d+(?:\.\d+)?))?@")
# @TFTUnitProperty.item:TFT_Tracker_Value1@ 같은 인게임 실시간 카운터.
# 정적 데이터로는 값을 알 수 없으므로 남은 자리표시자를 통째로 지운다.
_RE_LEFTOVER_VAR = re.compile(r"@[^@]*@")
_RE_WS = re.compile(r"[ \t]{2,}")
# 자리표시자를 지운 뒤 '아군 체력 회복량:' 처럼 값 없는 라벨만 남는 줄을 버린다.
_RE_DANGLING = re.compile(r"[:：]\s*$")


def _format_number(value: float) -> str:
    """부동소수 잡음을 없애고 사람이 읽는 형태로. 10.000000149 → '10', 2.5 → '2.5'."""
    rounded = round(value, 2)
    if abs(rounded - round(rounded)) < 1e-9:
        return str(int(round(rounded)))
    return f"{rounded:g}"


def _clean_description(desc: str | None, effects: dict | None) -> str | None:
    """게임 템플릿 문자열을 표시용 문장으로 정제한다.

    @변수@ 는 effects 에서 실제 값을 찾아 치환한다 (@AD*100@ + AD:0.1 → 10).
    값을 못 찾으면 자리표시자를 지운다 — '@AD*100@%' 가 그대로 보이는 것보다 낫다.
    """
    if not desc:
        return None
    values = effects or {}

    def sub_var(m: re.Match) -> str:
        key, multiplier = m.group(1), m.group(3)
        raw = values.get(key)
        if raw is None:
            return ""
        try:
            number = float(raw) * (float(multiplier) if multiplier else 1.0)
        except (TypeError, ValueError):
            return ""
        return _format_number(number)

    text = _RE_BR.sub("\n", desc)
    text = _RE_TAG.sub("", text)
    text = _RE_ICON.sub("", text)
    text = _RE_TEMPLATE.sub("", text)
    text = _RE_VAR.sub(sub_var, text)
    text = _RE_LEFTOVER_VAR.sub("", text)
    text = _RE_WS.sub(" ", text)
    # 빈 줄과, 값이 사라져 라벨만 남은 줄을 버린다
    lines = [ln.strip() for ln in text.split("\n")]
    cleaned = "\n".join(ln for ln in lines if ln and not _RE_DANGLING.search(ln))
    return cleaned or None


def _dedupe_by_name(entries: list[dict]) -> list[dict]:
    """표시 이름이 같은 항목 중 대표 하나만 남긴다. (BR-2.7)

    CDragon 에는 표준 아이템과 그 변종이 **같은 한글 이름**으로 함께 들어 있다
    (예: TFT_Item_InfinityEdge / TFT_Item_CorruptedInfinityEdge 둘 다 '무한의 대검').
    조합법까지 동일해서 목록에 나란히 놓이면 사용자에게는 그냥 중복으로 보인다.

    변종은 apiName 에 수식어가 붙어 더 길다는 규칙을 이용해, 가장 짧은 id 를 대표로 삼는다.
    'Corrupted' 를 하드코딩하지 않으므로 다른 변종 접두사가 생겨도 그대로 동작한다.
    """
    best: dict[str, dict] = {}
    for entry in entries:
        name = entry["name"]
        current = best.get(name)
        if current is None or (len(entry["id"]), entry["id"]) < (len(current["id"]), current["id"]):
            best[name] = entry
    return list(best.values())


# ── 챔피언 (BR-1) ─────────────────────────────────────────────────
@lru_cache(maxsize=1)
def champions() -> list[dict]:
    """현재 세트의 플레이어블 챔피언 목록.

    선별 기준은 apiName 접두사가 아니라 **traits 유무**다 (BR-1.2).
    접두사 방식은 TFT17_ 를 달고 있는 PVE 몬스터·소환수까지 통과시키고
    (실측 73개 중 10개), 접두사 규칙을 벗어나는 이벤트 유닛은 놓친다.
    '특성을 가졌다'는 곧 '플레이어가 배치할 수 있다'는 뜻이라 의미와 직접 대응한다.
    """
    out: list[dict] = []
    for raw in cdragon.champions_raw():
        if not isinstance(raw, dict):
            continue
        traits = raw.get("traits") or []
        if not traits:
            continue  # PVE 몬스터 · 소환수
        cost = raw.get("cost")
        if cost not in _VALID_COSTS:
            continue
        if not _is_named(raw):
            continue

        out.append(
            {
                "id": raw.get("apiName") or "",
                "name": raw["name"],
                "cost": int(cost),
                "traits": list(traits),  # CDragon 이 이미 한글 이름으로 준다
                # squareIcon 이 아니라 tileIcon 이다. 전자는 이름과 달리 스플래시 아트다.
                "iconUrl": cdragon.asset_url(raw.get("tileIcon")),
            }
        )
    return sorted(out, key=lambda c: (c["cost"], c["name"]))


# ── 아이템 (BR-2) ─────────────────────────────────────────────────
@lru_cache(maxsize=1)
def items() -> list[dict]:
    """조합 아이템과 기본 재료 목록.

    2패스 알고리즘을 쓴다:
      1패스 — composition 을 가진 것 중 현재 세트에 해당하는 조합 아이템을 고른다
      2패스 — 그 조합 아이템들이 참조하는 재료를 역산해 기본 재료를 확정한다

    기본 재료 목록을 하드코딩하지 않는 이유는, 조합 관계에서 역산하면
    세트가 바뀌어 새 재료가 추가돼도 규칙 수정 없이 따라가기 때문이다.
    실측 결과 정확히 10개(TFT 표준 재료 10종)가 도출된다.

    부수 효과로 참조 무결성이 구조적으로 보장된다 — 재료는 조합 아이템에서
    역산되므로 recipe 가 가리키는 항목이 목록에 없는 상황이 발생하지 않는다.
    """
    raw_items = [i for i in cdragon.items_raw() if isinstance(i, dict)]
    by_api = {i.get("apiName"): i for i in raw_items if i.get("apiName")}
    set_prefix = f"TFT{cdragon.set_number()}_"

    # 1패스 — 조합 아이템 (BR-2.2)
    combined_raw = [
        i
        for i in raw_items
        if i.get("composition")
        and _is_named(i)
        and str(i.get("apiName", "")).startswith((_CLASSIC_ITEM_PREFIX, set_prefix))
    ]

    # 2패스 — 재료 역산 (BR-2.3)
    #   이 단계가 GrantOrbs* 같은 내부 보상 트리거(실측 110개)를 자동으로 배제한다.
    #   기존 코드의 '"_Item_" in id' 문자열 검사는 그것들을 아이템으로 포함시켰다.
    referenced: set[str] = set()
    for item in combined_raw:
        referenced.update(item["composition"])
    component_raw = [by_api[a] for a in sorted(referenced) if a in by_api and _is_named(by_api[a])]
    component_ids = {c["apiName"] for c in component_raw}

    # 참조 무결성 (BR-2.4) — 재료가 하나라도 빠진 조합 아이템은 제외한다.
    # 프론트 조합법 Modal 이 items.find() 로 재료를 찾기 때문에, 없으면 깨진 자리가 노출된다.
    combined_raw = [i for i in combined_raw if all(r in component_ids for r in i["composition"])]

    out: list[dict] = []
    for item in combined_raw:
        out.append(
            {
                "id": item["apiName"],
                "name": item["name"],
                "type": "combined",
                "recipe": list(item["composition"]),
                "description": _clean_description(item.get("desc"), item.get("effects")),
                "iconUrl": cdragon.asset_url(item.get("icon")),
            }
        )
    for item in component_raw:
        out.append(
            {
                "id": item["apiName"],
                "name": item["name"],
                "type": "component",
                "recipe": None,
                "description": _clean_description(item.get("desc"), item.get("effects")),
                "iconUrl": cdragon.asset_url(item.get("icon")),
            }
        )

    # 변종 중복 제거는 재료를 확정한 뒤에 한다. 재료 역산(참조 무결성)은 원본 id 기준으로
    # 이미 끝났으므로, 여기서 대표를 고르는 것이 recipe 참조를 깨뜨리지 않는다.
    deduped = _dedupe_by_name(out)
    kept_ids = {i["id"] for i in deduped}
    # 대표로 선택되지 못한 재료를 recipe 가 가리키는 경우가 없어야 한다.
    deduped = [i for i in deduped if all(r in kept_ids for r in (i["recipe"] or []))]
    return sorted(deduped, key=lambda i: i["name"])


def reset_cache() -> None:
    """도메인 캐시와 원본 캐시를 함께 비운다. 테스트·수동 갱신용."""
    champions.cache_clear()
    items.cache_clear()
    cdragon.reset_cache()
