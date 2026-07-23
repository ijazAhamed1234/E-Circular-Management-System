import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { getCurrentUser } from '../../../lib/auth';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const departmentFilter = searchParams.get('department');
  const typeFilter = searchParams.get('type');

  try {
    const db = await getDb();
    let query = 'SELECT * FROM circulars WHERE 1=1';
    const params: any[] = [];

    if (statusFilter) {
      query += ' AND status = ?';
      params.push(statusFilter);
    }
    
    if (departmentFilter) {
      query += ' AND department = ?';
      params.push(departmentFilter);
    }

    if (typeFilter) {
      query += ' AND type = ?';
      params.push(typeFilter);
    }

    // Depending on user role, we could filter circulars they are allowed to see here.
    // For simplicity, returning what is requested. 

    query += ' ORDER BY createdAt DESC';

    const circulars = await db.all(query, params);

    // Parse targetDepts json
    const parsedCirculars = circulars.map((c: any) => ({
      ...c,
      targetDepts: JSON.parse(c.targetDepts || '[]'),
      approvalFlow: JSON.parse(c.approvalFlow || '[]'),
      attachments: [] // we'll populate this if needed, or join
    }));

    // Attachments, Signatures, and Comments
    for (const c of parsedCirculars) {
      const attachments = await db.all('SELECT filename, url FROM circular_attachments WHERE circular_id = ?', [c.id]);
      c.attachments = attachments.map((a: any) => a.url);
      
      const signatures = await db.all(`
        SELECT s.id, s.user_id as userId, s.signedAt, 
               u.name as userName, u.designation, u.department, u.role 
        FROM signatures s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.circular_id = ? 
        ORDER BY s.signedAt ASC
      `, [c.id]);
      c.signatures = signatures;

      const comments = await db.all(`
        SELECT cm.id, cm.author_id as authorId, u.name as authorName, u.designation, cm.message, cm.timestamp, cm.type
        FROM comments cm
        JOIN users u ON cm.author_id = u.id
        WHERE cm.circular_id = ?
        ORDER BY cm.timestamp ASC
      `, [c.id]);
      c.comments = comments;
      
      const creator = await db.get('SELECT name, role, designation, department FROM users WHERE id = ?', [c.createdById]);
      c.createdByName = creator?.name;
      c.createdByRole = creator?.role;
      c.createdByDesignation = creator?.designation;
      c.createdByDepartment = creator?.department;
    }

    return NextResponse.json(parsedCirculars, { status: 200 });
  } catch (error) {
    console.error('Error fetching circulars:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, type, targetDepts, subject, content, contentHtml, margins, priority, attachments, approvalFlow } = body;

    const db = await getDb();
    
    // Generate a new ID
    const id = 'c_' + Date.now() + Math.random().toString(36).substr(2, 9);
    
    // Determine initial status from approvalFlow (preferred) or type
    let status = 'pending_hod';
    if (Array.isArray(approvalFlow) && approvalFlow.length > 0) {
      const ROLE_TO_STATUS: Record<string, string> = {
        hod: 'pending_hod',
        principal: 'pending_principal',
        placement_director: 'pending_placement_director',
        training_coordinator: 'pending_training_coordinator',
      };
      status = ROLE_TO_STATUS[approvalFlow[0]] ?? 'pending_hod';
    } else {
      // Fallback type-based
      if (type === 'placement') status = 'pending_placement_director';
      else if (type === 'all_department' || type === 'examination') status = 'pending_principal';
      else status = 'pending_hod';
    }

    const refNo = `KIOT/${type.toUpperCase().substring(0, 3)}/2026-27/${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const createdAt = new Date().toISOString();

    await db.run(
      `INSERT INTO circulars (id, refNo, title, type, department, targetDepts, subject, content, contentHtml, margins, status, priority, approvalFlow, createdById, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, refNo, title, type, user.department, JSON.stringify(targetDepts || []), subject, content, contentHtml || null, margins || 'normal', status, priority, JSON.stringify(approvalFlow || []), user.id, createdAt]
    );

    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        const attId = 'a_' + Date.now() + Math.random().toString(36).substr(2, 9);
        await db.run(
          'INSERT INTO circular_attachments (id, circular_id, filename, url) VALUES (?, ?, ?, ?)',
          [attId, id, att.filename || att, att.url || att]
        );
      }
    }

    const newCircular = await db.get('SELECT * FROM circulars WHERE id = ?', [id]);
    newCircular.targetDepts = JSON.parse(newCircular.targetDepts || '[]');
    newCircular.approvalFlow = JSON.parse(newCircular.approvalFlow || '[]');
    newCircular.signatures = [];
    newCircular.comments = [];
    newCircular.attachments = attachments ? attachments.map((a: any) => a.url || a) : [];
    newCircular.createdByName = user.name;
    newCircular.createdByRole = user.role;
    newCircular.createdByDesignation = user.designation;
    newCircular.createdByDepartment = user.department;

    return NextResponse.json(newCircular, { status: 201 });

  } catch (error) {
    console.error('Error creating circular:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
