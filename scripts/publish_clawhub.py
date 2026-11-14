#!/usr/bin/env python3
"""Publish markdown-convert skill and OpenClaw bundle package to ClawHub."""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

CLAWHUB_SLUG_MAP = {
    "markdown-convert": "markdown-convert",
}

OWNER_HANDLE = "ysskrishna"
PACKAGE_NAME = "@ysskrishna/markdown-convert-mcp"
PACKAGE_DISPLAY_NAME = "Markdown Convert MCP"
PACKAGE_TOPICS = "mcp,markdown,slack,jira,agent-tools"
SKILL_CATEGORIES = "agents,tools"
REGISTRY_URL = "https://clawhub.ai"
RATE_LIMIT_RETRIES = 5
BUNDLE_HOST_MANIFEST = (".cursor-plugin", "plugin.json")
BUNDLE_FORMAT = "cursor"

ROOT = Path(__file__).resolve().parents[1]
SKILLS_DIR = ROOT / "skills"
SyncStatus = Literal["new", "update", "synced"]


@dataclass(frozen=True)
class SyncState:
    folder: str
    slug: str
    status: SyncStatus
    local_version: str
    registry_version: str | None


@dataclass(frozen=True)
class PackageSyncState:
    status: SyncStatus
    local_version: str
    registry_version: str | None


def title_case(slug: str) -> str:
    return " ".join(part.capitalize() for part in slug.split("-"))


def version(skill_dir: Path) -> str:
    text = (skill_dir / "SKILL.md").read_text()
    m = re.search(r"^\s*version:\s*[\"']?([^\"'\n]+)", text, re.M)
    if not m:
        raise SystemExit(f"no version in {skill_dir}/SKILL.md")
    return m.group(1).strip().strip('"')


def repo_release_version() -> str:
    ver = json.loads((ROOT / "package.json").read_text()).get("version")
    if not isinstance(ver, str) or not ver.strip():
        raise SystemExit("package.json version required")
    return ver.strip()


def clawhub_slug(folder: str) -> str:
    if folder in CLAWHUB_SLUG_MAP:
        return CLAWHUB_SLUG_MAP[folder]
    raise SystemExit(f"add {folder!r} to CLAWHUB_SLUG_MAP")


def target_folders() -> list[str]:
    folders: list[str] = []
    for path in sorted(SKILLS_DIR.iterdir()):
        if path.is_dir() and (path / "SKILL.md").is_file():
            clawhub_slug(path.name)  # exits if the folder has no slug mapping
            folders.append(path.name)
    if not folders:
        raise SystemExit("no skills with CLAWHUB_SLUG_MAP entry")
    return folders


def registry_get(path: str, owner: str | None) -> tuple[int, dict | str]:
    url = f"{REGISTRY_URL}{path}"
    if owner:
        url += "?" + urllib.parse.urlencode({"owner": owner})
    for _ in range(RATE_LIMIT_RETRIES):
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                body = response.read()
                if not body:
                    return response.status, {}
                return response.status, json.loads(body)
        except urllib.error.HTTPError as err:
            if err.code == 429:
                time.sleep(int(err.headers.get("ratelimit-reset") or 10) + 1)
                continue
            try:
                return err.code, json.loads(err.read())
            except json.JSONDecodeError:
                return err.code, err.read().decode(errors="replace")
        except urllib.error.URLError as err:
            raise SystemExit(f"registry unreachable: {err.reason}") from err
    raise SystemExit(f"rate limit: {path}")


def inspect_registry_version(slug: str) -> str | None:
    status, data = registry_get(f"/api/v1/skills/{urllib.parse.quote(slug)}", OWNER_HANDLE)
    if status == 404:
        return None
    if status != 200 or not isinstance(data, dict):
        raise SystemExit(f"unexpected skill registry response for {slug}: {data}")
    latest = data.get("latestVersion") or {}
    if latest.get("version"):
        return str(latest["version"]).strip()
    tagged = (data.get("skill") or {}).get("tags", {}).get("latest")
    return str(tagged).strip() if tagged else None


def inspect_package_registry_version() -> str | None:
    path = f"/api/v1/packages/{urllib.parse.quote(PACKAGE_NAME, safe='')}"
    status, data = registry_get(path, OWNER_HANDLE)
    if status == 404:
        return None
    if status != 200 or not isinstance(data, dict):
        raise SystemExit(f"unexpected package registry response: {data}")
    latest = (data.get("package") or {}).get("latestVersion")
    return str(latest).strip() if latest else None


def check_sync_state(folder: str) -> SyncState:
    slug = clawhub_slug(folder)
    path = SKILLS_DIR / folder
    local = version(path)
    registry = inspect_registry_version(slug)
    if registry is None:
        return SyncState(folder, slug, "new", local, None)
    if local == registry:
        return SyncState(folder, slug, "synced", local, registry)
    return SyncState(folder, slug, "update", local, registry)


def check_package_sync_state() -> PackageSyncState:
    local = repo_release_version()
    oc_ver = json.loads((ROOT / "openclaw.plugin.json").read_text()).get("version")
    if oc_ver != local:
        raise SystemExit("openclaw.plugin.json version != package.json")
    registry = inspect_package_registry_version()
    if registry is None:
        return PackageSyncState("new", local, None)
    if local == registry:
        return PackageSyncState("synced", local, registry)
    return PackageSyncState("update", local, registry)


def format_skill_line(state: SyncState) -> str:
    if state.status == "synced":
        return f"{state.folder}  synced  ({state.local_version})"
    if state.status == "new":
        return f"{state.folder}  new  ({state.local_version})"
    return f"{state.folder}  update  local {state.local_version} → registry {state.registry_version}"


def format_package_line(state: PackageSyncState) -> str:
    if state.status == "synced":
        return f"{PACKAGE_NAME}  synced  ({state.local_version})"
    if state.status == "new":
        return f"{PACKAGE_NAME}  new  ({state.local_version})"
    return f"{PACKAGE_NAME}  update  local {state.local_version} → registry {state.registry_version}"


def publish_skill_cmd(folder: str) -> list[str]:
    slug = clawhub_slug(folder)
    path = SKILLS_DIR / folder
    ver = version(path)
    return [
        "clawhub", "skill", "publish", str(path),
        "--slug", slug,
        "--name", title_case(slug),
        "--version", ver,
        "--changelog", f"Release version: {ver}",
        "--tags", "latest",
        "--categories", SKILL_CATEGORIES,
        "--topics", PACKAGE_TOPICS,
    ]


def prepare_bundle_source(stage: Path) -> None:
    for name in (
        "openclaw.plugin.json", "package.json", "README.md", "LICENSE",
        "CHANGELOG.md", "index.js", ".mcp.json",
    ):
        shutil.copy2(ROOT / name, stage / name)
    shutil.copytree(ROOT / "skills", stage / "skills")
    shutil.copytree(ROOT / "assets", stage / "assets")
    host_dir, host_file = BUNDLE_HOST_MANIFEST
    dest = stage / host_dir
    dest.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / host_dir / host_file, dest / host_file)


def git_head() -> str:
    return subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, check=True, capture_output=True, text=True,
    ).stdout.strip()


def package_publish_cmd(ver: str, source_dir: Path, dry_run: bool) -> list[str]:
    return [
        "clawhub", "package", "publish", str(source_dir),
        "--family", "bundle-plugin",
        "--bundle-format", BUNDLE_FORMAT,
        "--source-repo", "ysskrishna/markdown-convert-mcp",
        "--source-commit", git_head(),
        "--source-ref", f"v{ver}",
        *(["--dry-run"] if dry_run else []),
        "--owner", OWNER_HANDLE,
        "--name", PACKAGE_NAME,
        "--display-name", PACKAGE_DISPLAY_NAME,
        "--version", ver,
        "--changelog", f"Release version: {ver}",
        "--tags", "latest",
        "--topics", PACKAGE_TOPICS,
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description="ClawHub skill + bundle publish")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("plan", help="Per-skill sync status")
    sub.add_parser("publish", help="Publish updated skills")
    package = sub.add_parser("package", help="Bundle package")
    pkg_sub = package.add_subparsers(dest="pkg_cmd", required=True)
    pkg_sub.add_parser("plan")
    pub = pkg_sub.add_parser("publish")
    pub.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.command == "plan":
        for folder in target_folders():
            print(format_skill_line(check_sync_state(folder)))
        return
    if args.command == "publish":
        n = 0
        for folder in target_folders():
            state = check_sync_state(folder)
            print(format_skill_line(state))
            if state.status != "synced":
                subprocess.run(publish_skill_cmd(folder), check=True)
                n += 1
                time.sleep(1)
        if n == 0:
            print("Nothing to publish.")
        return

    if args.pkg_cmd == "plan":
        print(format_package_line(check_package_sync_state()))
        return
    state = check_package_sync_state()
    print(format_package_line(state))
    if state.status == "synced":
        print("Nothing to publish.")
        return
    with tempfile.TemporaryDirectory(prefix="clawpack-") as tmp:
        stage = Path(tmp) / "source"
        stage.mkdir()
        prepare_bundle_source(stage)
        subprocess.run(package_publish_cmd(state.local_version, stage, args.dry_run), check=True)


if __name__ == "__main__":
    main()