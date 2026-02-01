/**
 * Unit tests for secureInquiry.usecase.js
 *
 * Tests the secure inquiry flow: circuit breaker → sanitize → AI → audit
 */

const {
  createSecureInquiryUseCase,
  CircuitOpenError,
} = require('../secureInquiry.usecase');

describe('secureInquiry.usecase', () => {
  // Mock dependencies
  let sanitizer;
  let circuitBreaker;
  let aiPort;
  let auditDbPort;
  let cryptoUtil;
  let executeSecureInquiry;

  beforeEach(() => {
    // Reset all mocks before each test
    sanitizer = {
      sanitize: jest.fn(),
    };

    circuitBreaker = {
      isOpen: jest.fn(),
      recordFailure: jest.fn(),
      recordSuccess: jest.fn(),
    };

    aiPort = {
      generateAnswer: jest.fn(),
    };

    auditDbPort = {
      saveAudit: jest.fn(),
    };

    cryptoUtil = {
      encrypt: jest.fn(),
    };

    // Default mock behaviors
    circuitBreaker.isOpen.mockReturnValue(false);
    sanitizer.sanitize.mockImplementation((msg) => `sanitized:${msg}`);
    aiPort.generateAnswer.mockResolvedValue('Generated Answer');
    cryptoUtil.encrypt.mockImplementation((text) => `encrypted:${text}`);
    auditDbPort.saveAudit.mockResolvedValue(undefined);

    // Create the use case with mocked dependencies
    executeSecureInquiry = createSecureInquiryUseCase({
      sanitizer,
      circuitBreaker,
      aiPort,
      auditDbPort,
      cryptoUtil,
    });
  });

  describe('CircuitOpenError class', () => {
    it('should have isCircuitOpen property set to true', () => {
      const error = new CircuitOpenError();
      expect(error.isCircuitOpen).toBe(true);
    });

    it('should have name set to CircuitOpenError', () => {
      const error = new CircuitOpenError();
      expect(error.name).toBe('CircuitOpenError');
    });

    it('should have message set to Service Busy', () => {
      const error = new CircuitOpenError();
      expect(error.message).toBe('Service Busy');
    });

    it('should be an instance of Error', () => {
      const error = new CircuitOpenError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('circuit open path', () => {
    beforeEach(() => {
      circuitBreaker.isOpen.mockReturnValue(true);
    });

    it('should throw CircuitOpenError when circuit is open', async () => {
      await expect(
        executeSecureInquiry({ userId: 'user1', message: 'hello' })
      ).rejects.toThrow(CircuitOpenError);
    });

    it('should throw error with isCircuitOpen property set to true', async () => {
      try {
        await executeSecureInquiry({ userId: 'user1', message: 'hello' });
        fail('Expected CircuitOpenError to be thrown');
      } catch (error) {
        expect(error.isCircuitOpen).toBe(true);
      }
    });

    it('should NOT call sanitizer when circuit is open', async () => {
      try {
        await executeSecureInquiry({ userId: 'user1', message: 'hello' });
      } catch {
        // Expected to throw
      }

      expect(sanitizer.sanitize).not.toHaveBeenCalled();
    });

    it('should NOT call AI when circuit is open', async () => {
      try {
        await executeSecureInquiry({ userId: 'user1', message: 'hello' });
      } catch {
        // Expected to throw
      }

      expect(aiPort.generateAnswer).not.toHaveBeenCalled();
    });

    it('should NOT call audit when circuit is open', async () => {
      try {
        await executeSecureInquiry({ userId: 'user1', message: 'hello' });
      } catch {
        // Expected to throw
      }

      expect(auditDbPort.saveAudit).not.toHaveBeenCalled();
    });

    it('should NOT call encrypt when circuit is open', async () => {
      try {
        await executeSecureInquiry({ userId: 'user1', message: 'hello' });
      } catch {
        // Expected to throw
      }

      expect(cryptoUtil.encrypt).not.toHaveBeenCalled();
    });
  });

  describe('success path', () => {
    it('should call sanitizer.sanitize() with the message', async () => {
      const message = 'my secret message';

      await executeSecureInquiry({ userId: 'user1', message });

      expect(sanitizer.sanitize).toHaveBeenCalledTimes(1);
      expect(sanitizer.sanitize).toHaveBeenCalledWith(message);
    });

    it('should call aiPort.generateAnswer() with the SANITIZED message', async () => {
      const originalMessage = 'my email is test@example.com';
      const sanitizedMessage = 'my email is <REDACTED: EMAIL>';
      sanitizer.sanitize.mockReturnValue(sanitizedMessage);

      await executeSecureInquiry({ userId: 'user1', message: originalMessage });

      expect(aiPort.generateAnswer).toHaveBeenCalledTimes(1);
      expect(aiPort.generateAnswer).toHaveBeenCalledWith(sanitizedMessage);
      // Verify original message was NOT passed to AI
      expect(aiPort.generateAnswer).not.toHaveBeenCalledWith(originalMessage);
    });

    it('should call circuitBreaker.recordSuccess() after AI success', async () => {
      await executeSecureInquiry({ userId: 'user1', message: 'hello' });

      expect(circuitBreaker.recordSuccess).toHaveBeenCalledTimes(1);
    });

    it('should call cryptoUtil.encrypt() with the ORIGINAL message', async () => {
      const originalMessage = 'my email is test@example.com';

      await executeSecureInquiry({ userId: 'user1', message: originalMessage });

      expect(cryptoUtil.encrypt).toHaveBeenCalledTimes(1);
      expect(cryptoUtil.encrypt).toHaveBeenCalledWith(originalMessage);
    });

    it('should call auditDbPort.saveAudit() with correct entry shape', async () => {
      const userId = 'user123';
      const originalMessage = 'my email is test@example.com';
      const sanitizedMessage = 'my email is <REDACTED: EMAIL>';
      const encryptedMessage = 'encrypted-data';

      sanitizer.sanitize.mockReturnValue(sanitizedMessage);
      cryptoUtil.encrypt.mockReturnValue(encryptedMessage);

      await executeSecureInquiry({ userId, message: originalMessage });

      expect(auditDbPort.saveAudit).toHaveBeenCalledTimes(1);
      expect(auditDbPort.saveAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          originalMessageEncrypted: encryptedMessage,
          sanitizedMessage,
        })
      );
    });

    it('should return { answer } from AI response', async () => {
      const expectedAnswer = 'This is the AI response';
      aiPort.generateAnswer.mockResolvedValue(expectedAnswer);

      const result = await executeSecureInquiry({
        userId: 'user1',
        message: 'hello',
      });

      expect(result).toEqual({ answer: expectedAnswer });
    });

    it('should call dependencies in correct order', async () => {
      const callOrder = [];

      circuitBreaker.isOpen.mockImplementation(() => {
        callOrder.push('isOpen');
        return false;
      });
      sanitizer.sanitize.mockImplementation((msg) => {
        callOrder.push('sanitize');
        return `sanitized:${msg}`;
      });
      aiPort.generateAnswer.mockImplementation(async () => {
        callOrder.push('generateAnswer');
        return 'answer';
      });
      circuitBreaker.recordSuccess.mockImplementation(() => {
        callOrder.push('recordSuccess');
      });
      cryptoUtil.encrypt.mockImplementation((text) => {
        callOrder.push('encrypt');
        return `encrypted:${text}`;
      });
      auditDbPort.saveAudit.mockImplementation(async () => {
        callOrder.push('saveAudit');
      });

      await executeSecureInquiry({ userId: 'user1', message: 'hello' });

      expect(callOrder).toEqual([
        'isOpen',
        'sanitize',
        'generateAnswer',
        'recordSuccess',
        'encrypt',
        'saveAudit',
      ]);
    });
  });

  describe('failure path (AI fails)', () => {
    const aiError = new Error('AI service unavailable');

    beforeEach(() => {
      aiPort.generateAnswer.mockRejectedValue(aiError);
    });

    it('should call circuitBreaker.recordFailure() when AI rejects', async () => {
      try {
        await executeSecureInquiry({ userId: 'user1', message: 'hello' });
      } catch {
        // Expected to throw
      }

      expect(circuitBreaker.recordFailure).toHaveBeenCalledTimes(1);
    });

    it('should NOT call circuitBreaker.recordSuccess() when AI rejects', async () => {
      try {
        await executeSecureInquiry({ userId: 'user1', message: 'hello' });
      } catch {
        // Expected to throw
      }

      expect(circuitBreaker.recordSuccess).not.toHaveBeenCalled();
    });

    it('should rethrow the AI error', async () => {
      await expect(
        executeSecureInquiry({ userId: 'user1', message: 'hello' })
      ).rejects.toThrow(aiError);
    });

    it('should rethrow the same error instance', async () => {
      try {
        await executeSecureInquiry({ userId: 'user1', message: 'hello' });
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBe(aiError);
      }
    });

    it('should NOT call saveAudit when AI fails', async () => {
      try {
        await executeSecureInquiry({ userId: 'user1', message: 'hello' });
      } catch {
        // Expected to throw
      }

      expect(auditDbPort.saveAudit).not.toHaveBeenCalled();
    });

    it('should NOT call encrypt when AI fails', async () => {
      try {
        await executeSecureInquiry({ userId: 'user1', message: 'hello' });
      } catch {
        // Expected to throw
      }

      expect(cryptoUtil.encrypt).not.toHaveBeenCalled();
    });

    it('should still call sanitizer before AI fails', async () => {
      try {
        await executeSecureInquiry({ userId: 'user1', message: 'hello' });
      } catch {
        // Expected to throw
      }

      expect(sanitizer.sanitize).toHaveBeenCalledTimes(1);
    });
  });

  describe('audit entry shape', () => {
    it('should contain userId in audit entry', async () => {
      const userId = 'test-user-456';

      await executeSecureInquiry({ userId, message: 'hello' });

      const auditEntry = auditDbPort.saveAudit.mock.calls[0][0];
      expect(auditEntry.userId).toBe(userId);
    });

    it('should contain timestamp in audit entry', async () => {
      await executeSecureInquiry({ userId: 'user1', message: 'hello' });

      const auditEntry = auditDbPort.saveAudit.mock.calls[0][0];
      expect(auditEntry).toHaveProperty('timestamp');
    });

    it('should have timestamp in ISO 8601 format', async () => {
      await executeSecureInquiry({ userId: 'user1', message: 'hello' });

      const auditEntry = auditDbPort.saveAudit.mock.calls[0][0];
      // ISO 8601 format regex: YYYY-MM-DDTHH:mm:ss.sssZ
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
      expect(auditEntry.timestamp).toMatch(iso8601Regex);
    });

    it('should contain originalMessageEncrypted in audit entry', async () => {
      const message = 'secret message';
      const encrypted = 'encrypted-secret';
      cryptoUtil.encrypt.mockReturnValue(encrypted);

      await executeSecureInquiry({ userId: 'user1', message });

      const auditEntry = auditDbPort.saveAudit.mock.calls[0][0];
      expect(auditEntry.originalMessageEncrypted).toBe(encrypted);
    });

    it('should contain sanitizedMessage in audit entry', async () => {
      const sanitized = 'sanitized message content';
      sanitizer.sanitize.mockReturnValue(sanitized);

      await executeSecureInquiry({ userId: 'user1', message: 'original' });

      const auditEntry = auditDbPort.saveAudit.mock.calls[0][0];
      expect(auditEntry.sanitizedMessage).toBe(sanitized);
    });

    it('should have all four required properties', async () => {
      await executeSecureInquiry({ userId: 'user1', message: 'hello' });

      const auditEntry = auditDbPort.saveAudit.mock.calls[0][0];
      expect(Object.keys(auditEntry).sort()).toEqual([
        'originalMessageEncrypted',
        'sanitizedMessage',
        'timestamp',
        'userId',
      ]);
    });
  });

  describe('only sanitized message goes to AI', () => {
    it('should never pass original message to generateAnswer', async () => {
      const originalMessage = 'my SSN is 123-45-6789';
      const sanitizedMessage = 'my SSN is <REDACTED: SSN>';
      sanitizer.sanitize.mockReturnValue(sanitizedMessage);

      await executeSecureInquiry({ userId: 'user1', message: originalMessage });

      // Check all calls to generateAnswer
      const allCalls = aiPort.generateAnswer.mock.calls;
      expect(allCalls.length).toBe(1);

      // Verify the argument is the sanitized message
      expect(allCalls[0][0]).toBe(sanitizedMessage);

      // Verify it does NOT contain the original
      expect(allCalls[0][0]).not.toContain('123-45-6789');
    });

    it('should pass result of sanitize() directly to AI', async () => {
      const sanitizeOutput = 'specific-sanitized-output';
      sanitizer.sanitize.mockReturnValue(sanitizeOutput);

      await executeSecureInquiry({ userId: 'user1', message: 'any message' });

      expect(aiPort.generateAnswer).toHaveBeenCalledWith(sanitizeOutput);
    });

    it('should use original message for encryption, not sanitized', async () => {
      const originalMessage = 'original with PII';
      const sanitizedMessage = 'sanitized without PII';
      sanitizer.sanitize.mockReturnValue(sanitizedMessage);

      await executeSecureInquiry({ userId: 'user1', message: originalMessage });

      // Encrypt should get original
      expect(cryptoUtil.encrypt).toHaveBeenCalledWith(originalMessage);
      expect(cryptoUtil.encrypt).not.toHaveBeenCalledWith(sanitizedMessage);
    });
  });

  describe('createSecureInquiryUseCase factory', () => {
    it('should return a function', () => {
      const result = createSecureInquiryUseCase({
        sanitizer,
        circuitBreaker,
        aiPort,
        auditDbPort,
        cryptoUtil,
      });

      expect(typeof result).toBe('function');
    });

    it('should return an async function', async () => {
      const result = executeSecureInquiry({ userId: 'user1', message: 'test' });

      expect(result).toBeInstanceOf(Promise);
      await result; // Clean up the promise
    });
  });
});
