import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const registryPath = path.join(process.cwd(), 'lib/rag/uploaded-documents.json');
    let registry: any[] = [];
    if (fs.existsSync(registryPath)) {
      registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    }
    return NextResponse.json({ docs: registry });
  } catch (error: any) {
    console.error('Error fetching uploaded docs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
