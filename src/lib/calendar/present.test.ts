import assert from "node:assert/strict";
import test from "node:test";
import { coversDay, sameSlot } from "./present.ts";

const base = {
  startTime: "18:00",
  endTime: "19:00",
  repeat: "none" as const,
};

test("a plain event only covers its own days", () => {
  const event = { ...base, startDate: "2026-11-05", endDate: "2026-11-07" };
  assert.equal(coversDay(event, "2026-11-04"), false);
  assert.equal(coversDay(event, "2026-11-05"), true);
  assert.equal(coversDay(event, "2026-11-07"), true);
  assert.equal(coversDay(event, "2026-11-08"), false);
});

test("weekly and biweekly land on the right days", () => {
  const weekly = { ...base, startDate: "2026-11-02", endDate: "2026-11-04", repeat: "weekly" };
  assert.equal(coversDay(weekly, "2026-11-02"), true);
  assert.equal(coversDay(weekly, "2026-11-04"), true);
  assert.equal(coversDay(weekly, "2026-11-05"), false);
  assert.equal(coversDay(weekly, "2026-11-09"), true);
  assert.equal(coversDay(weekly, "2026-11-11"), true);
  assert.equal(coversDay(weekly, "2026-11-12"), false);
  assert.equal(coversDay(weekly, "2026-11-01"), false);

  const biweekly = { ...base, startDate: "2026-11-02", endDate: "2026-11-02", repeat: "biweekly" };
  assert.equal(coversDay(biweekly, "2026-11-09"), false);
  assert.equal(coversDay(biweekly, "2026-11-16"), true);
});

test("monthly clamps short months and yearly keeps the date", () => {
  const monthly = { ...base, startDate: "2026-01-31", endDate: "2026-01-31", repeat: "monthly" };
  assert.equal(coversDay(monthly, "2026-02-28"), true);
  assert.equal(coversDay(monthly, "2026-02-27"), false);
  assert.equal(coversDay(monthly, "2026-03-31"), true);

  const yearly = { ...base, startDate: "2026-11-05", endDate: "2026-11-05", repeat: "yearly" };
  assert.equal(coversDay(yearly, "2027-11-05"), true);
  assert.equal(coversDay(yearly, "2027-11-06"), false);
});

test("daily covers later days and an undated event covers none", () => {
  const daily = { ...base, startDate: "2026-11-05", endDate: "2026-11-05", repeat: "daily" };
  assert.equal(coversDay(daily, "2026-11-06"), true);
  assert.equal(coversDay({ ...base, startDate: null, endDate: null }, "2026-11-06"), false);
});

test("the same clock time is one slot", () => {
  assert.equal(
    sameSlot(
      { startDate: "2026-11-05", endDate: "2026-11-05", startTime: "18:00", endTime: "19:00" },
      { startDate: "2026-11-05", endDate: "2026-11-05", startTime: "18:00", endTime: "19:00" },
    ),
    true,
  );
  assert.equal(
    sameSlot(
      { startDate: "2026-11-05", endDate: null, startTime: "18:00", endTime: "19:00" },
      { startDate: "2026-11-05", endDate: "2026-11-05", startTime: "18:00", endTime: "19:30" },
    ),
    false,
  );
});
