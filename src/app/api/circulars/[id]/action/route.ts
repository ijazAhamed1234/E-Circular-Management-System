import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getCurrentUser } from '../../../../../lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { action, comment } = body; // action: approve | reject | changes_requested | remove_signature

    if (!['approve', 'reject', 'changes_requested', 'remove_signature'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const db = await getDb();
    const circular = await db.get('SELECT * FROM circulars WHERE id = ?', [id]);

    if (!circular) {
      return NextResponse.json({ error: 'Circular not found' }, { status: 404 });
    }

    // Parse approvalFlow from JSON string stored in DB
    let approvalFlow: string[] = [];
    try {
      approvalFlow = JSON.parse(circular.approvalFlow || '[]');
    } catch { approvalFlow = []; }

    let newStatus = circular.status;

    if (action === 'remove_signature') {
      await db.run('DELETE FROM signatures WHERE circular_id = ? AND user_id = ?', [id, user.id]);
      
      // We must revert status back to this user's turn
      if (Array.isArray(approvalFlow) && approvalFlow.length > 0) {
        const ROLE_TO_STATUS: Record<string, string> = {
          hod: 'pending_hod',
          principal: 'pending_principal',
          placement_director: 'pending_placement_director',
          training_coordinator: 'pending_training_coordinator',
        };
        const STATUS_TO_ROLE: Record<string, string> = {
          pending_hod: 'hod',
          pending_principal: 'principal',
          pending_placement_director: 'placement_director',
          pending_training_coordinator: 'training_coordinator',
        };
        
        let targetRole = user.role;
        // In this simple model we revert the circular to the role of the user removing their signature
        // Or if they were training_coordinator -> 'pending_training_coordinator'
        if (targetRole === 'training_coordinator') {
          newStatus = 'pending_training_coordinator';
        } else {
          newStatus = ROLE_TO_STATUS[targetRole] ?? newStatus;
        }
      } else {
        const type = circular.type;
        if (type === 'placement' && user.role === 'placement_director') newStatus = 'pending_placement_director';
        else if (type === 'departmental' && user.role === 'hod') newStatus = 'pending_hod';
        else if (type === 'inter_department' && user.role === 'hod') newStatus = 'pending_hod';
        else if ((type === 'all_department' || type === 'examination') && user.role === 'principal') newStatus = 'pending_principal';
        else newStatus = circular.status; // Fallback
      }
      
      // Delete the approval comment made by this user if any
      await db.run('DELETE FROM comments WHERE circular_id = ? AND author_id = ? AND type = "approval"', [id, user.id]);
    } else if (action === 'reject') {
      newStatus = 'rejected';
    } else if (action === 'changes_requested') {
      newStatus = 'changes_requested';
    } else if (action === 'approve') {
      // Use approvalFlow if present, otherwise fall back to type-based rules
      if (Array.isArray(approvalFlow) && approvalFlow.length > 0) {
        const ROLE_TO_STATUS: Record<string, string> = {
          hod: 'pending_hod',
          principal: 'pending_principal',
          placement_director: 'pending_placement_director',
          training_coordinator: 'pending_training_coordinator',
        };
        const STATUS_TO_ROLE: Record<string, string> = {
          pending_hod: 'hod',
          pending_principal: 'principal',
          pending_placement_director: 'placement_director',
          pending_training_coordinator: 'training_coordinator',
        };

        const currentRole = STATUS_TO_ROLE[circular.status];
        const currentIdx = currentRole ? approvalFlow.indexOf(currentRole) : -1;

        if (currentIdx >= 0 && currentIdx < approvalFlow.length - 1) {
          // Advance to next role in approvalFlow
          newStatus = ROLE_TO_STATUS[approvalFlow[currentIdx + 1]] ?? 'approved';
        } else {
          newStatus = 'approved';
        }
      } else {
        // Legacy type-based flow
        const type = circular.type;
        const status = circular.status;
        if (type === 'departmental') {
          if (status === 'pending_hod') newStatus = 'pending_principal';
          else newStatus = 'approved';
        } else if (type === 'inter_department' || type === 'event') {
          if (status === 'pending_hod') newStatus = 'pending_training_coordinator';
          else newStatus = 'approved';
        } else if (type === 'placement') {
          if (status === 'pending_placement_director') newStatus = 'pending_principal';
          else newStatus = 'approved';
        } else if (type === 'all_department' || type === 'examination') {
          if (status === 'pending_principal') newStatus = 'approved';
          else newStatus = 'pending_principal';
        } else {
          newStatus = 'approved';
        }
      }

      // Add signature using correct snake_case column names
      const sigId = 'sig_' + Date.now() + Math.random().toString(36).substr(2, 6);
      await db.run(
        'INSERT INTO signatures (id, circular_id, user_id, signedAt) VALUES (?, ?, ?, ?)',
        [sigId, id, user.id, new Date().toISOString()]
      );
    }

    // Update circular status
    await db.run('UPDATE circulars SET status = ? WHERE id = ?', [newStatus, id]);

    // Add activity comment
    const commentId = 'com_' + Date.now() + Math.random().toString(36).substr(2, 6);
    const typeMap: Record<string, string> = {
      approve: 'approval',
      reject: 'rejected',
      changes_requested: 'changes_requested',
    };
    const defaultMsg: Record<string, string> = {
      approve: `Approved and signed by ${user.name} (${user.designation})`,
      reject: `Rejected by ${user.name} (${user.designation})`,
      changes_requested: `Changes requested by ${user.name} (${user.designation})`,
    };

    await db.run(
      'INSERT INTO comments (id, circular_id, author_id, message, timestamp, type) VALUES (?, ?, ?, ?, ?, ?)',
      [commentId, id, user.id, comment || defaultMsg[action], new Date().toISOString(), typeMap[action]]
    );

    return NextResponse.json({ success: true, status: newStatus }, { status: 200 });
  } catch (error) {
    console.error('Error processing workflow action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
