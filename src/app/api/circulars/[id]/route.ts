import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getCurrentUser } from '../../../../lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const db = await getDb();
    const circular = await db.get('SELECT * FROM circulars WHERE id = ?', [id]);

    if (!circular) {
      return NextResponse.json({ error: 'Circular not found' }, { status: 404 });
    }

    circular.targetDepts = JSON.parse(circular.targetDepts || '[]');
    circular.approvalFlow = JSON.parse(circular.approvalFlow || '[]');

    const attachments = await db.all('SELECT filename, url FROM circular_attachments WHERE circular_id = ?', [id]);
    circular.attachments = attachments.map((a: any) => a.url);

    const signatures = await db.all(`
      SELECT s.id, s.user_id as userId, s.signedAt, 
             u.name as userName, u.designation, u.department, u.role 
      FROM signatures s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.circular_id = ? 
      ORDER BY s.signedAt ASC
    `, [id]);
    circular.signatures = signatures;

    const comments = await db.all(`
      SELECT c.id, c.author_id as authorId, u.name as authorName, u.designation, c.message, c.timestamp, c.type
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.circular_id = ?
      ORDER BY c.timestamp ASC
    `, [id]);
    circular.comments = comments;

    // Fetch creator details
    const creator = await db.get('SELECT name, role, designation, department FROM users WHERE id = ?', [circular.createdById]);
    circular.createdByName = creator?.name;
    circular.createdByRole = creator?.role;
    circular.createdByDesignation = creator?.designation;
    circular.createdByDepartment = creator?.department;

    return NextResponse.json(circular, { status: 200 });
  } catch (error) {
    console.error('Error fetching circular:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { title, targetDepts, subject, content, contentHtml, margins, priority, approvalFlow } = body;

    const db = await getDb();
    const circular = await db.get('SELECT * FROM circulars WHERE id = ?', [id]);

    if (!circular) {
      return NextResponse.json({ error: 'Circular not found' }, { status: 404 });
    }

    if (circular.createdById !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let newStatus = circular.status;
    let isResubmitted = false;

    // Reset status if it was rejected or changes_requested
    if (circular.status === 'rejected' || circular.status === 'changes_requested') {
      isResubmitted = true;
      let flow: string[] = [];
      try {
        flow = JSON.parse(circular.approvalFlow || '[]');
      } catch { flow = []; }
      
      const newApprovalFlow = approvalFlow || flow;

      if (Array.isArray(newApprovalFlow) && newApprovalFlow.length > 0) {
        const ROLE_TO_STATUS: Record<string, string> = {
          hod: 'pending_hod',
          principal: 'pending_principal',
          placement_director: 'pending_placement_director',
          training_coordinator: 'pending_training_coordinator',
        };
        newStatus = ROLE_TO_STATUS[newApprovalFlow[0]] ?? 'pending_hod';
      } else {
        const type = circular.type;
        if (type === 'placement') newStatus = 'pending_placement_director';
        else if (type === 'all_department' || type === 'examination') newStatus = 'pending_principal';
        else newStatus = 'pending_hod';
      }
    }

    await db.run(`
      UPDATE circulars 
      SET title = ?, 
          targetDepts = ?, 
          subject = ?, 
          content = ?,
          contentHtml = ?,
          margins = ?,
          priority = ?,
          status = ?
      WHERE id = ?
    `, [
      title, 
      targetDepts ? JSON.stringify(targetDepts) : null, 
      subject, 
      content,
      contentHtml || null,
      margins || circular.margins || 'normal',
      priority,
      newStatus,
      id
    ]);

    if (isResubmitted) {
      const commentId = 'com_' + Date.now() + Math.random().toString(36).substr(2, 6);
      await db.run(
        'INSERT INTO comments (id, circular_id, author_id, message, timestamp, type) VALUES (?, ?, ?, ?, ?, ?)',
        [commentId, id, user.id, 'Circular revised and resubmitted for approval.', new Date().toISOString(), 'resubmitted']
      );
    }

    return NextResponse.json({ success: true, status: newStatus }, { status: 200 });

  } catch (error) {
    console.error('Error updating circular:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
