"""U1 테스트 공용 픽스처.

실제 네트워크에 의존하는 테스트는 만들지 않는다. CDragon 응답 구조를 본뜬
작은 샘플 스냅샷으로 변환 로직만 검증한다.
"""
import os
import sys

import pytest

# backend/ 를 임포트 경로에 추가 (backend 폴더에서 uvicorn app.main:app 으로 띄우는 것과 동일한 기준)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services import cdragon, static_data  # noqa: E402


@pytest.fixture
def sample_snapshot():
    """CDragon 구조를 축약한 샘플. 실데이터에서 관측한 특징을 그대로 담았다.

    - 특성 없는 PVE 유닛 (걸러져야 함)
    - cost 0 유닛 (걸러져야 함)
    - 미번역 아이템 (걸러져야 함)
    - GrantOrbs 류 내부 트리거 (걸러져야 함)
    - 구세트 조합 아이템 (걸러져야 함)
    """
    return {
        "setNumber": "17",
        "champions": [
            {
                "apiName": "TFT17_Briar",
                "name": "브라이어",
                "cost": 1,
                "traits": ["파멸자", "맹공격"],
                "tileIcon": "ASSETS/Characters/TFT17_Briar/HUD/TFT17_Briar_Square.tex",
                "squareIcon": "ASSETS/Characters/TFT17_Briar/Skins/Base/Images/splash.tex",
            },
            {
                "apiName": "TFT17_Ahri",
                "name": "아리",
                "cost": 4,
                "traits": ["마법사"],
                "tileIcon": "ASSETS/Characters/TFT17_Ahri/HUD/TFT17_Ahri_Square.tex",
            },
            {
                "apiName": "TFT17_Golem",
                "name": "골렘",
                "cost": 1,
                "traits": [],  # 특성 없음 → PVE 몬스터, 제외 대상
                "tileIcon": "ASSETS/x.tex",
            },
            {
                "apiName": "TFT_BlueGolem",
                "name": "돌거인",
                "cost": 0,  # 비용 범위 밖 → 제외 대상
                "traits": ["몬스터"],
                "tileIcon": "ASSETS/y.tex",
            },
        ],
        "traits": [{"apiName": "TFT17_Doomer", "name": "파멸자", "icon": "ASSETS/t.tex"}],
        "items": [
            # 기본 재료 — composition 이 없지만 조합 아이템이 참조한다
            {"apiName": "TFT_Item_BFSword", "name": "B.F. 대검", "icon": "ASSETS/i/bf.tex"},
            {"apiName": "TFT_Item_SparringGloves", "name": "쇠약의 장갑", "icon": "ASSETS/i/gl.tex"},
            {"apiName": "TFT_Item_ChainVest", "name": "사슬 조끼", "icon": "ASSETS/i/cv.tex"},
            # 클래식 조합 아이템
            {
                "apiName": "TFT_Item_InfinityEdge",
                "name": "무한의 대검",
                "desc": "치명타 확률 증가",
                "composition": ["TFT_Item_BFSword", "TFT_Item_SparringGloves"],
                "icon": "ASSETS/i/ie.tex",
            },
            # 현재 세트 전용 조합 아이템
            {
                "apiName": "TFT17_Item_SetSpecial",
                "name": "세트 전용 아이템",
                "composition": ["TFT_Item_ChainVest", "TFT_Item_ChainVest"],
                "icon": "ASSETS/i/ss.tex",
            },
            # 구세트 조합 아이템 → 접두사 불일치로 제외 대상
            {
                "apiName": "TFT6_Item_Legacy",
                "name": "구세트 아이템",
                "composition": ["TFT_Item_BFSword", "TFT_Item_BFSword"],
                "icon": "ASSETS/i/old.tex",
            },
            # 미번역 항목 → 제외 대상
            {
                "apiName": "TFT_Item_CursedBlade",
                "name": "tft_item_name_CursedBlade",
                "composition": ["TFT_Item_BFSword", "TFT_Item_ChainVest"],
                "icon": "ASSETS/i/cb.tex",
            },
            # 내부 보상 트리거 → composition 이 없고 참조되지도 않으므로 제외 대상
            {"apiName": "TFT_Item_GrantOrbs1", "name": "구슬 지급", "icon": "ASSETS/i/orb.tex"},
            # 재료가 목록에 없는 조합 아이템 → 참조 무결성 위반, 제외 대상
            {
                "apiName": "TFT_Item_Broken",
                "name": "재료없는 아이템",
                "composition": ["TFT_Item_DoesNotExist"],
                "icon": "ASSETS/i/br.tex",
            },
        ],
        "fetchedAt": 0.0,
    }


@pytest.fixture
def patched(monkeypatch, sample_snapshot):
    """cdragon._snapshot() 을 샘플로 대체하고 캐시를 비운다."""
    static_data.reset_cache()
    monkeypatch.setattr(cdragon, "_snapshot", lambda: sample_snapshot)
    yield
    static_data.reset_cache()
