"""static_data.py 단위 테스트 — 선별(BR-1, BR-2) · 변환(BR-3) · 참조 무결성(BR-2.4)."""
import pytest

from app.services import static_data


# ── 설명 정제 (BR-3.2) ────────────────────────────────────────────
class TestCleanDescription:
    def test_resolves_variable_with_multiplier(self):
        got = static_data._clean_description("공격력 %i:scaleAD%+@AD*100@%", {"AD": 0.1})
        assert got == "공격력 +10%"

    def test_resolves_plain_variable(self):
        got = static_data._clean_description("방어력 @Armor@ 증가", {"Armor": 25.0})
        assert got == "방어력 25 증가"

    def test_strips_markup_tags(self):
        got = static_data._clean_description("<TFTKeyword>정밀</TFTKeyword>을 얻습니다.", {})
        assert got == "정밀을 얻습니다."

    def test_br_becomes_newline(self):
        assert static_data._clean_description("첫 줄<br>둘째 줄", {}) == "첫 줄\n둘째 줄"

    def test_drops_unresolvable_runtime_placeholder_line(self):
        """@TFTUnitProperty...@ 는 인게임 실시간 값이라 정적으로 해석 불가."""
        got = static_data._clean_description(
            "효과 설명<br>회복량: @TFTUnitProperty.item:TFT_Tracker_Value1@", {}
        )
        assert got == "효과 설명"

    def test_strips_template_references(self):
        assert static_data._clean_description("설명{{TFT_Keyword_X}}", {}) == "설명"

    def test_float_noise_is_rounded(self):
        got = static_data._clean_description("@AD*100@", {"AD": 0.10000000149011612})
        assert got == "10"

    def test_keeps_meaningful_decimals(self):
        assert static_data._clean_description("@X@", {"X": 2.5}) == "2.5"

    @pytest.mark.parametrize("value", [None, ""])
    def test_empty_input(self, value):
        assert static_data._clean_description(value, {}) is None

    def test_all_placeholder_yields_none(self):
        assert static_data._clean_description("@Unknown@", {}) is None


# ── 변종 중복 제거 (BR-2.7) ───────────────────────────────────────
class TestDedupeByName:
    def test_keeps_shortest_id_as_canonical(self):
        entries = [
            {"id": "TFT_Item_CorruptedInfinityEdge", "name": "무한의 대검", "recipe": None},
            {"id": "TFT_Item_InfinityEdge", "name": "무한의 대검", "recipe": None},
        ]
        got = static_data._dedupe_by_name(entries)
        assert len(got) == 1
        assert got[0]["id"] == "TFT_Item_InfinityEdge"

    def test_distinct_names_are_all_kept(self):
        entries = [
            {"id": "A", "name": "가", "recipe": None},
            {"id": "B", "name": "나", "recipe": None},
        ]
        assert len(static_data._dedupe_by_name(entries)) == 2

    def test_is_deterministic_for_equal_length_ids(self):
        entries = [
            {"id": "BBB", "name": "같은이름", "recipe": None},
            {"id": "AAA", "name": "같은이름", "recipe": None},
        ]
        assert static_data._dedupe_by_name(entries)[0]["id"] == "AAA"


# ── 챔피언 선별 (BR-1) ────────────────────────────────────────────
class TestChampions:
    def test_excludes_units_without_traits(self, patched):
        ids = {c["id"] for c in static_data.champions()}
        assert "TFT17_Golem" not in ids  # traits 가 빈 배열 → PVE 몬스터

    def test_excludes_cost_outside_range(self, patched):
        ids = {c["id"] for c in static_data.champions()}
        assert "TFT_BlueGolem" not in ids  # cost 0

    def test_includes_playable_champions(self, patched):
        ids = {c["id"] for c in static_data.champions()}
        assert ids == {"TFT17_Briar", "TFT17_Ahri"}

    def test_traits_are_populated(self, patched):
        briar = next(c for c in static_data.champions() if c["id"] == "TFT17_Briar")
        assert briar["traits"] == ["파멸자", "맹공격"]

    def test_uses_tile_icon_not_square_icon(self, patched):
        """squareIcon 은 이름과 달리 스플래시 아트다. 그리드용은 tileIcon."""
        briar = next(c for c in static_data.champions() if c["id"] == "TFT17_Briar")
        assert "hud" in briar["iconUrl"] and "splash" not in briar["iconUrl"]

    def test_sorted_by_cost_then_name(self, patched):
        got = [(c["cost"], c["name"]) for c in static_data.champions()]
        assert got == sorted(got)

    def test_contract_fields_present(self, patched):
        """frontend/src/types/domain.ts 의 Champion 계약."""
        for c in static_data.champions():
            assert set(c) == {"id", "name", "cost", "traits", "iconUrl"}

    def test_empty_source_yields_empty_list(self, monkeypatch):
        from app.services import cdragon

        static_data.reset_cache()
        monkeypatch.setattr(cdragon, "_snapshot", lambda: dict(cdragon._EMPTY))
        assert static_data.champions() == []
        static_data.reset_cache()


# ── 아이템 선별 (BR-2) ────────────────────────────────────────────
class TestItems:
    def test_classifies_combined_and_component(self, patched):
        by_id = {i["id"]: i for i in static_data.items()}
        assert by_id["TFT_Item_InfinityEdge"]["type"] == "combined"
        assert by_id["TFT_Item_BFSword"]["type"] == "component"

    def test_component_derived_from_composition_not_hardcoded(self, patched):
        """조합 아이템이 참조하는 것만 재료가 된다."""
        comps = {i["id"] for i in static_data.items() if i["type"] == "component"}
        assert comps == {"TFT_Item_BFSword", "TFT_Item_SparringGloves", "TFT_Item_ChainVest"}

    def test_recipe_populated_for_combined(self, patched):
        by_id = {i["id"]: i for i in static_data.items()}
        assert by_id["TFT_Item_InfinityEdge"]["recipe"] == [
            "TFT_Item_BFSword",
            "TFT_Item_SparringGloves",
        ]

    def test_recipe_is_none_for_component(self, patched):
        by_id = {i["id"]: i for i in static_data.items()}
        assert by_id["TFT_Item_BFSword"]["recipe"] is None

    def test_includes_current_set_items(self, patched):
        assert "TFT17_Item_SetSpecial" in {i["id"] for i in static_data.items()}

    def test_excludes_previous_set_items(self, patched):
        assert "TFT6_Item_Legacy" not in {i["id"] for i in static_data.items()}

    def test_excludes_untranslated_items(self, patched):
        ids = {i["id"] for i in static_data.items()}
        assert "TFT_Item_CursedBlade" not in ids
        assert not any(i["name"].startswith("tft_item_name_") for i in static_data.items())

    def test_excludes_internal_reward_triggers(self, patched):
        """GrantOrbs 류는 아이템이 아니다.

        기존 코드의 '"_Item_" in id' 문자열 검사는 이것들을 통과시켰다.
        composition 관계 기반 판별이 자동으로 배제한다.
        """
        assert "TFT_Item_GrantOrbs1" not in {i["id"] for i in static_data.items()}

    def test_referential_integrity_drops_broken_recipes(self, patched):
        """재료가 목록에 없는 조합 아이템은 제외된다 (BR-2.4)."""
        assert "TFT_Item_Broken" not in {i["id"] for i in static_data.items()}

    def test_every_recipe_reference_resolves(self, patched):
        result = static_data.items()
        ids = {i["id"] for i in result}
        for item in result:
            for ref in item["recipe"] or []:
                assert ref in ids

    def test_sorted_by_name(self, patched):
        names = [i["name"] for i in static_data.items()]
        assert names == sorted(names)

    def test_contract_fields_present(self, patched):
        """frontend/src/types/domain.ts 의 Item 계약."""
        for i in static_data.items():
            assert set(i) == {"id", "name", "type", "recipe", "description", "iconUrl"}

    def test_empty_source_yields_empty_list(self, monkeypatch):
        from app.services import cdragon

        static_data.reset_cache()
        monkeypatch.setattr(cdragon, "_snapshot", lambda: dict(cdragon._EMPTY))
        assert static_data.items() == []
        static_data.reset_cache()
