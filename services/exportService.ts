import { SavedDocument, Section } from '../types';

declare const jspdf: any;

export const exportDocumentToPDF = (doc: SavedDocument, sections: Section[], summary: string | null = null) => {
    const { jsPDF } = jspdf;
    const pdf = new jsPDF('p', 'pt', 'a4');

    const pageMargin = 50;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (pageMargin * 2);
    let yPos = 0;

    const addText = (text: string, options: { size: number; isBold?: boolean; spacingAfter?: number; x?: number; color?: number | number[]; align?: 'left' | 'center' | 'right' }) => {
        if (yPos + options.size > pageHeight - pageMargin) {
            pdf.addPage();
            yPos = pageMargin;
        }

        pdf.setFontSize(options.size);
        pdf.setFont(undefined, options.isBold ? 'bold' : 'normal');
        if (options.color) {
            if (Array.isArray(options.color)) {
                pdf.setTextColor(options.color[0], options.color[1], options.color[2]);
            } else {
                pdf.setTextColor(options.color);
            }
        } else {
            pdf.setTextColor(40, 40, 40); // Default dark grey
        }

        const xPos = options.align === 'center' ? pageWidth / 2 : (options.x || pageMargin);
        const splitText = pdf.splitTextToSize(text, options.align === 'center' ? contentWidth : contentWidth - (xPos - pageMargin));
        
        const textBlockHeight = pdf.getTextDimensions(splitText).h;
        if (yPos + textBlockHeight > pageHeight - pageMargin) {
            pdf.addPage();
            yPos = pageMargin;
        }

        pdf.text(splitText, xPos, yPos, { align: options.align || 'left' });
        yPos += textBlockHeight + (options.spacingAfter || 0);
    };

    // --- PDF Content ---

    // Page 1: Title Page
    yPos = pageHeight / 4;
    addText(doc.name, { size: 22, isBold: true, spacingAfter: 20, align: 'center' });
    
    const creationDate = `Criado em: ${new Date(doc.createdAt).toLocaleString('pt-BR')}`;
    addText(creationDate, { size: 10, spacingAfter: 10, color: 120, align: 'center' });
    if (doc.updatedAt && doc.updatedAt !== doc.createdAt) {
        const updatedDate = `Atualizado em: ${new Date(doc.updatedAt).toLocaleString('pt-BR')}`;
        addText(updatedDate, { size: 10, spacingAfter: 10, color: 120, align: 'center' });
    }

    // --- Content Pages ---
    pdf.addPage();
    yPos = pageMargin;

    // Executive Summary (if available)
    if (summary) {
        addText('Sumário Executivo', { size: 16, isBold: true, spacingAfter: 10 });
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(200);
        pdf.line(pageMargin, yPos, pageWidth - pageMargin, yPos);
        yPos += 15;
        
        // Remove markdown for clean text
        const plainSummary = summary.replace(/(\*\*|##|#|---)/g, '');
        addText(plainSummary, { size: 11, spacingAfter: 30, color: [80, 80, 80] });
    }

    // Document Sections
    sections.forEach(section => {
        const content = doc.sections[section.id];
        if (content && String(content).trim()) {
            yPos += 15; // Space before section
            if (yPos > pageHeight - pageMargin) {
                pdf.addPage();
                yPos = pageMargin;
            }
            
            addText(section.title, { size: 14, isBold: true, spacingAfter: 15 });
            
            // Remove markdown for clean text
            const plainContent = String(content).replace(/(\*\*|##|#|---)/g, '');
            addText(plainContent, { size: 11, spacingAfter: 20, color: [80, 80, 80] });
        }
    });

    // Attachments
    if (doc.attachments && doc.attachments.length > 0) {
        yPos += 10;
        if (yPos > pageHeight - pageMargin - 50) { // Check space for section
            pdf.addPage();
            yPos = pageMargin;
        }

        pdf.setLineWidth(0.5);
        pdf.setDrawColor(200);
        pdf.line(pageMargin, yPos, pageWidth - pageMargin, yPos);
        yPos += 20;

        addText('Anexos', { size: 14, isBold: true, spacingAfter: 15 });

        doc.attachments.forEach(att => {
            const attachmentText = `- ${att.name} (${att.type})`;
            addText(attachmentText, { size: 11, spacingAfter: 10, color: [80, 80, 80] });
        });
    }

    // --- Add Headers & Footers to all pages ---
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        
        // Footer
        pdf.text(
            `Página ${i} de ${pageCount}`,
            pageWidth / 2,
            pageHeight - 20,
            { align: 'center' }
        );

        // Header (from page 2 onwards)
        if (i > 1) {
            pdf.text(doc.name, pageMargin, 30);
            pdf.setLineWidth(0.5);
            pdf.setDrawColor(200);
            pdf.line(pageMargin, 35, pageWidth - pageMargin, 35);
        }
    }

    pdf.save(`${doc.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
};


export const exportRiskMapToPDF = (doc: SavedDocument) => {
    const { jsPDF } = jspdf;
    const pdf = new jsPDF('p', 'pt', 'a4');

    const pageMargin = 40;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (pageMargin * 2);
    let yPos = pageMargin;

    const checkPageBreak = (neededHeight: number) => {
        if (yPos + neededHeight > pageHeight - pageMargin) {
            pdf.addPage();
            yPos = pageMargin;
        }
    };

    const addText = (text: string, options: { size: number; isBold?: boolean; spacing?: number; x?: number; align?: 'left' | 'center' | 'right' }) => {
        pdf.setFontSize(options.size);
        pdf.setFont(undefined, options.isBold ? 'bold' : 'normal');

        const splitText = pdf.splitTextToSize(text, contentWidth - ((options.x || pageMargin) - pageMargin));
        const textBlockHeight = pdf.getTextDimensions(splitText).h;

        checkPageBreak(textBlockHeight + (options.spacing || 0));
        
        pdf.text(splitText, options.x || pageMargin, yPos, { align: options.align || 'left' });
        yPos += textBlockHeight + (options.spacing || 0);
    };
    
    const addSectionTitle = (title: string) => {
        checkPageBreak(40);
        yPos += 15;
        addText(title, { size: 14, isBold: true, spacing: 10 });
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(150);
        pdf.line(pageMargin, yPos - 8, pageWidth - pageMargin, yPos - 8);
    };

    // --- PDF Content ---

    // 1. Header
    addText(doc.name, { size: 18, isBold: true, spacing: 20 });
    
    const { riskMapData } = doc;

    // 2. Revision History
    const revisionHistory = riskMapData?.revisionHistory;
    if (revisionHistory && revisionHistory.length > 0) {
        addSectionTitle('Histórico de Revisões');
        revisionHistory.forEach(row => {
            checkPageBreak(50);
            addText(`Data: ${row.date || 'N/A'} | Versão: ${row.version || 'N/A'} | Fase: ${row.phase || 'N/A'}`, { size: 10, isBold: true, spacing: 5 });
            addText(`Autor: ${row.author || 'N/A'}`, { size: 9, spacing: 5 });
            addText(`Descrição: ${row.description || 'N/A'}`, { size: 9, spacing: 10 });
             pdf.setDrawColor(220); // light gray
             pdf.line(pageMargin, yPos - 5, contentWidth + pageMargin, yPos - 5);
        });
    }

    // 3. Introduction
    if (doc.sections['risk-map-intro']) {
        addSectionTitle('1. Introdução');
        addText(doc.sections['risk-map-intro'], { size: 11, spacing: 20 });
    }

    // 4. Risk Identification
    const riskIdentification = riskMapData?.riskIdentification;
    if (riskIdentification && riskIdentification.length > 0) {
        addSectionTitle('2. Identificação e Análise dos Principais Riscos');
        riskIdentification.forEach(row => {
            const p = parseInt(row.probability, 10) || 0;
            const i = parseInt(row.impact, 10) || 0;
            const riskLevel = p * i;
            checkPageBreak(50);
            addText(`ID: ${row.riskId || 'N/A'} | Nível de Risco: ${riskLevel}`, { size: 10, isBold: true, spacing: 5 });
            addText(`Risco: ${row.risk || 'N/A'}`, { size: 9, spacing: 5 });
            addText(`Relacionado a: ${row.relatedTo || 'N/A'} | Probabilidade (P): ${row.probability || 0} | Impacto (I): ${row.impact || 0}`, { size: 9, spacing: 10 });
            pdf.setDrawColor(220);
            pdf.line(pageMargin, yPos - 5, contentWidth + pageMargin, yPos - 5);
        });
    }

    // 5. Risk Evaluation
    const riskEvaluation = riskMapData?.riskEvaluation;
    if (riskEvaluation && riskEvaluation.length > 0) {
        addSectionTitle('3. Avaliação e Tratamento dos Riscos Identificados');
        riskEvaluation.forEach(block => {
            checkPageBreak(80);
            addText(`Risco ${block.riskId || 'N/A'}: ${block.riskDescription || 'N/A'}`, { size: 11, isBold: true, spacing: 8 });
            addText(`Probabilidade: ${block.probability || 'N/A'} | Impacto: ${block.impact || 'N/A'} | Dano: ${block.damage || 'N/A'} | Tratamento: ${block.treatment || 'N/A'}`, { size: 9, spacing: 8 });
            
            if (block.preventiveActions && block.preventiveActions.length > 0) {
                addText('Ações Preventivas:', { size: 10, isBold: true, spacing: 5, x: pageMargin + 10 });
                block.preventiveActions.forEach(action => {
                    addText(`- ${action.actionId || 'ID'}: ${action.action || 'N/A'} (Responsável: ${action.responsible || 'N/A'})`, { size: 9, spacing: 5, x: pageMargin + 20 });
                });
            }
            if (block.contingencyActions && block.contingencyActions.length > 0) {
                yPos += 5;
                addText('Ações de Contingência:', { size: 10, isBold: true, spacing: 5, x: pageMargin + 10 });
                block.contingencyActions.forEach(action => {
                    addText(`- ${action.actionId || 'ID'}: ${action.action || 'N/A'} (Responsável: ${action.responsible || 'N/A'})`, { size: 9, spacing: 5, x: pageMargin + 20 });
                });
            }
            yPos += 10;
            pdf.setDrawColor(220);
            pdf.line(pageMargin, yPos - 5, contentWidth + pageMargin, yPos - 5);
        });
    }

    // 6. Risk Monitoring
    const riskMonitoring = riskMapData?.riskMonitoring;
    if (riskMonitoring && riskMonitoring.length > 0) {
        addSectionTitle('4. Acompanhamento das Ações de Tratamento de Riscos');
        riskMonitoring.forEach(row => {
            checkPageBreak(40);
            addText(`Data: ${row.date || 'N/A'} | Risco ID: ${row.riskId || 'N/A'} | Ação ID: ${row.actionId || 'N/A'}`, { size: 10, isBold: true, spacing: 5 });
            addText(`Registro: ${row.record || 'N/A'}`, { size: 9, spacing: 10 });
            pdf.setDrawColor(220);
            pdf.line(pageMargin, yPos - 5, contentWidth + pageMargin, yPos - 5);
        });
    }


    // --- PDF Footer (Pagination) ---
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(
            `Página ${i} de ${pageCount}`,
            pageWidth / 2,
            pageHeight - 20,
            { align: 'center' }
        );
    }

    // --- Save the PDF ---
    pdf.save(`${doc.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
};