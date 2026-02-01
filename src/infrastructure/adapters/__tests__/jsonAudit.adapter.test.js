/**
 * Unit tests for JSON Audit Adapter
 *
 * Tests the saveAudit, ensureFileExists, readAuditLog, and getAuditLogPath methods.
 * Uses mocked fs module for isolated testing.
 */

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

const fs = require('fs');
const { JsonAuditAdapter } = require('../jsonAudit.adapter');

describe('jsonAudit.adapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new JsonAuditAdapter();
    jest.resetAllMocks();
  });

  describe('getAuditLogPath', () => {
    it('should return a string path', () => {
      const result = adapter.getAuditLogPath();

      expect(typeof result).toBe('string');
    });

    it('should return a path ending with "audit-log.json"', () => {
      const result = adapter.getAuditLogPath();

      expect(result.endsWith('audit-log.json')).toBe(true);
    });
  });

  describe('ensureFileExists', () => {
    it('should create the file if it does not exist', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.endsWith('audit-log.json')) return false;
        return true;
      });

      adapter.ensureFileExists();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('audit-log.json'),
        '[]',
        'utf8'
      );
    });

    it('should create an empty array in the file initially', () => {
      fs.existsSync.mockReturnValue(false);

      adapter.ensureFileExists();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        '[]',
        'utf8'
      );
    });

    it('should create the directory if it does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      adapter.ensureFileExists();

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true }
      );
    });

    it('should not create file if it already exists', () => {
      fs.existsSync.mockReturnValue(true);

      adapter.ensureFileExists();

      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('readAuditLog', () => {
    it('should return an array of entries', () => {
      const mockEntries = [
        {
          userId: 'user-1',
          timestamp: '2026-01-31T10:00:00.000Z',
          originalMessageEncrypted: 'encrypted-data',
          sanitizedMessage: 'Hello world',
        },
      ];

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockEntries));

      const result = adapter.readAuditLog();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(mockEntries);
    });

    it('should return empty array if file has empty array', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('[]');

      const result = adapter.readAuditLog();

      expect(result).toEqual([]);
    });

    it('should handle corrupted JSON gracefully and return empty array', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('{ invalid json content');

      const result = adapter.readAuditLog();

      expect(result).toEqual([]);
    });

    it('should call ensureFileExists before reading', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('[]');

      adapter.readAuditLog();

      expect(fs.existsSync).toHaveBeenCalled();
    });
  });

  describe('saveAudit - appending entries', () => {
    const mockEntry = {
      userId: 'user-123',
      timestamp: '2026-01-31T12:00:00.000Z',
      originalMessageEncrypted: 'encrypted-message',
      sanitizedMessage: 'Hello, my name is <REDACTED: EMAIL>',
    };

    it('should append an entry to the audit log', async () => {
      const existingEntries = [];

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(existingEntries));

      await adapter.saveAudit(mockEntry);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('audit-log.json'),
        expect.stringContaining(mockEntry.userId),
        'utf8'
      );
    });

    it('should return a Promise that resolves when complete', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('[]');

      const result = adapter.saveAudit(mockEntry);

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });

    it('should append to existing entries without overwriting', async () => {
      const existingEntry = {
        userId: 'user-001',
        timestamp: '2026-01-30T10:00:00.000Z',
        originalMessageEncrypted: 'old-encrypted',
        sanitizedMessage: 'old message',
      };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify([existingEntry]));

      await adapter.saveAudit(mockEntry);

      const writtenContent = fs.writeFileSync.mock.calls[0][1];
      const parsedContent = JSON.parse(writtenContent);

      expect(parsedContent).toHaveLength(2);
      expect(parsedContent[0]).toEqual(existingEntry);
      expect(parsedContent[1]).toEqual(mockEntry);
    });

    it('should handle multiple calls appending multiple entries', async () => {
      const entry1 = { ...mockEntry, userId: 'user-1' };
      const entry2 = { ...mockEntry, userId: 'user-2' };
      const entry3 = { ...mockEntry, userId: 'user-3' };

      let currentEntries = [];

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation(() => JSON.stringify(currentEntries));
      fs.writeFileSync.mockImplementation((p, content) => {
        currentEntries = JSON.parse(content);
      });

      await adapter.saveAudit(entry1);
      await adapter.saveAudit(entry2);
      await adapter.saveAudit(entry3);

      expect(currentEntries).toHaveLength(3);
      expect(currentEntries[0].userId).toBe('user-1');
      expect(currentEntries[1].userId).toBe('user-2');
      expect(currentEntries[2].userId).toBe('user-3');
    });

    it('should reject the Promise if write fails', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('[]');
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write permission denied');
      });

      await expect(adapter.saveAudit(mockEntry)).rejects.toThrow(
        'Write permission denied'
      );
    });
  });

  describe('saveAudit - entry structure', () => {
    it('should preserve all entry fields (userId, timestamp, originalMessageEncrypted, sanitizedMessage)', async () => {
      const fullEntry = {
        userId: 'user-456',
        timestamp: '2026-01-31T14:30:00.000Z',
        originalMessageEncrypted: 'aes-256-encrypted-content-here',
        sanitizedMessage:
          'Contact me at <REDACTED: EMAIL> with card <REDACTED: CREDIT_CARD>',
      };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('[]');

      await adapter.saveAudit(fullEntry);

      const writtenContent = fs.writeFileSync.mock.calls[0][1];
      const parsedContent = JSON.parse(writtenContent);
      const savedEntry = parsedContent[0];

      expect(savedEntry.userId).toBe(fullEntry.userId);
      expect(savedEntry.timestamp).toBe(fullEntry.timestamp);
      expect(savedEntry.originalMessageEncrypted).toBe(
        fullEntry.originalMessageEncrypted
      );
      expect(savedEntry.sanitizedMessage).toBe(fullEntry.sanitizedMessage);
    });

    it('should preserve entry with special characters in sanitizedMessage', async () => {
      const entryWithSpecialChars = {
        userId: 'user-special',
        timestamp: '2026-01-31T15:00:00.000Z',
        originalMessageEncrypted: 'encrypted',
        sanitizedMessage:
          'Message with "quotes", \'apostrophes\', and unicode: café 日本語',
      };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('[]');

      await adapter.saveAudit(entryWithSpecialChars);

      const writtenContent = fs.writeFileSync.mock.calls[0][1];
      const parsedContent = JSON.parse(writtenContent);

      expect(parsedContent[0].sanitizedMessage).toBe(
        entryWithSpecialChars.sanitizedMessage
      );
    });

    it('should preserve additional fields if present', async () => {
      const extendedEntry = {
        userId: 'user-extended',
        timestamp: '2026-01-31T16:00:00.000Z',
        originalMessageEncrypted: 'encrypted',
        sanitizedMessage: 'test message',
        extraField: 'extra value',
      };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('[]');

      await adapter.saveAudit(extendedEntry);

      const writtenContent = fs.writeFileSync.mock.calls[0][1];
      const parsedContent = JSON.parse(writtenContent);

      expect(parsedContent[0].extraField).toBe('extra value');
    });
  });
});
