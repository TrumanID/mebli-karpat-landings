# Translation workflow (SPEC §5A.4)

`machine_draft` → `reviewed` → `approved`. `stale` is derived from `sourceHash`. Nothing below `reviewed` is published.

All current DE and EN text was drafted by Claude and has status `machine_draft`: a native speaker must review it, then set `meta.status`, `reviewedBy` and `reviewedAt`.
