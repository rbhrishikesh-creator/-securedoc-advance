import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { DocumentModel } from '../models/Document';
import { DocumentVersion } from '../models/DocumentVersion';
import { StorageService } from '../services/storage.service';
import { CryptoService } from '../services/crypto.service';
import { GeminiAiService, ChatMessage } from '../services/ai.service';
import { AuditLog } from '../models/AuditLog';

export class AiController {
  /**
   * Helper to extract decryptable text from document version
   */
  private static async extractDocumentText(doc: any): Promise<string> {
    try {
      const docVersion = await DocumentVersion.findOne({
        documentId: doc._id,
        versionNumber: doc.currentVersion,
      });

      if (!docVersion) return '';

      const ciphertext = await StorageService.readEncrypted(docVersion.fileKey);
      const decrypted = CryptoService.decrypt(
        ciphertext,
        docVersion.iv,
        docVersion.authTag,
        docVersion.checksum
      );

      const isText =
        docVersion.mimeType.startsWith('text/') ||
        docVersion.mimeType.includes('json') ||
        docVersion.mimeType.includes('markdown') ||
        docVersion.originalName.endsWith('.txt') ||
        docVersion.originalName.endsWith('.md');

      if (isText) {
        return decrypted.toString('utf-8');
      }

      // For binary/PDF files, attempt clean ASCII string extraction
      const raw = decrypted.toString('latin1');
      const textMatches = raw.match(/[A-Za-z0-9\s.,;:'"()\-/$%#@!?]{4,}/g);
      if (textMatches && textMatches.length > 0) {
        return textMatches.join(' ').slice(0, 10000);
      }

      return `File: ${doc.name} (Format: ${doc.mimeType}, Size: ${doc.sizeBytes} bytes)`;
    } catch (err) {
      console.warn('⚠️ [AI Text Extraction Warning]', err);
      return `Document Name: ${doc.name}`;
    }
  }

  /**
   * Analyze document intelligence (Summary, Classification, Risk, Entities, Tags)
   * POST /api/ai/analyze/:id
   */
  static async analyzeDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const doc = await DocumentModel.findOne({ _id: id, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Document not found.' });
        return;
      }

      const extractedText = await AiController.extractDocumentText(doc);
      const aiResult = await GeminiAiService.analyzeDocument(doc.name, extractedText, doc.mimeType);

      // Save to document
      doc.aiMetadata = aiResult;
      // Auto-merge suggested tags if tags array is empty or low
      if (aiResult.suggestedTags && aiResult.suggestedTags.length > 0) {
        const currentSet = new Set(doc.tags || []);
        aiResult.suggestedTags.forEach((t) => currentSet.add(t));
        doc.tags = Array.from(currentSet);
      }
      await doc.save();

      await AuditLog.create({
        userId,
        action: 'DOCUMENT_AI_ANALYSIS',
        targetType: 'document',
        targetId: doc._id.toString(),
        details: {
          documentName: doc.name,
          classification: aiResult.classification,
          riskScore: aiResult.riskScore,
        },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      res.status(200).json({
        message: 'Document intelligence analysis complete.',
        aiMetadata: aiResult,
        tags: doc.tags,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'AI_ANALYSIS_ERROR', message: err.message });
    }
  }

  /**
   * Interactive "Ask SecureDoc AI" Q&A
   * POST /api/ai/ask/:id
   */
  static async askDocumentAi(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { question, history = [] } = req.body;
      const userId = req.user?.userId;

      if (!question || typeof question !== 'string') {
        res.status(400).json({ error: 'QUESTION_REQUIRED', message: 'A valid question is required.' });
        return;
      }

      const doc = await DocumentModel.findOne({ _id: id, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Document not found.' });
        return;
      }

      const extractedText = await AiController.extractDocumentText(doc);
      const result = await GeminiAiService.askDocumentAi(
        doc.name,
        extractedText,
        question.trim(),
        history as ChatMessage[]
      );

      await AuditLog.create({
        userId,
        action: 'DOCUMENT_AI_QUERY',
        targetType: 'document',
        targetId: doc._id.toString(),
        details: {
          documentName: doc.name,
          question: question.trim().slice(0, 100),
        },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      res.status(200).json({
        answer: result.answer,
        confidence: result.confidence,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'AI_QNA_ERROR', message: err.message });
    }
  }

  /**
   * Fast Summary endpoint
   * GET /api/ai/summary/:id
   */
  static async getSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const doc = await DocumentModel.findOne({ _id: id, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Document not found.' });
        return;
      }

      if (doc.aiMetadata && doc.aiMetadata.summary) {
        res.status(200).json({ aiMetadata: doc.aiMetadata });
        return;
      }

      // Generate on the fly
      const extractedText = await AiController.extractDocumentText(doc);
      const aiResult = await GeminiAiService.analyzeDocument(doc.name, extractedText, doc.mimeType);

      doc.aiMetadata = aiResult;
      await doc.save();

      res.status(200).json({ aiMetadata: aiResult });
    } catch (err: any) {
      res.status(500).json({ error: 'AI_SUMMARY_ERROR', message: err.message });
    }
  }
}
