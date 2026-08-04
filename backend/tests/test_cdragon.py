"""cdragon.py 단위 테스트 — 에셋 URL 변환 · 세트 결정 · 실패 폴백."""
import time

import pytest
import requests

from app.services import cdragon


# ── asset_url (BR-4) ──────────────────────────────────────────────
class TestAssetUrl:
    def test_tex_becomes_png_and_lowercased(self):
        got = cdragon.asset_url("ASSETS/Characters/TFT17_Briar/HUD/TFT17_Briar_Square.tex")
        assert got == (
            "https://raw.communitydragon.org/latest/game/"
            "assets/characters/tft17_briar/hud/tft17_briar_square.png"
        )

    def test_dds_becomes_png(self):
        assert cdragon.asset_url("ASSETS/X.dds").endswith("assets/x.png")

    def test_other_extension_kept(self):
        assert cdragon.asset_url("ASSETS/X.png").endswith("assets/x.png")

    @pytest.mark.parametrize("value", [None, ""])
    def test_empty_input_returns_none(self, value):
        assert cdragon.asset_url(value) is None

    def test_leading_slash_does_not_double_up(self):
        assert "game//" not in cdragon.asset_url("/ASSETS/X.tex")


# ── set_number (BR-5) ─────────────────────────────────────────────
class TestSetNumber:
    def test_defaults_when_unset(self, monkeypatch):
        monkeypatch.delenv("TFT_SET", raising=False)
        assert cdragon.set_number() == cdragon.DEFAULT_SET

    def test_reads_env(self, monkeypatch):
        monkeypatch.setenv("TFT_SET", "18")
        assert cdragon.set_number() == "18"

    def test_strips_whitespace(self, monkeypatch):
        monkeypatch.setenv("TFT_SET", "  18  ")
        assert cdragon.set_number() == "18"


# ── _extract ──────────────────────────────────────────────────────
class TestExtract:
    def test_picks_requested_set_and_global_items(self):
        payload = {
            "sets": {"17": {"champions": [{"apiName": "A"}], "traits": [{"apiName": "T"}]}},
            "items": [{"apiName": "I"}],
        }
        got = cdragon._extract(payload, "17")
        assert got["setNumber"] == "17"
        assert got["champions"] == [{"apiName": "A"}]
        assert got["items"] == [{"apiName": "I"}]
        assert got["fetchedAt"] > 0

    def test_missing_set_degrades_to_empty(self):
        got = cdragon._extract({"sets": {"16": {}}, "items": [{"apiName": "I"}]}, "17")
        assert got["champions"] == []
        assert got["items"] == []

    def test_malformed_payload_does_not_raise(self):
        assert cdragon._extract({}, "17")["champions"] == []


# ── 실패 폴백 (BR-7) ──────────────────────────────────────────────
class TestFailureFallback:
    def test_network_error_returns_empty_without_raising(self, monkeypatch):
        def boom(*a, **kw):
            raise requests.RequestException("network down")

        monkeypatch.setattr(requests, "get", boom)
        got = cdragon._fetch_remote("17")
        assert got["champions"] == [] and got["items"] == []

    def test_non_200_returns_empty(self, monkeypatch):
        class Resp:
            status_code = 503

            def json(self):
                raise AssertionError("본문을 읽으면 안 된다")

        monkeypatch.setattr(requests, "get", lambda *a, **kw: Resp())
        assert cdragon._fetch_remote("17")["champions"] == []

    def test_invalid_json_returns_empty(self, monkeypatch):
        class Resp:
            status_code = 200

            def json(self):
                raise ValueError("not json")

        monkeypatch.setattr(requests, "get", lambda *a, **kw: Resp())
        assert cdragon._fetch_remote("17")["items"] == []

    def test_public_readers_never_raise_on_failure(self, monkeypatch):
        monkeypatch.setattr(cdragon, "_read_disk", lambda s: None)
        monkeypatch.setattr(cdragon, "_fetch_remote", lambda s: dict(cdragon._EMPTY))
        cdragon.reset_cache()
        assert cdragon.champions_raw() == []
        assert cdragon.items_raw() == []
        assert cdragon.traits_raw() == []
        cdragon.reset_cache()


# ── 디스크 캐시 (BR-6.2) ──────────────────────────────────────────
class TestDiskCache:
    def test_roundtrip(self, monkeypatch, tmp_path):
        path = tmp_path / "c.json"
        monkeypatch.setattr(cdragon, "_cache_path", lambda s: str(path))
        data = {"setNumber": "17", "champions": [{"a": 1}], "items": [], "fetchedAt": time.time()}
        cdragon._write_disk("17", data)
        assert cdragon._read_disk("17")["champions"] == [{"a": 1}]

    def test_expired_cache_is_rejected(self, monkeypatch, tmp_path):
        path = tmp_path / "c.json"
        monkeypatch.setattr(cdragon, "_cache_path", lambda s: str(path))
        stale = time.time() - cdragon.CACHE_TTL_SECONDS - 1
        cdragon._write_disk("17", {"setNumber": "17", "champions": [], "fetchedAt": stale})
        assert cdragon._read_disk("17") is None

    def test_missing_file_returns_none(self, monkeypatch, tmp_path):
        monkeypatch.setattr(cdragon, "_cache_path", lambda s: str(tmp_path / "nope.json"))
        assert cdragon._read_disk("17") is None

    def test_corrupt_file_returns_none(self, monkeypatch, tmp_path):
        path = tmp_path / "c.json"
        path.write_text("{ not json", encoding="utf-8")
        monkeypatch.setattr(cdragon, "_cache_path", lambda s: str(path))
        assert cdragon._read_disk("17") is None

    def test_unwritable_path_does_not_raise(self, monkeypatch):
        monkeypatch.setattr(cdragon, "_cache_path", lambda s: "/nonexistent\x00/bad.json")
        cdragon._write_disk("17", {"fetchedAt": time.time()})  # 예외가 나지 않아야 한다
