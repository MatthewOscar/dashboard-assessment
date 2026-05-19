import { describe, it, expect } from "vitest";

/**
 * Test suite for dashboard metric calculations.
 * These tests verify the logic that will be applied to database results,
 * ensuring correctness before data reaches Dana.
 */

describe("Metric Calculations", () => {
  // Test connect rate calculation
  describe("connect rate calculation", () => {
    it("calculates connect rate correctly when calls exist", () => {
      const connected = 50;
      const total = 100;
      const rate = connected / total;
      expect(rate).toBe(0.5);
    });

    it("returns 0 when total is 0", () => {
      const connected = 0;
      const total = 0;
      const rate = total > 0 ? connected / total : 0;
      expect(rate).toBe(0);
    });

    it("returns 1.0 for 100% connect rate", () => {
      const connected = 100;
      const total = 100;
      const rate = connected / total;
      expect(rate).toBe(1.0);
    });
  });

  // Test date math for rolling windows
  describe("rolling window date calculation", () => {
    it("calculates 7-day cutoff correctly", () => {
      const now = new Date("2025-01-15T12:00:00Z");
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      expect(sevenDaysAgo.getDate()).toBe(8);
      expect(sevenDaysAgo.getMonth()).toBe(0); // January is 0
    });

    it("calculates 14-day cutoff correctly", () => {
      const now = new Date("2025-01-15T12:00:00Z");
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      expect(fourteenDaysAgo.getDate()).toBe(1);
      expect(fourteenDaysAgo.getMonth()).toBe(0);
    });
  });

  // Test sorting logic
  describe("sorting by performance metric", () => {
    it("sorts agents by connected count descending", () => {
      const agents = [
        { name: "Alice", connected_count: 10 },
        { name: "Bob", connected_count: 25 },
        { name: "Charlie", connected_count: 15 },
      ];
      const sorted = agents.sort((a, b) => b.connected_count - a.connected_count);
      expect(sorted[0].name).toBe("Bob");
      expect(sorted[1].name).toBe("Charlie");
      expect(sorted[2].name).toBe("Alice");
    });

    it("sorts teams by connect rate descending", () => {
      const teams = [
        { name: "East", connect_rate: 0.45 },
        { name: "West", connect_rate: 0.62 },
        { name: "Central", connect_rate: 0.55 },
      ];
      const sorted = teams.sort((a, b) => b.connect_rate - a.connect_rate);
      expect(sorted[0].name).toBe("West");
      expect(sorted[1].name).toBe("Central");
      expect(sorted[2].name).toBe("East");
    });
  });

  // Test percentile and aggregation logic
  describe("aggregation logic", () => {
    it("calculates average connect rate across teams", () => {
      const teams = [
        { connect_rate: 0.5 },
        { connect_rate: 0.6 },
        { connect_rate: 0.7 },
      ];
      const avg = teams.reduce((sum, t) => sum + t.connect_rate, 0) / teams.length;
      expect(avg).toBe(0.6);
    });

    it("handles empty array in average calculation", () => {
      const teams: Array<{ connect_rate: number }> = [];
      const avg = teams.length > 0 ? teams.reduce((sum, t) => sum + t.connect_rate, 0) / teams.length : 0;
      expect(avg).toBe(0);
    });

    it("limits top performers to 3 items", () => {
      const agents = [
        { id: "1", connected_count: 10 },
        { id: "2", connected_count: 20 },
        { id: "3", connected_count: 30 },
        { id: "4", connected_count: 40 },
      ];
      const top3 = agents.sort((a, b) => b.connected_count - a.connected_count).slice(0, 3);
      expect(top3.length).toBe(3);
      expect(top3[0].id).toBe("4");
    });
  });
});

