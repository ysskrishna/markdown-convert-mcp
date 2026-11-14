#!/usr/bin/env python3
import argparse
import json
import shutil
import subprocess
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

OWNER = "ysskrishna"
PKG = "@ysskrishna/markdown-convert-mcp"
DISPLAY = "Markdown Convert MCP"
TOPICS = "mcp,markdown,slack,jira,agent-tools"
REGISTRY = "https://clawhub.ai"
ROOT = Path(__file__).resolve().parents[1]
STAGE_FILES = (
    "openclaw.plugin.json",
    "package.json",
    "README.md",
    "LICENSE",
    "CHANGELOG.md",
    ".mcp.json",
)


def local_version() -> str:
    v = json.loads((ROOT / "package.json").read_text()).get("version")
    if not isinstance(v, str) or not v.strip():
        raise SystemExit("package.json version required")
    return v.strip()


def registry_version() -> str | None:
    url = f"{REGISTRY}/api/v1/packages/{urllib.parse.quote(PKG, safe='')}?owner={OWNER}"
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            data = json.loads(r.read())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise SystemExit(f"clawhub registry error {e.code}") from e
    pkg = (data or {}).get("package") or {}
    latest = pkg.get("latestVersion")
    return str(latest).strip() if latest else None


def status() -> tuple[str, str, str | None]:
    local = local_version()
    if json.loads((ROOT / "openclaw.plugin.json").read_text()).get("version") != local:
        raise SystemExit("openclaw.plugin.json version != package.json")
    remote = registry_version()
    if remote is None:
        return "new", local, None
    if local == remote:
        return "synced", local, remote
    return "update", local, remote


def print_status() -> tuple[str, str]:
    kind, local, remote = status()
    if kind == "synced":
        print(f"{PKG}  synced  ({local})")
    elif kind == "new":
        print(f"{PKG}  new  ({local})")
    else:
        print(f"{PKG}  update  local {local} → registry {remote}")
    return kind, local


def stage_into(dest: Path) -> None:
    for name in STAGE_FILES:
        shutil.copy2(ROOT / name, dest / name)
    shutil.copytree(ROOT / "skills", dest / "skills")
    shutil.copytree(ROOT / "assets", dest / "assets")
    plug = dest / ".cursor-plugin"
    plug.mkdir(parents=True)
    shutil.copy2(ROOT / ".cursor-plugin/plugin.json", plug / "plugin.json")


def publish(local: str, src: Path, dry_run: bool) -> None:
    head = subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, check=True, capture_output=True, text=True
    ).stdout.strip()
    cmd = [
        "clawhub", "package", "publish", str(src),
        "--family", "bundle-plugin", "--bundle-format", "cursor",
        "--source-repo", "ysskrishna/markdown-convert-mcp",
        "--source-commit", head, "--source-ref", f"v{local}",
        "--owner", OWNER, "--name", PKG, "--display-name", DISPLAY,
        "--version", local, "--changelog", f"Release version: {local}",
        "--tags", "latest", "--topics", TOPICS,
    ]
    if dry_run:
        cmd.append("--dry-run")
    subprocess.run(cmd, check=True)


def main() -> None:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("plan")
    pub = sub.add_parser("publish")
    pub.add_argument("--dry-run", action="store_true")
    args = p.parse_args()
    if args.cmd == "plan":
        print_status()
        return
    kind, local = print_status()
    if kind == "synced":
        print("Nothing to publish.")
        return
    with tempfile.TemporaryDirectory(prefix="clawpack-") as tmp:
        src = Path(tmp) / "source"
        src.mkdir()
        stage_into(src)
        publish(local, src, args.dry_run)


if __name__ == "__main__":
    main()