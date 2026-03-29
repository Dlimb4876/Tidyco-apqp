import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('mcs-approval core workflow', () => {
  let fromMock;
  let updateMock;
  let eqMock;
  let insertMock;
  let mcsApproveStep;
  let mcsRejectStep;

  beforeEach(async () => {
    global.currentUser = { id: 'user-1', email: 'approver@test.com' };
    global.currentUserRole = 'approval1';

    global.MCS_APPROVAL_STEPS = [
      {
        key: 'approval1',
        label: 'Approval 1',
        field: 'eng_review_status',
        byField: 'eng_review_by',
        atField: 'eng_review_at',
        notesField: 'eng_review_notes',
        activeStatus: 'review',
      },
      {
        key: 'approval2',
        label: 'Approval 2',
        field: 'qa_review_status',
        byField: 'qa_review_by',
        atField: 'qa_review_at',
        notesField: 'qa_review_notes',
        activeStatus: 'final_review',
      },
    ];

    global.mcsList = [
      {
        id: 'ECR-1',
        status: 'review',
        eng_review_status: 'pending',
        qa_review_status: null,
      },
      {
        id: 'ECR-2',
        status: 'final_review',
        eng_review_status: 'approved',
        qa_review_status: 'pending',
        affected_product_id: 'prod-1',
        estimated_time_impact_hours: 5,
        title: 'Improve valve life',
        change_type: 'Engineering',
      },
    ];

    global.productsState = {
      products: [{ id: 'prod-1', current_overhaul_hours: 20 }],
    };
    global.productsDataUpdateProduct = jest.fn().mockResolvedValue(true);

    eqMock = jest.fn().mockResolvedValue({ error: null });
    updateMock = jest.fn(() => ({ eq: eqMock }));
    insertMock = jest.fn().mockResolvedValue({ error: null });

    fromMock = jest.fn((table) => {
      if (table === 'mcs_changes') return { update: updateMock };
      if (table === 'mcs_timeline') return { insert: insertMock };
      if (table === 'overhaul_history') return { insert: insertMock };
      return { update: updateMock, insert: insertMock };
    });

    global.supa = { from: fromMock };

    // Import module after setting up mocks
    const mcsApproval = await import('../portals/mcs/js/mcs-approval.js');
    mcsApproveStep = mcsApproval.mcsApproveStep;
    mcsRejectStep = mcsApproval.mcsRejectStep;
  });

  it('approves approval1 and advances status to implementing', async () => {
    const ok = await mcsApproveStep('ECR-1', 'approval1', 'looks good');

    expect(ok).toBe(true);
    expect(updateMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith('id', 'ECR-1');

    const change = global.mcsList.find((c) => c.id === 'ECR-1');
    expect(change.status).toBe('implementing');
    expect(change.eng_review_status).toBe('approved');
  });

  it('rejects approval1 and closes the change', async () => {
    const ok = await mcsRejectStep('ECR-1', 'approval1', 'missing risk detail');

    expect(ok).toBe(true);

    const change = global.mcsList.find((c) => c.id === 'ECR-1');
    expect(change.status).toBe('closed');
    expect(change.eng_review_status).toBe('rejected');
  });

  it('returns false when status does not match active step', async () => {
    const ok = await mcsApproveStep('ECR-1', 'approval2', 'wrong state');
    expect(ok).toBe(false);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('approval2 creates overhaul entry and sets implemented status', async () => {
    const ok = await mcsApproveStep('ECR-2', 'approval2', 'approved for release');

    expect(ok).toBe(true);

    const change = global.mcsList.find((c) => c.id === 'ECR-2');
    expect(change.status).toBe('implemented');
    expect(change.implementation_date).toBeTruthy();
    expect(fromMock).toHaveBeenCalledWith('overhaul_history');
    expect(productsDataUpdateProduct).toHaveBeenCalledWith('prod-1', { current_overhaul_hours: 25 });
  });

  it('returns false on db update error', async () => {
    eqMock.mockResolvedValueOnce({ error: { message: 'db update failed' } });

    const ok = await mcsApproveStep('ECR-1', 'approval1', 'fail me');

    expect(ok).toBe(false);
  });
});
