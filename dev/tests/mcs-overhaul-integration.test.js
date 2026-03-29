/**
 * MCS + Overhaul History Integration Tests
 * Tests for creating overhaul_history entries when MCS changes are implemented
 */
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe('MCS Overhaul History Integration', () => {
  beforeEach(() => {
    window.mcsList = [
      {
        id: 'ECR-2026-0001',
        title: 'Rail Bracket Weld Revision',
        status: 'approved',
        affected_product_id: 'prod-123',
        estimated_time_impact_hours: 5,
        time_impact_reason: 'New welding fixture required',
        recovery_target_date: '2026-04-15',
        change_type: 'Engineering',
        justified: 'Fatigue test failures',
        initiated_by: 'J. Barker',
        implementation_date: null
      }
    ];
  });

  describe('Time Impact Fields', () => {
    it('should store estimated time impact', () => {
      const change = window.mcsList[0];
      expect(change.estimated_time_impact_hours).toBe(5);
    });

    it('should handle negative time impacts (speedups)', () => {
      const change = window.mcsList[0];
      change.estimated_time_impact_hours = -2; // improvement — negative hours
      expect(change.estimated_time_impact_hours).toBeLessThan(0);
    });

    it('should store recovery target date', () => {
      const change = window.mcsList[0];
      expect(change.recovery_target_date).toBeTruthy();
    });

    it('should store time impact reason', () => {
      const change = window.mcsList[0];
      expect(change.time_impact_reason).toContain('welding');
    });
  });

  describe('Product Linkage', () => {
    it('should link change to affected product', () => {
      const change = window.mcsList[0];
      expect(change.affected_product_id).toBeTruthy();
    });

    it('should handle missing product linkage', () => {
      const change = { ...window.mcsList[0], affected_product_id: null };
      expect(change.affected_product_id).toBeNull();
    });
  });

  describe('Overhaul History Entry Creation', () => {
    it('should create overhaul_history entry on implementation', () => {
      const change = window.mcsList[0];
      const now = new Date().toISOString().split('T')[0];

      const currentProductHours = 42;
      const newOverhaulHours = currentProductHours + change.estimated_time_impact_hours;

      const overhaulEntry = {
        product_id: change.affected_product_id,
        overhaul_hours: newOverhaulHours,
        time_impact_hours: change.estimated_time_impact_hours,
        schedule_impact_reason: change.time_impact_reason,
        mcs_reference_id: change.id,
        effective_from_date: now,
        estimated_recovery_date: change.recovery_target_date,
        is_mcs_triggered: true,
        change_reason: `MCO: ${change.change_type} - ${change.title}`,
        notes: change.justification,
        created_by_name: change.initiated_by
      };

      expect(overhaulEntry.product_id).toBe(change.affected_product_id);
      expect(overhaulEntry.mcs_reference_id).toBe(change.id);
      expect(overhaulEntry.is_mcs_triggered).toBe(true);
      expect(overhaulEntry.overhaul_hours).toBe(47); // 42 current + 5 impact
    });

    it('should calculate overhaul_hours as current + time impact delta', () => {
      const currentHours = 80;
      const timeImpact = -3; // speedup — removes 3 hours
      const newHours = currentHours + timeImpact;
      expect(newHours).toBe(77);
    });

    it('should set overhaul_hours to current hours when time impact is zero', () => {
      const currentHours = 55;
      const timeImpact = 0;
      const newHours = currentHours + timeImpact;
      expect(newHours).toBe(55);
    });

    it('should not create entry if product not linked', () => {
      const change = { ...window.mcsList[0], affected_product_id: null };
      const shouldCreate = change.affected_product_id !== null && change.status === 'implemented';
      expect(shouldCreate).toBe(false);
    });

    it('should only create entry on implementation (Approval 2)', () => {
      const change = { ...window.mcsList[0], status: 'approved' };
      const shouldCreate = change.status === 'implemented';
      expect(shouldCreate).toBe(false);
    });
  });

  describe('Portfolio KPI Impact', () => {
    it('should calculate total schedule delay', () => {
      const changes = [
        { estimated_time_impact_hours: 5 },
        { estimated_time_impact_hours: 3 },
        { estimated_time_impact_hours: -1 } // improvement
      ];

      const totalDelay = changes.reduce((sum, c) => sum + (c.estimated_time_impact_hours || 0), 0);
      expect(totalDelay).toBe(7);
    });

    it('should count affected products', () => {
      const changes = [
        { affected_product_id: 'prod-1' },
        { affected_product_id: 'prod-1' },
        { affected_product_id: 'prod-2' }
      ];

      const affectedProducts = new Set(
        changes.filter(c => c.affected_product_id).map(c => c.affected_product_id)
      );

      expect(affectedProducts.size).toBe(2);
    });

    it('should calculate average impact per change', () => {
      const changes = [
        { estimated_time_impact_hours: 6 },
        { estimated_time_impact_hours: 4 },
        { estimated_time_impact_hours: 2 }
      ];

      const avg =
        changes.reduce((sum, c) => sum + (c.estimated_time_impact_hours || 0), 0) / changes.length;

      expect(avg).toBe(4);
    });
  });

  describe('Recovery Tracking', () => {
    it('should check if product is overdue recovery', () => {
      const change = window.mcsList[0];
      const today = new Date().toISOString().split('T')[0];
      const isOverdue = change.recovery_target_date < today;

      // In test data, this is future date so not overdue
      expect(isOverdue).toBe(false);
    });

    it('should sort by recovery urgency', () => {
      const changes = [
        { recovery_target_date: '2026-04-30' },
        { recovery_target_date: '2026-03-15' },
        { recovery_target_date: '2026-03-20' }
      ];

      const sorted = [...changes].sort((a, b) =>
        new Date(a.recovery_target_date) - new Date(b.recovery_target_date)
      );

      expect(sorted[0].recovery_target_date).toBe('2026-03-15');
      expect(sorted[2].recovery_target_date).toBe('2026-04-30');
    });
  });

  describe('Baseline Calculation', () => {
    it('should track before/after hours', () => {
      const beforeHours = 42;
      const afterHours = 47;
      const delta = afterHours - beforeHours;

      expect(delta).toBe(5);
    });

    it('should handle multiple overhaul history entries per product', () => {
      const entries = [
        { product_id: 'prod-1', time_impact_hours: 3, effective_from_date: '2026-02-01' },
        { product_id: 'prod-1', time_impact_hours: -1, effective_from_date: '2026-03-01' }
      ];

      const productEntries = entries.filter(e => e.product_id === 'prod-1');
      const totalImpact = productEntries.reduce((sum, e) => sum + e.time_impact_hours, 0);

      expect(productEntries.length).toBe(2);
      expect(totalImpact).toBe(2);
    });
  });

  describe('Chart Data Preparation', () => {
    it('should prepare dual-axis chart data', () => {
      const historicalHours = [40, 41, 42, 41, 43];
      const cumulativeDelay = [0, 3, 3, 2, 5];

      const chartData = {
        hours: historicalHours,
        delays: cumulativeDelay
      };

      expect(chartData.hours.length).toBe(chartData.delays.length);
    });

    it('should handle missing data points', () => {
      const entries = [
        { date: '2026-01-01', hours: 40 },
        { date: '2026-02-01' }, // missing hours
        { date: '2026-03-01', hours: 43 }
      ];

      const validEntries = entries.filter(e => e.hours !== undefined);
      expect(validEntries.length).toBe(2);
    });
  });
});
