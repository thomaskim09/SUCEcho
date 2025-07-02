// sucecho/src/app/api/admin/reports/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import logger from '@/lib/logger';

interface Params {
    id: string;
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = request.cookies.get('session')?.value;
    const adminUser = await verifySession(session || '');
    if (!adminUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id: reportId } = await params;

        if (!reportId) {
            return NextResponse.json(
                { message: 'Report ID is required' },
                { status: 400 }
            );
        }

        const numericReportId = Number(reportId);
        if (isNaN(numericReportId)) {
            return NextResponse.json(
                { message: 'Invalid Report ID' },
                { status: 400 }
            );
        }

        await prisma.report.delete({
            where: { id: numericReportId },
        });

        return NextResponse.json(
            { message: 'Report deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        logger.error('Error deleting report:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
