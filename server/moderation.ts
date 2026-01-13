import { db } from './db';
import { moderationLogs, insertModerationLogSchema } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

interface ModerationResult {
  isAllowed: boolean;
  moderatedContent?: string;
  action: 'approved' | 'filtered' | 'rewritten' | 'flagged';
  reason?: string;
  sentimentScore?: number;
  toxicityLevel: 'low' | 'medium' | 'high';
}

export class ContentModerationService {
  private badWords: Set<string>;

  constructor() {
    this.badWords = new Set([
      'spam', 'scam', 'fake', 'fraud', 'phishing',
    ]);
  }

  async moderateContent(
    content: string,
    contentType: 'message' | 'comment' | 'blog_post',
    contentId: number,
    userId: string,
    useAI: boolean = false
  ): Promise<ModerationResult> {
    const originalContent = content;
    let moderatedContent = content;
    let action: ModerationResult['action'] = 'approved';
    let reason = '';
    let sentimentScore = 0;
    let toxicityLevel: ModerationResult['toxicityLevel'] = 'low';

    const hasBadWords = this.containsBadWords(content);
    
    if (hasBadWords) {
      moderatedContent = this.cleanContent(content);
      action = 'filtered';
      reason = 'Inappropriate content detected and filtered';
      toxicityLevel = 'medium';
    }

    if (useAI && process.env.OPENAI_API_KEY) {
      try {
        const aiResult = await this.performAIModerationt(content);
        if (aiResult) {
          moderatedContent = aiResult.moderatedText || moderatedContent;
          sentimentScore = aiResult.sentimentScore;
          toxicityLevel = aiResult.toxicityLevel;
          
          if (aiResult.shouldRewrite) {
            action = 'rewritten';
            reason = aiResult.reason || 'AI suggested rewrite for better tone';
          } else if (aiResult.shouldFlag) {
            action = 'flagged';
            reason = aiResult.reason || 'AI detected concerning content';
          }
        }
      } catch (error) {
        console.error('AI moderation failed:', error);
      }
    }

    await this.logModerationAction({
      contentType,
      contentId,
      userId,
      originalText: originalContent,
      moderatedText: moderatedContent !== originalContent ? moderatedContent : null,
      action,
      reason,
      sentimentScore,
      toxicityLevel,
      aiProvider: useAI ? 'openai' : 'basic'
    });

    return {
      isAllowed: action !== 'flagged',
      moderatedContent: moderatedContent !== originalContent ? moderatedContent : undefined,
      action,
      reason,
      sentimentScore,
      toxicityLevel
    };
  }

  private async performAIModerationt(content: string) {
    if (!process.env.OPENAI_API_KEY) return null;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a content moderator for a cybersecurity portfolio website. Analyze content for:
              1. Toxicity/harassment (-100 to 100 sentiment score)
              2. Whether it needs rewriting for professional tone
              3. Whether it should be flagged for admin review
              
              Context: This is a professional cybersecurity site, so technical terms about hacking, penetration testing, vulnerabilities are normal and appropriate.
              
              Respond with JSON: {
                "sentimentScore": number,
                "toxicityLevel": "low"|"medium"|"high",
                "shouldRewrite": boolean,
                "shouldFlag": boolean,
                "moderatedText": "improved version if rewrite needed",
                "reason": "explanation of action"
              }`
            },
            {
              role: 'user',
              content: `Moderate this content: "${content}"`
            }
          ],
          max_tokens: 300,
          temperature: 0.3
        })
      });

      if (!response.ok) throw new Error('OpenAI API failed');
      
      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      return result;
    } catch (error) {
      console.error('AI moderation error:', error);
      return null;
    }
  }

  private async logModerationAction(logData: {
    contentType: string;
    contentId: number;
    userId: string;
    originalText: string;
    moderatedText: string | null;
    action: string;
    reason: string;
    sentimentScore: number;
    toxicityLevel: string;
    aiProvider: string;
  }) {
    try {
      await db.insert(moderationLogs).values({
        contentType: logData.contentType,
        contentId: logData.contentId.toString(),
        userId: logData.userId,
        originalText: logData.originalText,
        moderatedText: logData.moderatedText,
        action: logData.action,
        reason: logData.reason,
        sentimentScore: logData.sentimentScore,
        toxicityLevel: logData.toxicityLevel,
        aiProvider: logData.aiProvider
      });
    } catch (error) {
      console.error('Failed to log moderation action:', error);
    }
  }

  private containsBadWords(content: string): boolean {
    const words = content.toLowerCase().split(/\s+/);
    return words.some(word => this.badWords.has(word));
  }

  private cleanContent(content: string): string {
    const words = content.split(/\s+/);
    return words.map(word => {
      const lowerWord = word.toLowerCase();
      return this.badWords.has(lowerWord) ? '***' : word;
    }).join(' ');
  }

  async getFlaggedContent(limit = 50) {
    return await db.select()
      .from(moderationLogs)
      .where(eq(moderationLogs.action, 'flagged'))
      .orderBy(desc(moderationLogs.createdAt))
      .limit(limit);
  }

  async approveFlaggedContent(logId: number, reviewedBy: string) {
    await db.update(moderationLogs)
      .set({ reviewedBy, action: 'approved' })
      .where(eq(moderationLogs.id, logId));
  }
}

export const contentModerationService = new ContentModerationService();
export const moderationService = contentModerationService;

export default contentModerationService;
