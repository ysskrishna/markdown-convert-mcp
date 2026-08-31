// Copyright (c) 2026 Y. Siva Sai Krishna. Ported from yssk markdown-to-teams. MIT.

/** Inline styles aligned with markdownme.com/tools/markdown-to-teams (Teams / Segoe UI). */

export const TEAMS_FONT =
  "font-family:'Segoe UI',system-ui,sans-serif;"

export const TEAMS_HEADING: Record<number, string> = {
  1: `${TEAMS_FONT}font-size:22px;font-weight:600;margin:18px 0 8px;color:#171717;`,
  2: `${TEAMS_FONT}font-size:18px;font-weight:600;margin:16px 0 8px;color:#171717;`,
  3: `${TEAMS_FONT}font-size:15px;font-weight:600;margin:14px 0 6px;color:#171717;`,
  4: `${TEAMS_FONT}font-size:14px;font-weight:600;margin:12px 0 6px;color:#171717;`,
  5: `${TEAMS_FONT}font-size:14px;font-weight:600;margin:12px 0 4px;color:#171717;`,
  6: `${TEAMS_FONT}font-size:14px;font-weight:600;margin:12px 0 4px;color:#171717;`,
}

export const TEAMS_BODY = `${TEAMS_FONT}font-size:14px;line-height:1.5;color:#242424;`

export const TEAMS_PARAGRAPH = `${TEAMS_BODY}margin:10px 0;`

export const TEAMS_UL = `${TEAMS_BODY}margin:10px 0;padding-left:22px;list-style-type:disc;`

export const TEAMS_OL = `${TEAMS_BODY}margin:10px 0;padding-left:22px;list-style-type:decimal;`

export const TEAMS_LI = "margin:4px 0;"

export const TEAMS_LINK = "color:#0f6cbd;text-decoration:underline;"

export const TEAMS_BLOCKQUOTE = `${TEAMS_BODY}margin:12px 0;padding:6px 0 6px 14px;border-left:3px solid #d1d1d1;color:#555;`

export const TEAMS_PRE = `${TEAMS_FONT}font-size:13px;line-height:1.4;margin:10px 0;padding:12px;background:#f5f5f5;border:1px solid #e1dfdd;border-radius:4px;white-space:pre-wrap;`

export const TEAMS_INLINE_CODE = `${TEAMS_FONT}font-size:13px;background:#f5f5f5;padding:1px 4px;border-radius:3px;`

export const TEAMS_TABLE = `${TEAMS_BODY}margin:10px 0;border-collapse:collapse;width:100%;`

export const TEAMS_TH = `${TEAMS_BODY}padding:6px 8px;border:1px solid #e1dfdd;background:#fafafa;font-weight:600;text-align:left;`

export const TEAMS_TD = `${TEAMS_BODY}padding:6px 8px;border:1px solid #e1dfdd;`

export const TEAMS_HR = "border:none;border-top:1px solid #e1dfdd;margin:12px 0;"
