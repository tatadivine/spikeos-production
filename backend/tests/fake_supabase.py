"""Minimal in-memory stand-in for the supabase-py query builder used by
app.repositories.spikeos. Only the operations the repository uses are supported."""
from __future__ import annotations

import copy
import uuid
from datetime import datetime, timezone


class _Result:
    def __init__(self, data, count=None):
        self.data = data
        self.count = count


def _get(row, col):
    if "->>" in col:
        base, key = col.split("->>", 1)
        value = (row.get(base) or {}).get(key)
        return None if value is None else str(value)
    return row.get(col)


class _Query:
    def __init__(self, db, table):
        self.db, self.table = db, table
        self.filters, self.op, self.payload = [], "select", None
        self.on_conflict, self._limit, self._order = None, None, None

    def select(self, *_a, **_k):
        self.op = "select"
        return self

    def insert(self, row):
        self.op, self.payload = "insert", row
        return self

    def upsert(self, row, on_conflict=None):
        self.op, self.payload, self.on_conflict = "upsert", row, on_conflict
        return self

    def update(self, updates):
        self.op, self.payload = "update", updates
        return self

    def delete(self):
        self.op = "delete"
        return self

    def eq(self, col, val):
        self.filters.append(lambda r: _get(r, col) == val)
        return self

    def neq(self, col, val):
        self.filters.append(lambda r: _get(r, col) != val)
        return self

    def in_(self, col, vals):
        vals = set(vals)
        self.filters.append(lambda r: _get(r, col) in vals)
        return self

    def order(self, col, desc=False):
        self._order = (col, desc)
        return self

    def limit(self, n):
        self._limit = n
        return self

    def _match(self):
        return [r for r in self.db.setdefault(self.table, []) if all(f(r) for f in self.filters)]

    def execute(self):
        rows = self.db.setdefault(self.table, [])
        now = datetime.now(timezone.utc).isoformat()
        if self.op == "insert":
            new = {"id": str(uuid.uuid4()), "created_at": now, **copy.deepcopy(self.payload)}
            rows.append(new)
            return _Result([copy.deepcopy(new)])
        if self.op == "upsert":
            key = self.on_conflict or "id"
            existing = next((r for r in rows if r.get(key) == self.payload.get(key)), None)
            if existing:
                existing.update(copy.deepcopy(self.payload))
                return _Result([copy.deepcopy(existing)])
            new = {"id": str(uuid.uuid4()), "created_at": now, **copy.deepcopy(self.payload)}
            rows.append(new)
            return _Result([copy.deepcopy(new)])
        matched = self._match()
        if self.op == "update":
            for r in matched:
                r.update(copy.deepcopy(self.payload))
            return _Result([copy.deepcopy(r) for r in matched])
        if self.op == "delete":
            for r in matched:
                rows.remove(r)
            return _Result([copy.deepcopy(r) for r in matched])
        if self._order:
            col, desc = self._order
            matched = sorted(matched, key=lambda r: str(r.get(col) or ""), reverse=desc)
        if self._limit is not None:
            matched = matched[: self._limit]
        return _Result([copy.deepcopy(r) for r in matched], count=len(matched))


class FakeClient:
    def __init__(self):
        self.db: dict[str, list[dict]] = {}

    def table(self, name):
        return _Query(self.db, name)
